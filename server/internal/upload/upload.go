// Package upload stores cover photos on local disk and serves them back.
package upload

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"io"
	"net/http"
	"os"
	"path/filepath"

	"bookbridge/internal/httpx"

	"github.com/go-chi/chi/v5"
)

const maxBytes = 25 << 20 // 25 MB: full-resolution phone photos

var extByType = map[string]string{"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}

type Handler struct{ dir string }

func NewHandler(dir string) (*Handler, error) {
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return nil, err
	}
	return &Handler{dir: dir}, nil
}

// PublicRoutes serves stored images without a token so <Image> can load them.
// File names are 128-bit random, so they can't be guessed.
func (h *Handler) PublicRoutes(r chi.Router) {
	fs := http.StripPrefix("/uploads/", http.FileServer(noListing{http.Dir(h.dir)}))
	r.Get("/uploads/*", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
		w.Header().Set("X-Content-Type-Options", "nosniff")
		fs.ServeHTTP(w, r)
	})
}

func (h *Handler) Routes(r chi.Router) { r.Post("/uploads", h.create) }

// create accepts multipart field "file" and returns {"data":{"url":"/uploads/<name>"}}.
func (h *Handler) create(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, maxBytes+1<<20)
	file, _, err := r.FormFile("file")
	if err != nil {
		var tooBig *http.MaxBytesError
		if errors.As(err, &tooBig) {
			httpx.Error(w, http.StatusRequestEntityTooLarge, "image must be 25 MB or smaller")
			return
		}
		httpx.Error(w, http.StatusBadRequest, "multipart field \"file\" is required")
		return
	}
	defer file.Close()

	// Trust the bytes, not the client's declared type.
	head := make([]byte, 512)
	n, _ := io.ReadFull(file, head)
	ext, ok := extByType[http.DetectContentType(head[:n])]
	if !ok {
		httpx.Error(w, http.StatusUnsupportedMediaType, "only JPEG, PNG or WebP images are accepted")
		return
	}

	buf := make([]byte, 16)
	if _, err := rand.Read(buf); err != nil {
		httpx.Internal(w, "random name", err)
		return
	}
	name := hex.EncodeToString(buf) + ext
	out, err := os.OpenFile(filepath.Join(h.dir, name), os.O_CREATE|os.O_EXCL|os.O_WRONLY, 0o644)
	if err != nil {
		httpx.Internal(w, "create file", err)
		return
	}
	written, err := io.Copy(out, io.MultiReader(bytesReader(head[:n]), io.LimitReader(file, maxBytes)))
	closeErr := out.Close()
	if err != nil || closeErr != nil || written > maxBytes {
		_ = os.Remove(filepath.Join(h.dir, name))
		if written > maxBytes {
			httpx.Error(w, http.StatusRequestEntityTooLarge, "image must be 25 MB or smaller")
			return
		}
		httpx.Internal(w, "write file", errors.Join(err, closeErr))
		return
	}
	httpx.JSON(w, http.StatusCreated, map[string]any{"data": map[string]string{"url": "/uploads/" + name}})
}

type noListing struct{ fs http.FileSystem }

func (n noListing) Open(name string) (http.File, error) {
	f, err := n.fs.Open(name)
	if err != nil {
		return nil, err
	}
	if st, err := f.Stat(); err == nil && st.IsDir() {
		f.Close()
		return nil, os.ErrNotExist
	}
	return f, nil
}
