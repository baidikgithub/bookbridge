// Package httpx holds small JSON helpers shared by the HTTP handlers.
package httpx

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strconv"

	"bookbridge/internal/middleware"
)

func JSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func Error(w http.ResponseWriter, status int, msg string) {
	JSON(w, status, map[string]string{"error": msg})
}

// Internal logs the real error and returns a generic 500 to the client.
func Internal(w http.ResponseWriter, op string, err error) {
	slog.Error("handler", "op", op, "err", err)
	Error(w, http.StatusInternalServerError, "internal server error")
}

// Decode reads a JSON body and rejects unknown fields.
func Decode(r *http.Request, dst any) error {
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	return dec.Decode(dst)
}

// IntQuery parses an optional integer query parameter, returning def when absent.
func IntQuery(r *http.Request, key string, def int) (int, error) {
	raw := r.URL.Query().Get(key)
	if raw == "" {
		return def, nil
	}
	return strconv.Atoi(raw)
}

// RequireRole writes 403 and returns false unless the caller has one of the roles.
func RequireRole(w http.ResponseWriter, r *http.Request, roles ...string) bool {
	role, _ := middleware.RoleFromContext(r.Context())
	for _, want := range roles {
		if role == want {
			return true
		}
	}
	Error(w, http.StatusForbidden, "forbidden")
	return false
}
