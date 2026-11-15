// Package donation records donated copies, keeps book stock in step, and lets the volunteer
// holding a donated copy pass it on to another volunteer.
package donation

import (
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"bookbridge/internal/httpx"
	"bookbridge/internal/middleware"
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
	OwnerID       *int64    `json:"current_owner_id"`   // who owns the copy now
	OwnerName     *string   `json:"current_owner_name"` // same as volunteer until it's passed on
	Transfers     int       `json:"transfers"`          // how many times it has been passed on
	CreatedAt     time.Time `json:"created_at"`
}

// Transfer is one entry in a copy's donation history: donor, recipient, book and when.
type Transfer struct {
	ID            int64     `json:"id"`
	DonationID    int64     `json:"donation_id"`
	BookID        int64     `json:"book_id"`
	Kind          string    `json:"kind"` // "assign" (admin to user) or "transfer" (owner to volunteer)
	FromID        int64     `json:"from_id"`
	FromName      string    `json:"from_name"`
	ToID          int64     `json:"to_id"`
	ToName        string    `json:"to_name"`
	TransferredOn string    `json:"transferred_on"`
	CreatedAt     time.Time `json:"created_at"`
}

type transferInput struct {
	VolunteerID   int64  `json:"volunteer_id"`   // who receives it
	TransferredOn string `json:"transferred_on"` // optional, YYYY-MM-DD; defaults to today
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
	r.Post("/donations/{id}/transfer", h.transfer)
	r.Get("/donations/{id}/transfers", h.transfers)
	r.Get("/transfers", h.history)
}

const selectDonation = `
	SELECT d.id, d.book_id, b.title, d.child_name, d.grade, d.school, to_char(d.donated_on, 'YYYY-MM-DD'),
	       d.volunteer_id, u.name, d.current_owner_id, hu.name,
	       (SELECT COUNT(*)::int FROM donation_transfers t WHERE t.donation_id = d.id AND t.kind = 'transfer'), d.created_at
	FROM donations d
	JOIN books b ON b.id = d.book_id
	LEFT JOIN users u ON u.id = d.volunteer_id
	LEFT JOIN users hu ON hu.id = d.current_owner_id`

func scan(row pgx.Row) (Donation, error) {
	var d Donation
	err := row.Scan(&d.ID, &d.BookID, &d.BookTitle, &d.ChildName, &d.Grade, &d.School, &d.DonatedOn,
		&d.VolunteerID, &d.VolunteerName, &d.OwnerID, &d.OwnerName, &d.Transfers, &d.CreatedAt)
	return d, err
}

// create is admin only: it lowers the book's available copies and records the recipient in one transaction.
func (h *Handler) create(w http.ResponseWriter, r *http.Request) {
	if !httpx.RequireRole(w, r, "admin") {
		return
	}
	adminID, _ := middleware.UserIDFromContext(r.Context())

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

	// An admin can assign a copy to any registered user.
	var userOK bool
	if err := tx.QueryRow(r.Context(), `SELECT EXISTS (SELECT 1 FROM users WHERE id = $1)`, in.VolunteerID).Scan(&userOK); err != nil {
		httpx.Internal(w, "check recipient", err)
		return
	}
	if !userOK {
		httpx.Error(w, http.StatusBadRequest, "user not found")
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
		INSERT INTO donations (book_id, grade, school, donated_on, volunteer_id, current_owner_id)
		VALUES ($1, $2, $3, $4, $5, $5) RETURNING id`,
		in.BookID, *in.Grade, in.School, donatedOn, in.VolunteerID).Scan(&id)
	if err != nil {
		httpx.Internal(w, "insert donation", err)
		return
	}
	// History: the admin's assignment is the first entry for this copy.
	if _, err := tx.Exec(r.Context(), `
		INSERT INTO donation_transfers (donation_id, book_id, from_id, to_id, transferred_on, kind)
		VALUES ($1, $2, $3, $4, $5, 'assign')`, id, in.BookID, adminID, in.VolunteerID, donatedOn); err != nil {
		httpx.Internal(w, "record assignment", err)
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
	// owner=me lists the donated copies the caller owns right now (holder=me is the older name).
	if r.URL.Query().Get("owner") == "me" || r.URL.Query().Get("holder") == "me" {
		me, _ := middleware.UserIDFromContext(r.Context())
		args = append(args, me)
		where += " AND d.current_owner_id = $" + strconv.Itoa(len(args))
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

// transfer passes a donated copy to another volunteer. Only the volunteer holding it, or an admin,
// can do this. Stock doesn't change: the copy was already counted as donated.
func (h *Handler) transfer(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil || id <= 0 {
		httpx.Error(w, http.StatusBadRequest, "invalid donation id")
		return
	}
	me, _ := middleware.UserIDFromContext(r.Context())
	role, _ := middleware.RoleFromContext(r.Context())

	var in transferInput
	if err := httpx.Decode(r, &in); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid json body")
		return
	}
	if in.VolunteerID <= 0 {
		httpx.Error(w, http.StatusBadRequest, "volunteer_id is required")
		return
	}
	on := time.Now().Format(time.DateOnly)
	if in.TransferredOn != "" {
		d, err := time.Parse(time.DateOnly, in.TransferredOn)
		if err != nil || d.After(time.Now()) {
			httpx.Error(w, http.StatusBadRequest, "transferred_on must be a past date in YYYY-MM-DD format")
			return
		}
		on = in.TransferredOn
	}

	ctx := r.Context()
	tx, err := h.pool.Begin(ctx)
	if err != nil {
		httpx.Internal(w, "begin transfer", err)
		return
	}
	defer tx.Rollback(ctx)

	// Lock the donation so two hand-overs of the same copy can't both succeed.
	var holder *int64
	var donatedOn time.Time
	var bookID int64
	err = tx.QueryRow(ctx, `SELECT current_owner_id, donated_on, book_id FROM donations WHERE id = $1 FOR UPDATE`, id).Scan(&holder, &donatedOn, &bookID)
	if errors.Is(err, pgx.ErrNoRows) {
		httpx.Error(w, http.StatusNotFound, "donation not found")
		return
	}
	if err != nil {
		httpx.Internal(w, "lock donation", err)
		return
	}
	if holder == nil || (*holder != me && role != "admin") {
		httpx.Error(w, http.StatusForbidden, "you can only donate books you currently own")
		return
	}
	if in.VolunteerID == *holder {
		httpx.Error(w, http.StatusBadRequest, "choose a different volunteer")
		return
	}
	if on < donatedOn.Format(time.DateOnly) {
		httpx.Error(w, http.StatusBadRequest, "transferred_on can't be before the donation date")
		return
	}
	var ok bool
	// Volunteers donate to other volunteers; an admin may move a copy to any registered user.
	if err := tx.QueryRow(ctx, `SELECT EXISTS (SELECT 1 FROM users WHERE id = $1 AND (role = 'volunteer' OR $2))`, in.VolunteerID, role == "admin").Scan(&ok); err != nil {
		httpx.Internal(w, "check recipient", err)
		return
	}
	if !ok {
		httpx.Error(w, http.StatusBadRequest, "choose another registered volunteer")
		return
	}

	if _, err := tx.Exec(ctx, `INSERT INTO donation_transfers (donation_id, book_id, from_id, to_id, transferred_on, kind) VALUES ($1, $2, $3, $4, $5, 'transfer')`,
		id, bookID, *holder, in.VolunteerID, on); err != nil {
		httpx.Internal(w, "insert transfer", err)
		return
	}
	if _, err := tx.Exec(ctx, `UPDATE donations SET current_owner_id = $1 WHERE id = $2`, in.VolunteerID, id); err != nil {
		httpx.Internal(w, "update owner", err)
		return
	}
	d, err := scan(tx.QueryRow(ctx, selectDonation+` WHERE d.id = $1`, id))
	if err != nil {
		httpx.Internal(w, "read donation", err)
		return
	}
	if err := tx.Commit(ctx); err != nil {
		httpx.Internal(w, "commit transfer", err)
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"data": d})
}

// transfers lists a donated copy's hand-overs, oldest first.
func (h *Handler) transfers(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil || id <= 0 {
		httpx.Error(w, http.StatusBadRequest, "invalid donation id")
		return
	}
	rows, err := h.pool.Query(r.Context(), `
		SELECT t.id, t.donation_id, t.book_id, t.kind, t.from_id, f.name, t.to_id, tu.name, to_char(t.transferred_on, 'YYYY-MM-DD'), t.created_at
		FROM donation_transfers t
		JOIN users f ON f.id = t.from_id
		JOIN users tu ON tu.id = t.to_id
		WHERE t.donation_id = $1
		ORDER BY t.transferred_on, t.id`, id)
	if err != nil {
		httpx.Internal(w, "list transfers", err)
		return
	}
	defer rows.Close()
	out := make([]Transfer, 0)
	for rows.Next() {
		var t Transfer
		if err := rows.Scan(&t.ID, &t.DonationID, &t.BookID, &t.Kind, &t.FromID, &t.FromName, &t.ToID, &t.ToName, &t.TransferredOn, &t.CreatedAt); err != nil {
			httpx.Internal(w, "scan transfer", err)
			return
		}
		out = append(out, t)
	}
	if err := rows.Err(); err != nil {
		httpx.Internal(w, "list transfers", err)
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"data": out})
}

// HistoryEntry is one row of the admin's history: a single assignment or hand-over, with the
// book's details and who owns that copy now.
type HistoryEntry struct {
	ID             int64     `json:"id"`
	Kind           string    `json:"kind"` // "assign" (admin to user) or "transfer" (owner to volunteer)
	DonationID     int64     `json:"donation_id"`
	BookID         int64     `json:"book_id"`
	BookTitle      string    `json:"book_title"`
	BookAuthor     *string   `json:"book_author"`
	BookSubject    *string   `json:"book_subject"`
	BookCoverURL   *string   `json:"book_cover_url"`
	FromID         int64     `json:"from_id"`
	FromName       string    `json:"from_name"`
	ToID           int64     `json:"to_id"`
	ToName         string    `json:"to_name"`
	TransferredOn  string    `json:"transferred_on"`
	CreatedAt      time.Time `json:"created_at"`
	CurrentOwnerID *int64    `json:"current_owner_id"`
	CurrentOwner   *string   `json:"current_owner_name"`
	RecipientHolds bool      `json:"recipient_still_owns"` // true when this recipient still has the copy
}

// history lists every assignment and transfer across all users, admin only. Records are never
// removed, so this is the complete chain of custody for each copy. Optional filters: book_id,
// user_id (as donor or recipient), q (book title). order=asc gives oldest first; default newest first.
func (h *Handler) history(w http.ResponseWriter, r *http.Request) {
	if !httpx.RequireRole(w, r, "admin") {
		return
	}
	q := r.URL.Query()
	limit, err := httpx.IntQuery(r, "limit", 50)
	if err != nil || limit < 1 {
		httpx.Error(w, http.StatusBadRequest, "limit must be a positive integer")
		return
	}
	limit = min(limit, 200)
	offset, err := httpx.IntQuery(r, "offset", 0)
	if err != nil || offset < 0 {
		httpx.Error(w, http.StatusBadRequest, "offset must be >= 0")
		return
	}

	where, args := []string{"TRUE"}, []any{}
	add := func(clause string, v any) {
		args = append(args, v)
		where = append(where, strings.ReplaceAll(clause, "$?", "$"+strconv.Itoa(len(args))))
	}
	for _, key := range []string{"book_id", "user_id"} {
		raw := q.Get(key)
		if raw == "" {
			continue
		}
		id, err := strconv.ParseInt(raw, 10, 64)
		if err != nil {
			httpx.Error(w, http.StatusBadRequest, key+" must be an integer")
			return
		}
		if key == "book_id" {
			add("t.book_id = $?", id)
		} else {
			add("(t.from_id = $? OR t.to_id = $?)", id)
		}
	}
	if s := strings.TrimSpace(q.Get("q")); s != "" {
		add("b.title ILIKE $?", "%"+s+"%")
	}
	if k := q.Get("kind"); k == "assign" || k == "transfer" {
		add("t.kind = $?", k)
	}
	order := "DESC"
	if q.Get("order") == "asc" {
		order = "ASC"
	}
	cond := strings.Join(where, " AND ")
	from := `
		FROM donation_transfers t
		JOIN books b ON b.id = t.book_id
		JOIN donations d ON d.id = t.donation_id
		JOIN users f ON f.id = t.from_id
		JOIN users tu ON tu.id = t.to_id
		LEFT JOIN users o ON o.id = d.current_owner_id
		WHERE ` + cond

	var total int
	if err := h.pool.QueryRow(r.Context(), `SELECT COUNT(*)`+from, args...).Scan(&total); err != nil {
		httpx.Internal(w, "count history", err)
		return
	}
	n := len(args)
	rows, err := h.pool.Query(r.Context(), `
		SELECT t.id, t.kind, t.donation_id, b.id, b.title, b.author, b.subject, b.cover_url,
		       t.from_id, f.name, t.to_id, tu.name, to_char(t.transferred_on, 'YYYY-MM-DD'), t.created_at,
		       d.current_owner_id, o.name,
		       -- the recipient still owns it if no later entry moved this copy on
		       NOT EXISTS (SELECT 1 FROM donation_transfers l WHERE l.donation_id = t.donation_id AND l.id > t.id)`+
		from+` ORDER BY t.transferred_on `+order+`, t.created_at `+order+`, t.id `+order+
		` LIMIT $`+strconv.Itoa(n+1)+` OFFSET $`+strconv.Itoa(n+2), append(args, limit, offset)...)
	if err != nil {
		httpx.Internal(w, "list history", err)
		return
	}
	defer rows.Close()
	out := make([]HistoryEntry, 0)
	for rows.Next() {
		var e HistoryEntry
		if err := rows.Scan(&e.ID, &e.Kind, &e.DonationID, &e.BookID, &e.BookTitle, &e.BookAuthor, &e.BookSubject, &e.BookCoverURL,
			&e.FromID, &e.FromName, &e.ToID, &e.ToName, &e.TransferredOn, &e.CreatedAt,
			&e.CurrentOwnerID, &e.CurrentOwner, &e.RecipientHolds); err != nil {
			httpx.Internal(w, "scan history", err)
			return
		}
		out = append(out, e)
	}
	if err := rows.Err(); err != nil {
		httpx.Internal(w, "list history", err)
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"data": out, "total": total, "limit": limit, "offset": offset})
}
