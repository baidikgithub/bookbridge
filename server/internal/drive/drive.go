// Package drive manages collection drives, the events where books are gathered.
package drive

import (
	"net/http"
	"strings"
	"time"

	"bookbridge/internal/httpx"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Drive struct {
	ID        int64     `json:"id"`
	Name      string    `json:"name"`
	StartsOn  *string   `json:"starts_on"`
	EndsOn    *string   `json:"ends_on"`
	Titles    int       `json:"titles"`
	Copies    int       `json:"copies"`
	CreatedAt time.Time `json:"created_at"`
}

type Handler struct{ pool *pgxpool.Pool }

func NewHandler(pool *pgxpool.Pool) *Handler { return &Handler{pool: pool} }

func (h *Handler) Routes(r chi.Router) {
	r.Get("/drives", h.list)
	r.Post("/drives", h.create)
}

const selectDrive = `
	SELECT d.id, d.name, to_char(d.starts_on, 'YYYY-MM-DD'), to_char(d.ends_on, 'YYYY-MM-DD'),
	       COUNT(b.id)::int, COALESCE(SUM(b.quantity), 0)::int, d.created_at
	FROM collection_drives d LEFT JOIN books b ON b.drive_id = d.id`

func (h *Handler) list(w http.ResponseWriter, r *http.Request) {
	rows, err := h.pool.Query(r.Context(), selectDrive+`
		GROUP BY d.id ORDER BY COALESCE(d.starts_on, d.created_at::date) DESC, d.id DESC`)
	if err != nil {
		httpx.Internal(w, "list drives", err)
		return
	}
	defer rows.Close()
	out := make([]Drive, 0)
	for rows.Next() {
		var d Drive
		if err := rows.Scan(&d.ID, &d.Name, &d.StartsOn, &d.EndsOn, &d.Titles, &d.Copies, &d.CreatedAt); err != nil {
			httpx.Internal(w, "scan drive", err)
			return
		}
		out = append(out, d)
	}
	if err := rows.Err(); err != nil {
		httpx.Internal(w, "list drives", err)
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"data": out})
}

func (h *Handler) create(w http.ResponseWriter, r *http.Request) {
	if !httpx.RequireRole(w, r, "coordinator", "admin") {
		return
	}
	var in struct {
		Name     string  `json:"name"`
		StartsOn *string `json:"starts_on"`
		EndsOn   *string `json:"ends_on"`
	}
	if err := httpx.Decode(r, &in); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid json body")
		return
	}
	in.Name = strings.TrimSpace(in.Name)
	if in.Name == "" || len(in.Name) > 200 {
		httpx.Error(w, http.StatusBadRequest, "name is required (max 200 characters)")
		return
	}
	var start, end *time.Time
	for _, p := range []struct {
		raw **string
		dst **time.Time
		key string
	}{{&in.StartsOn, &start, "starts_on"}, {&in.EndsOn, &end, "ends_on"}} {
		if *p.raw == nil || strings.TrimSpace(**p.raw) == "" {
			*p.raw = nil
			continue
		}
		t, err := time.Parse(time.DateOnly, strings.TrimSpace(**p.raw))
		if err != nil {
			httpx.Error(w, http.StatusBadRequest, p.key+" must be YYYY-MM-DD")
			return
		}
		*p.dst = &t
	}
	if start != nil && end != nil && end.Before(*start) {
		httpx.Error(w, http.StatusBadRequest, "ends_on must be on or after starts_on")
		return
	}

	var id int64
	if err := h.pool.QueryRow(r.Context(),
		`INSERT INTO collection_drives (name, starts_on, ends_on) VALUES ($1, $2, $3) RETURNING id`,
		in.Name, start, end).Scan(&id); err != nil {
		httpx.Internal(w, "create drive", err)
		return
	}
	var d Drive
	if err := h.pool.QueryRow(r.Context(), selectDrive+` WHERE d.id = $1 GROUP BY d.id`, id).
		Scan(&d.ID, &d.Name, &d.StartsOn, &d.EndsOn, &d.Titles, &d.Copies, &d.CreatedAt); err != nil {
		httpx.Internal(w, "read drive", err)
		return
	}
	httpx.JSON(w, http.StatusCreated, map[string]any{"data": d})
}
