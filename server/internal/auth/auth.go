package auth

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"net/mail"
	"strconv"
	"strings"
	"time"

	"bookbridge/internal/middleware"

	"github.com/go-chi/chi/v5"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

const tokenTTL = 30 * 24 * time.Hour

type User struct {
	ID        int64     `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"created_at"`
}

type Handler struct {
	pool   *pgxpool.Pool
	secret []byte
	log    *slog.Logger
}

func NewHandler(pool *pgxpool.Pool, secret []byte) *Handler {
	return &Handler{pool: pool, secret: secret, log: slog.Default()}
}

// PublicRoutes need no token.
func (h *Handler) PublicRoutes(r chi.Router) {
	r.Post("/auth/register", h.register)
	r.Post("/auth/login", h.login)
}

// Routes need an authenticated user.
func (h *Handler) Routes(r chi.Router) {
	r.Get("/auth/me", h.me)
}

type credentials struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type authResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

func (h *Handler) register(w http.ResponseWriter, r *http.Request) {
	var in credentials
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json body")
		return
	}
	in.Name = strings.TrimSpace(in.Name)
	in.Email = strings.ToLower(strings.TrimSpace(in.Email))
	if in.Name == "" {
		writeError(w, http.StatusBadRequest, "name is required")
		return
	}
	if _, err := mail.ParseAddress(in.Email); err != nil {
		writeError(w, http.StatusBadRequest, "a valid email is required")
		return
	}
	if len(in.Password) < 8 {
		writeError(w, http.StatusBadRequest, "password must be at least 8 characters")
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(in.Password), bcrypt.DefaultCost)
	if err != nil {
		h.fail(w, "hash password", err)
		return
	}

	// The very first account becomes admin so a fresh install can be managed; everyone else starts as a volunteer.
	var u User
	err = h.pool.QueryRow(r.Context(), `
		INSERT INTO users (name, email, password_hash, role)
		VALUES ($1, $2, $3, CASE WHEN EXISTS (SELECT 1 FROM users) THEN 'volunteer' ELSE 'admin' END)
		RETURNING id, name, email, role, created_at`,
		in.Name, in.Email, string(hash),
	).Scan(&u.ID, &u.Name, &u.Email, &u.Role, &u.CreatedAt)
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == "23505" {
		writeError(w, http.StatusConflict, "email already registered")
		return
	}
	if err != nil {
		h.fail(w, "create user", err)
		return
	}
	h.respondWithToken(w, http.StatusCreated, u)
}

func (h *Handler) login(w http.ResponseWriter, r *http.Request) {
	var in credentials
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json body")
		return
	}

	var u User
	var hash string
	err := h.pool.QueryRow(r.Context(), `
		SELECT id, name, email, role, created_at, password_hash FROM users WHERE email = $1`,
		strings.ToLower(strings.TrimSpace(in.Email)),
	).Scan(&u.ID, &u.Name, &u.Email, &u.Role, &u.CreatedAt, &hash)
	if errors.Is(err, pgx.ErrNoRows) || (err == nil && bcrypt.CompareHashAndPassword([]byte(hash), []byte(in.Password)) != nil) {
		writeError(w, http.StatusUnauthorized, "invalid email or password")
		return
	}
	if err != nil {
		h.fail(w, "login", err)
		return
	}
	h.respondWithToken(w, http.StatusOK, u)
}

func (h *Handler) me(w http.ResponseWriter, r *http.Request) {
	id, _ := middleware.UserIDFromContext(r.Context())
	u, err := h.getUser(r.Context(), id)
	if errors.Is(err, pgx.ErrNoRows) {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	if err != nil {
		h.fail(w, "get user", err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"data": u})
}

func (h *Handler) getUser(ctx context.Context, id int64) (User, error) {
	var u User
	err := h.pool.QueryRow(ctx, `SELECT id, name, email, role, created_at FROM users WHERE id = $1`, id).
		Scan(&u.ID, &u.Name, &u.Email, &u.Role, &u.CreatedAt)
	return u, err
}

func (h *Handler) respondWithToken(w http.ResponseWriter, status int, u User) {
	now := time.Now()
	token, err := jwt.NewWithClaims(jwt.SigningMethodHS256, middleware.Claims{
		Role: u.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   strconv.FormatInt(u.ID, 10),
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(tokenTTL)),
		},
	}).SignedString(h.secret)
	if err != nil {
		h.fail(w, "sign token", err)
		return
	}
	writeJSON(w, status, authResponse{Token: token, User: u})
}

func (h *Handler) fail(w http.ResponseWriter, op string, err error) {
	h.log.Error("auth handler", "op", op, "err", err)
	writeError(w, http.StatusInternalServerError, "internal server error")
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}
