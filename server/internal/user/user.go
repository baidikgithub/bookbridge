// Package user lets admins see accounts and change their roles.
package user

import (
	"errors"
	"net/http"
	"strconv"
	"time"

	"bookbridge/internal/httpx"
	"bookbridge/internal/middleware"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type User struct {
	ID        int64     `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"created_at"`
}

type Handler struct{ pool *pgxpool.Pool }

func NewHandler(pool *pgxpool.Pool) *Handler { return &Handler{pool: pool} }

func (h *Handler) Routes(r chi.Router) {
	r.Get("/users", h.list)
	r.Patch("/users/{id}", h.setRole)
}

func (h *Handler) list(w http.ResponseWriter, r *http.Request) {
	if !httpx.RequireRole(w, r, "admin") {
		return
	}
	// ?role=volunteer narrows the list, e.g. for the donation form's volunteer picker.
	role := r.URL.Query().Get("role")
	rows, err := h.pool.Query(r.Context(), `
		SELECT id, name, email, role, created_at FROM users
		WHERE $1 = '' OR role = $1
		ORDER BY CASE WHEN $1 = '' THEN created_at END, name, id`, role)
	if err != nil {
		httpx.Internal(w, "list users", err)
		return
	}
	defer rows.Close()
	out := make([]User, 0)
	for rows.Next() {
		var u User
		if err := rows.Scan(&u.ID, &u.Name, &u.Email, &u.Role, &u.CreatedAt); err != nil {
			httpx.Internal(w, "scan user", err)
			return
		}
		out = append(out, u)
	}
	if err := rows.Err(); err != nil {
		httpx.Internal(w, "list users", err)
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"data": out})
}

// setRole changes another user's role. The API checks the stored role on every request,
// so the new role applies immediately. The app shows it after they sign in again.
func (h *Handler) setRole(w http.ResponseWriter, r *http.Request) {
	if !httpx.RequireRole(w, r, "admin") {
		return
	}
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid user id")
		return
	}
	if self, _ := middleware.UserIDFromContext(r.Context()); self == id {
		httpx.Error(w, http.StatusBadRequest, "you cannot change your own role")
		return
	}
	var in struct {
		Role string `json:"role"`
	}
	if err := httpx.Decode(r, &in); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid json body")
		return
	}
	if in.Role != "volunteer" && in.Role != "admin" {
		httpx.Error(w, http.StatusBadRequest, "role must be volunteer or admin")
		return
	}
	var u User
	err = h.pool.QueryRow(r.Context(), `
		UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role, created_at`, in.Role, id).
		Scan(&u.ID, &u.Name, &u.Email, &u.Role, &u.CreatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			httpx.Error(w, http.StatusNotFound, "user not found")
			return
		}
		httpx.Internal(w, "set role", err)
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"data": u})
}
