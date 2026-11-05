package middleware

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

// Claims is the JWT payload issued by the auth package.
type Claims struct {
	Role string `json:"role"`
	jwt.RegisteredClaims
}

// Authenticate validates the Bearer token and attaches the user to the request context.
func Authenticate(secret []byte) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			raw, ok := strings.CutPrefix(r.Header.Get("Authorization"), "Bearer ")
			if !ok || raw == "" {
				unauthorized(w)
				return
			}

			var c Claims
			_, err := jwt.ParseWithClaims(raw, &c, func(*jwt.Token) (any, error) { return secret, nil },
				jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}),
				jwt.WithExpirationRequired(),
			)
			if err != nil {
				unauthorized(w)
				return
			}
			id, err := strconv.ParseInt(c.Subject, 10, 64)
			if err != nil || id == 0 {
				unauthorized(w)
				return
			}

			next.ServeHTTP(w, r.WithContext(ContextWithUser(r.Context(), id, c.Role)))
		})
	}
}

func unauthorized(w http.ResponseWriter) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusUnauthorized)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": "unauthorized"})
}
