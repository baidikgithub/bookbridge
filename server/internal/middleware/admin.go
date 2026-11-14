package middleware

import (
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
)

// LoadRole replaces the role from the token with the role stored now.
// A demoted admin loses access on the next request, even with an old token.
// Unknown or missing accounts are signed out.
func LoadRole(pool *pgxpool.Pool) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			id, ok := UserIDFromContext(r.Context())
			var role string
			if !ok || pool.QueryRow(r.Context(), `SELECT role FROM users WHERE id = $1`, id).Scan(&role) != nil || (role != "admin" && role != "volunteer") {
				unauthorized(w)
				return
			}
			next.ServeHTTP(w, r.WithContext(ContextWithUser(r.Context(), id, role)))
		})
	}
}
