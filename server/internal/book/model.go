package book

import (
	"errors"
	"time"
)

var (
	ErrNotFound      = errors.New("book not found")
	ErrValidation    = errors.New("validation error")
	ErrDuplicateISBN = errors.New("isbn already exists")
	ErrHasDonations  = errors.New("book has donations")
	ErrUnauthorized  = errors.New("unauthorized")
	ErrForbidden     = errors.New("forbidden")
)

// ValidationError is a typed 400 with a client-safe message.
type ValidationError struct {
	Message string
}

func (e *ValidationError) Error() string { return e.Message }
func (e *ValidationError) Unwrap() error { return ErrValidation }

// DuplicateISBNError is a 409 that includes the existing book id.
type DuplicateISBNError struct {
	ExistingID int64
}

func (e *DuplicateISBNError) Error() string { return ErrDuplicateISBN.Error() }
func (e *DuplicateISBNError) Unwrap() error { return ErrDuplicateISBN }

var allowedSubjects = map[string]struct{}{
	"Mathematics":      {},
	"Science":          {},
	"Biology":          {},
	"Chemistry":        {},
	"Physics":          {},
	"English":          {},
	"History":          {},
	"Geography":        {},
	"Computer Science": {},
	"Literature":       {},
}

var allowedConditions = map[string]struct{}{
	"Excellent": {},
	"Good":      {},
	"Fair":      {},
	"Poor":      {},
}

type Book struct {
	ID                int64     `json:"id"`
	ISBN              *string   `json:"isbn"`
	Title             string    `json:"title"`
	Author            *string   `json:"author"`
	Subject           *string   `json:"subject"`
	GradeFrom         *int16    `json:"grade_from"`
	GradeTo           *int16    `json:"grade_to"`
	Language          string    `json:"language"`
	Condition         *string   `json:"condition"`
	Quantity          int       `json:"quantity"`
	AvailableQuantity int       `json:"available_quantity"`
	Description       *string   `json:"description"`
	CoverURL          *string   `json:"cover_url"`
	DriveID           *int64    `json:"drive_id"`
	CreatedBy         *int64    `json:"created_by"`
	CreatedAt         time.Time `json:"created_at"`
}

type CreateBookInput struct {
	ISBN        *string `json:"isbn"`
	Title       string  `json:"title"`
	Author      *string `json:"author"`
	Subject     *string `json:"subject"`
	GradeFrom   *int16  `json:"grade_from"`
	GradeTo     *int16  `json:"grade_to"`
	Language    *string `json:"language"`
	Condition   *string `json:"condition"`
	Quantity    *int    `json:"quantity"`
	Description *string `json:"description"`
	CoverURL    *string `json:"cover_url"`
	DriveID     *int64  `json:"drive_id"`
}

type UpdateBookInput struct {
	ISBN              *string `json:"isbn"`
	Title             *string `json:"title"`
	Author            *string `json:"author"`
	Subject           *string `json:"subject"`
	GradeFrom         *int16  `json:"grade_from"`
	GradeTo           *int16  `json:"grade_to"`
	Language          *string `json:"language"`
	Condition         *string `json:"condition"`
	Quantity          *int    `json:"quantity"`
	AvailableQuantity *int    `json:"available_quantity"`
	Description       *string `json:"description"`
	CoverURL          *string `json:"cover_url"`
	DriveID           *int64  `json:"drive_id"`
}

type ListFilter struct {
	Subject  string
	Grade    *int
	Language string
	Status   string
	Q        string
	Limit    int
	Offset   int
}

type ListResult struct {
	Data   []Book `json:"data"`
	Total  int    `json:"total"`
	Limit  int    `json:"limit"`
	Offset int    `json:"offset"`
}
