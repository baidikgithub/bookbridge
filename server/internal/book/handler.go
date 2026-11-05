package book

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"strconv"
	"strings"

	"bookbridge/internal/middleware"

	"github.com/go-chi/chi/v5"
)

type Handler struct {
	svc *Service
	log *slog.Logger
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc, log: slog.Default()}
}

func (h *Handler) Routes(r chi.Router) {
	r.Post("/books", h.create)
	r.Get("/books", h.list)
	r.Get("/books/{id}", h.get)
	r.Put("/books/{id}", h.update)
	r.Delete("/books/{id}", h.delete)
}

func (h *Handler) create(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var in CreateBookInput
	if err := decodeJSON(r, &in); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json body")
		return
	}

	book, err := h.svc.Create(r.Context(), userID, in)
	if err != nil {
		h.writeServiceError(w, "create book", err)
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{"data": book})
}

func (h *Handler) list(w http.ResponseWriter, r *http.Request) {
	if _, ok := middleware.UserIDFromContext(r.Context()); !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	q := r.URL.Query()
	f := ListFilter{
		Subject:  strings.TrimSpace(q.Get("subject")),
		Language: strings.TrimSpace(q.Get("language")),
		Status:   strings.TrimSpace(q.Get("status")),
		Q:        q.Get("q"),
	}

	if raw := q.Get("grade"); raw != "" {
		g, err := strconv.Atoi(raw)
		if err != nil {
			writeError(w, http.StatusBadRequest, "grade must be an integer")
			return
		}
		f.Grade = &g
	}
	if raw := q.Get("limit"); raw != "" {
		n, err := strconv.Atoi(raw)
		if err != nil {
			writeError(w, http.StatusBadRequest, "limit must be an integer")
			return
		}
		f.Limit = n
	}
	if raw := q.Get("offset"); raw != "" {
		n, err := strconv.Atoi(raw)
		if err != nil {
			writeError(w, http.StatusBadRequest, "offset must be an integer")
			return
		}
		f.Offset = n
	}

	res, err := h.svc.List(r.Context(), f)
	if err != nil {
		h.writeServiceError(w, "list books", err)
		return
	}
	writeJSON(w, http.StatusOK, res)
}

func (h *Handler) get(w http.ResponseWriter, r *http.Request) {
	if _, ok := middleware.UserIDFromContext(r.Context()); !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	id, err := parseIDParam(r)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid book id")
		return
	}

	book, err := h.svc.Get(r.Context(), id)
	if err != nil {
		h.writeServiceError(w, "get book", err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"data": book})
}

func (h *Handler) update(w http.ResponseWriter, r *http.Request) {
	if _, ok := middleware.UserIDFromContext(r.Context()); !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	role, ok := middleware.RoleFromContext(r.Context())
	if !ok || !isCoordinatorOrAdmin(role) {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	id, err := parseIDParam(r)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid book id")
		return
	}

	var in UpdateBookInput
	if err := decodeJSON(r, &in); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json body")
		return
	}

	book, err := h.svc.Update(r.Context(), id, in)
	if err != nil {
		h.writeServiceError(w, "update book", err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"data": book})
}

func (h *Handler) delete(w http.ResponseWriter, r *http.Request) {
	if _, ok := middleware.UserIDFromContext(r.Context()); !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	role, ok := middleware.RoleFromContext(r.Context())
	if !ok || !strings.EqualFold(role, "admin") {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	id, err := parseIDParam(r)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid book id")
		return
	}

	if err := h.svc.Delete(r.Context(), id); err != nil {
		h.writeServiceError(w, "delete book", err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"data": map[string]string{"status": "deleted"}})
}

func (h *Handler) writeServiceError(w http.ResponseWriter, op string, err error) {
	var ve *ValidationError
	if errors.As(err, &ve) {
		writeError(w, http.StatusBadRequest, ve.Message)
		return
	}
	var dup *DuplicateISBNError
	if errors.As(err, &dup) {
		writeJSON(w, http.StatusConflict, map[string]any{
			"error":       "isbn already exists",
			"existing_id": dup.ExistingID,
		})
		return
	}
	switch {
	case errors.Is(err, ErrNotFound):
		writeError(w, http.StatusNotFound, "book not found")
	case errors.Is(err, ErrHasDonations):
		writeError(w, http.StatusConflict, "book has donations")
	case errors.Is(err, ErrUnauthorized):
		writeError(w, http.StatusUnauthorized, "unauthorized")
	case errors.Is(err, ErrForbidden):
		writeError(w, http.StatusForbidden, "forbidden")
	default:
		h.log.Error("book handler", "op", op, "err", err)
		writeError(w, http.StatusInternalServerError, "internal server error")
	}
}

func isCoordinatorOrAdmin(role string) bool {
	return strings.EqualFold(role, "coordinator") || strings.EqualFold(role, "admin")
}

func parseIDParam(r *http.Request) (int64, error) {
	return strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
}

func decodeJSON(r *http.Request, dst any) error {
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	return dec.Decode(dst)
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}
