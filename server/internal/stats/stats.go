// Package stats serves dashboard and report totals computed in the database.
package stats

import (
	"net/http"

	"bookbridge/internal/httpx"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Count struct {
	Label string `json:"label"`
	Count int    `json:"count"`
}

type Month struct {
	Month     string `json:"month"` // YYYY-MM
	Collected int    `json:"collected"`
	Donated   int    `json:"donated"`
}

type Stats struct {
	Titles    int     `json:"titles"`
	Total     int     `json:"total"`
	Available int     `json:"available"`
	Donated   int     `json:"donated"`
	BySubject []Count `json:"by_subject"`
	ByGrade   []Count `json:"by_grade"`
	Monthly   []Month `json:"monthly"`
}

type Handler struct{ pool *pgxpool.Pool }

func NewHandler(pool *pgxpool.Pool) *Handler { return &Handler{pool: pool} }

func (h *Handler) Routes(r chi.Router) {
	r.Get("/stats", h.get)
	r.Get("/languages", h.languages)
}

// languages lists every language in the inventory, most copies first, for the search filter.
func (h *Handler) languages(w http.ResponseWriter, r *http.Request) {
	rows, err := h.pool.Query(r.Context(), `SELECT language, SUM(quantity)::int FROM books GROUP BY language ORDER BY 2 DESC, 1`)
	if err != nil {
		httpx.Internal(w, "languages", err)
		return
	}
	defer rows.Close()
	out := make([]Count, 0)
	for rows.Next() {
		var c Count
		if err := rows.Scan(&c.Label, &c.Count); err != nil {
			httpx.Internal(w, "languages scan", err)
			return
		}
		out = append(out, c)
	}
	if err := rows.Err(); err != nil {
		httpx.Internal(w, "languages", err)
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"data": out})
}

func (h *Handler) get(w http.ResponseWriter, r *http.Request) {
	months, err := httpx.IntQuery(r, "months", 6)
	if err != nil || months < 1 || months > 24 {
		httpx.Error(w, http.StatusBadRequest, "months must be between 1 and 24")
		return
	}
	ctx := r.Context()
	s := Stats{BySubject: []Count{}, ByGrade: []Count{}, Monthly: []Month{}}

	// "Donated" counts every copy no longer available, which includes copies given away before donations were recorded.
	err = h.pool.QueryRow(ctx, `
		SELECT COUNT(*), COALESCE(SUM(quantity), 0), COALESCE(SUM(available_quantity), 0) FROM books`).
		Scan(&s.Titles, &s.Total, &s.Available)
	if err != nil {
		httpx.Internal(w, "stats totals", err)
		return
	}
	s.Donated = s.Total - s.Available

	queries := []struct {
		sql string
		dst *[]Count
	}{
		{`SELECT COALESCE(subject, 'Uncategorised'), SUM(quantity)::int FROM books
		  GROUP BY 1 ORDER BY 2 DESC, 1`, &s.BySubject},
		// A book spanning several bands counts in each band it covers.
		{`SELECT band.label, COALESCE(SUM(b.quantity), 0)::int
		  FROM (VALUES (1, 'K–3', 0, 3), (2, '4–6', 4, 6), (3, '7–9', 7, 9), (4, '10–12', 10, 12)) AS band(ord, label, lo, hi)
		  LEFT JOIN books b ON b.grade_from <= band.hi AND b.grade_to >= band.lo
		  GROUP BY band.ord, band.label ORDER BY band.ord`, &s.ByGrade},
	}
	for _, q := range queries {
		rows, err := h.pool.Query(ctx, q.sql)
		if err != nil {
			httpx.Internal(w, "stats breakdown", err)
			return
		}
		for rows.Next() {
			var c Count
			if err := rows.Scan(&c.Label, &c.Count); err != nil {
				rows.Close()
				httpx.Internal(w, "stats scan", err)
				return
			}
			*q.dst = append(*q.dst, c)
		}
		rows.Close()
	}

	rows, err := h.pool.Query(ctx, `
		WITH m AS (
			SELECT generate_series(date_trunc('month', now()) - ($1 - 1) * interval '1 month', date_trunc('month', now()), interval '1 month') AS start
		)
		SELECT to_char(m.start, 'YYYY-MM'),
		       (SELECT COALESCE(SUM(quantity), 0)::int FROM books WHERE date_trunc('month', created_at) = m.start),
		       (SELECT COUNT(*)::int FROM donations WHERE date_trunc('month', donated_on) = m.start)
		FROM m ORDER BY m.start`, months)
	if err != nil {
		httpx.Internal(w, "stats monthly", err)
		return
	}
	defer rows.Close()
	for rows.Next() {
		var m Month
		if err := rows.Scan(&m.Month, &m.Collected, &m.Donated); err != nil {
			httpx.Internal(w, "stats monthly scan", err)
			return
		}
		s.Monthly = append(s.Monthly, m)
	}
	if err := rows.Err(); err != nil {
		httpx.Internal(w, "stats monthly", err)
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"data": s})
}
