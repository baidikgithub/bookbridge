// Package school keeps the list of schools that receive donated books.
package school

import (
	"net/http"
	"strings"
	"time"

	"bookbridge/internal/httpx"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type School struct {
	ID        int64     `json:"id"`
	Name      string    `json:"name"`
	Donations int       `json:"donations"`
	CreatedAt time.Time `json:"created_at"`
}

type Handler struct{ pool *pgxpool.Pool }

func NewHandler(pool *pgxpool.Pool) *Handler { return &Handler{pool: pool} }

func (h *Handler) Routes(r chi.Router) {
	r.Get("/schools", h.list)
	r.Post("/schools", h.create)
}

func (h *Handler) list(w http.ResponseWriter, r *http.Request) {
	q := "%" + strings.TrimSpace(r.URL.Query().Get("q")) + "%"
	rows, err := h.pool.Query(r.Context(), `
		SELECT s.id, s.name, COUNT(d.id)::int, s.created_at
		FROM schools s LEFT JOIN donations d ON lower(d.school) = lower(s.name)
		WHERE s.name ILIKE $1
		GROUP BY s.id ORDER BY COUNT(d.id) DESC, s.name LIMIT 100`, q)
	if err != nil {
		httpx.Internal(w, "list schools", err)
		return
	}
	defer rows.Close()
	out := make([]School, 0)
	for rows.Next() {
		var s School
		if err := rows.Scan(&s.ID, &s.Name, &s.Donations, &s.CreatedAt); err != nil {
			httpx.Internal(w, "scan school", err)
			return
		}
		out = append(out, s)
	}
	if err := rows.Err(); err != nil {
		httpx.Internal(w, "list schools", err)
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"data": out})
}

// create returns the existing school when the name already exists (case-insensitive).
func (h *Handler) create(w http.ResponseWriter, r *http.Request) {
	if !httpx.RequireRole(w, r, "admin") {
		return
	}
	var in struct {
		Name string `json:"name"`
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
	s, err := Ensure(r.Context(), h.pool, in.Name)
	if err != nil {
		httpx.Internal(w, "create school", err)
		return
	}
	httpx.JSON(w, http.StatusCreated, map[string]any{"data": s})
}
