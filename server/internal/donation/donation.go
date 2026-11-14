// Package donation records books handed to children and keeps book stock in step.
package donation

import (
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"bookbridge/internal/httpx"
	"bookbridge/internal/school"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Donation struct {
	ID            int64     `json:"id"`
	BookID        int64     `json:"book_id"`
	BookTitle     string    `json:"book_title"`
	ChildName     *string   `json:"child_name"`
	Grade         int16     `json:"grade"`
	School        string    `json:"school"`
	DonatedOn     string    `json:"donated_on"`
	VolunteerID   *int64    `json:"volunteer_id"`
	VolunteerName *string   `json:"volunteer_name"`
	CreatedAt     time.Time `json:"created_at"`
}

type createInput struct {
	BookID      int64  `json:"book_id"`
	VolunteerID int64  `json:"volunteer_id"` // the volunteer who handed the book over
	Grade       *int16 `json:"grade"`
	School      string `json:"school"`
	DonatedOn   string `json:"donated_on"` // optional, YYYY-MM-DD; defaults to today
}

type Handler struct{ pool *pgxpool.Pool }

func NewHandler(pool *pgxpool.Pool) *Handler { return &Handler{pool: pool} }

func (h *Handler) Routes(r chi.Router) {
	r.Get("/donations", h.list)
	r.Post("/donations", h.create)
}

const selectDonation = `
	SELECT d.id, d.book_id, b.title, d.child_name, d.grade, d.school, to_char(d.donated_on, 'YYYY-MM-DD'),
	       d.volunteer_id, u.name, d.created_at
	FROM donations d
	JOIN books b ON b.id = d.book_id
	LEFT JOIN users u ON u.id = d.volunteer_id`

func scan(row pgx.Row) (Donation, error) {
	var d Donation
	err := row.Scan(&d.ID, &d.BookID, &d.BookTitle, &d.ChildName, &d.Grade, &d.School, &d.DonatedOn,
		&d.VolunteerID, &d.VolunteerName, &d.CreatedAt)
	return d, err
}

// create is admin only: it lowers the book's available copies and records the recipient in one transaction.
func (h *Handler) create(w http.ResponseWriter, r *http.Request) {
	if !httpx.RequireRole(w, r, "admin") {
		return
	}

	var in createInput
	if err := httpx.Decode(r, &in); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid json body")
		return
	}
	in.School = strings.TrimSpace(in.School)
	switch {
	case in.BookID <= 0:
		httpx.Error(w, http.StatusBadRequest, "book_id is required")
		return
	case in.VolunteerID <= 0:
		httpx.Error(w, http.StatusBadRequest, "volunteer_id is required")
		return
	case in.School == "":
		httpx.Error(w, http.StatusBadRequest, "school is required")
		return
	case in.Grade == nil || *in.Grade < 0 || *in.Grade > 12:
		httpx.Error(w, http.StatusBadRequest, "grade must be between 0 and 12")
		return
	}
	donatedOn := time.Now().Format(time.DateOnly)
	if in.DonatedOn != "" {
		d, err := time.Parse(time.DateOnly, in.DonatedOn)
		if err != nil || d.After(time.Now()) {
			httpx.Error(w, http.StatusBadRequest, "donated_on must be a past date in YYYY-MM-DD format")
			return
		}
		donatedOn = in.DonatedOn
	}

	tx, err := h.pool.Begin(r.Context())
	if err != nil {
		httpx.Internal(w, "begin donation", err)
		return
	}
	defer tx.Rollback(r.Context())

	var volunteerOK bool
	if err := tx.QueryRow(r.Context(), `SELECT EXISTS (SELECT 1 FROM users WHERE id = $1 AND role = 'volunteer')`, in.VolunteerID).Scan(&volunteerOK); err != nil {
		httpx.Internal(w, "check volunteer", err)
		return
	}
	if !volunteerOK {
		httpx.Error(w, http.StatusBadRequest, "volunteer not found")
		return
	}

	// Row lock stops two admins donating the last copy at the same time.
	var available int
	err = tx.QueryRow(r.Context(), `SELECT available_quantity FROM books WHERE id = $1 FOR UPDATE`, in.BookID).Scan(&available)
	if errors.Is(err, pgx.ErrNoRows) {
		httpx.Error(w, http.StatusNotFound, "book not found")
		return
	}
	if err != nil {
		httpx.Internal(w, "lock book", err)
		return
	}
	if available < 1 {
		httpx.Error(w, http.StatusConflict, "no copies available")
		return
	}
	if _, err := tx.Exec(r.Context(), `UPDATE books SET available_quantity = available_quantity - 1 WHERE id = $1`, in.BookID); err != nil {
		httpx.Internal(w, "decrement stock", err)
		return
	}
	// Save new schools for the picker, and reuse the stored spelling of existing ones.
	sch, err := school.Ensure(r.Context(), tx, in.School)
	if err != nil {
		httpx.Internal(w, "ensure school", err)
		return
	}
	in.School = sch.Name

	var id int64
	err = tx.QueryRow(r.Context(), `
		INSERT INTO donations (book_id, grade, school, donated_on, volunteer_id)
		VALUES ($1, $2, $3, $4, $5) RETURNING id`,
		in.BookID, *in.Grade, in.School, donatedOn, in.VolunteerID).Scan(&id)
	if err != nil {
		httpx.Internal(w, "insert donation", err)
		return
	}
	d, err := scan(tx.QueryRow(r.Context(), selectDonation+` WHERE d.id = $1`, id))
	if err != nil {
		httpx.Internal(w, "read donation", err)
		return
	}
	if err := tx.Commit(r.Context()); err != nil {
		httpx.Internal(w, "commit donation", err)
		return
	}
	httpx.JSON(w, http.StatusCreated, map[string]any{"data": d})
}

// list returns newest donations first, optionally for one book.
func (h *Handler) list(w http.ResponseWriter, r *http.Request) {
	limit, err := httpx.IntQuery(r, "limit", 20)
	if err != nil || limit < 1 {
		httpx.Error(w, http.StatusBadRequest, "limit must be a positive integer")
		return
	}
	limit = min(limit, 100)
	offset, err := httpx.IntQuery(r, "offset", 0)
	if err != nil || offset < 0 {
		httpx.Error(w, http.StatusBadRequest, "offset must be >= 0")
		return
	}

	where, args := "TRUE", []any{}
	if raw := r.URL.Query().Get("book_id"); raw != "" {
		id, err := strconv.ParseInt(raw, 10, 64)
		if err != nil {
			httpx.Error(w, http.StatusBadRequest, "book_id must be an integer")
			return
		}
		where, args = "d.book_id = $1", append(args, id)
	}

	var total int
	if err := h.pool.QueryRow(r.Context(), `SELECT COUNT(*) FROM donations d WHERE `+where, args...).Scan(&total); err != nil {
		httpx.Internal(w, "count donations", err)
		return
	}
	n := len(args)
	rows, err := h.pool.Query(r.Context(),
		selectDonation+` WHERE `+where+` ORDER BY d.donated_on DESC, d.id DESC LIMIT $`+strconv.Itoa(n+1)+` OFFSET $`+strconv.Itoa(n+2),
		append(args, limit, offset)...)
	if err != nil {
		httpx.Internal(w, "list donations", err)
		return
	}
	defer rows.Close()
	out := make([]Donation, 0)
	for rows.Next() {
		d, err := scan(rows)
		if err != nil {
			httpx.Internal(w, "scan donation", err)
			return
		}
		out = append(out, d)
	}
	if err := rows.Err(); err != nil {
		httpx.Internal(w, "list donations", err)
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"data": out, "total": total, "limit": limit, "offset": offset})
}
