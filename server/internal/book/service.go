package book

import (
	"context"
	"errors"
	"strings"
	"unicode/utf8"
)

const (
	defaultLimit = 20
	maxLimit     = 100
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Create(ctx context.Context, userID int64, in CreateBookInput) (*Book, error) {
	b, err := buildBookForCreate(userID, in)
	if err != nil {
		return nil, err
	}

	if b.ISBN != nil {
		existing, err := s.repo.GetByISBN(ctx, *b.ISBN)
		if err != nil && !errors.Is(err, ErrNotFound) {
			return nil, err
		}
		if existing != nil {
			return nil, &DuplicateISBNError{ExistingID: existing.ID}
		}
	}

	return s.repo.Create(ctx, b)
}

func (s *Service) Get(ctx context.Context, id int64) (*Book, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *Service) List(ctx context.Context, f ListFilter) (*ListResult, error) {
	if err := normalizeListFilter(&f); err != nil {
		return nil, err
	}
	items, total, err := s.repo.List(ctx, f)
	if err != nil {
		return nil, err
	}
	return &ListResult{Data: items, Total: total, Limit: f.Limit, Offset: f.Offset}, nil
}

func (s *Service) Update(ctx context.Context, id int64, in UpdateBookInput) (*Book, error) {
	existing, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	merged, err := mergeBookUpdate(existing, in)
	if err != nil {
		return nil, err
	}

	if merged.ISBN != nil {
		other, err := s.repo.GetByISBN(ctx, *merged.ISBN)
		if err != nil && !errors.Is(err, ErrNotFound) {
			return nil, err
		}
		if other != nil && other.ID != merged.ID {
			return nil, &DuplicateISBNError{ExistingID: other.ID}
		}
	}

	return s.repo.Update(ctx, merged)
}

func (s *Service) Delete(ctx context.Context, id int64) error {
	if _, err := s.repo.GetByID(ctx, id); err != nil {
		return err
	}
	has, err := s.repo.HasDonations(ctx, id)
	if err != nil {
		return err
	}
	if has {
		return ErrHasDonations
	}
	return s.repo.Delete(ctx, id)
}

func buildBookForCreate(userID int64, in CreateBookInput) (*Book, error) {
	title := strings.TrimSpace(in.Title)
	if title == "" {
		return nil, &ValidationError{Message: "title is required"}
	}

	qty := 1
	if in.Quantity != nil {
		qty = *in.Quantity
	}
	if qty < 1 {
		return nil, &ValidationError{Message: "quantity must be at least 1"}
	}

	isbn, err := normalizeOptionalString(in.ISBN, 0)
	if err != nil {
		return nil, err
	}
	author, err := normalizeOptionalString(in.Author, 0)
	if err != nil {
		return nil, err
	}
	subject, err := normalizeSubject(in.Subject)
	if err != nil {
		return nil, err
	}
	condition, err := normalizeCondition(in.Condition)
	if err != nil {
		return nil, err
	}
	desc, err := normalizeOptionalString(in.Description, 0)
	if err != nil {
		return nil, err
	}
	cover, err := normalizeOptionalString(in.CoverURL, 0)
	if err != nil {
		return nil, err
	}
	from, to, err := normalizeGrades(in.GradeFrom, in.GradeTo)
	if err != nil {
		return nil, err
	}

	language := "English"
	if in.Language != nil {
		language = strings.TrimSpace(*in.Language)
		if language == "" {
			language = "English"
		}
	}

	createdBy := userID
	return &Book{
		ISBN:              isbn,
		Title:             title,
		Author:            author,
		Subject:           subject,
		GradeFrom:         from,
		GradeTo:           to,
		Language:          language,
		Condition:         condition,
		Quantity:          qty,
		AvailableQuantity: qty,
		Description:       desc,
		CoverURL:          cover,
		DriveID:           in.DriveID,
		CreatedBy:         &createdBy,
	}, nil
}

func mergeBookUpdate(existing *Book, in UpdateBookInput) (*Book, error) {
	out := *existing

	if in.ISBN != nil {
		isbn, err := normalizeOptionalString(in.ISBN, 0)
		if err != nil {
			return nil, err
		}
		out.ISBN = isbn
	}
	if in.Title != nil {
		title := strings.TrimSpace(*in.Title)
		if title == "" {
			return nil, &ValidationError{Message: "title is required"}
		}
		out.Title = title
	}
	if in.Author != nil {
		author, err := normalizeOptionalString(in.Author, 0)
		if err != nil {
			return nil, err
		}
		out.Author = author
	}
	if in.Subject != nil {
		subject, err := normalizeSubject(in.Subject)
		if err != nil {
			return nil, err
		}
		out.Subject = subject
	}
	if in.GradeFrom != nil || in.GradeTo != nil {
		from := out.GradeFrom
		to := out.GradeTo
		if in.GradeFrom != nil {
			from = in.GradeFrom
		}
		if in.GradeTo != nil {
			to = in.GradeTo
		}
		normFrom, normTo, err := normalizeGrades(from, to)
		if err != nil {
			return nil, err
		}
		out.GradeFrom = normFrom
		out.GradeTo = normTo
	}
	if in.Language != nil {
		language := strings.TrimSpace(*in.Language)
		if language == "" {
			return nil, &ValidationError{Message: "language must not be empty"}
		}
		out.Language = language
	}
	if in.Condition != nil {
		condition, err := normalizeCondition(in.Condition)
		if err != nil {
			return nil, err
		}
		out.Condition = condition
	}
	if in.Quantity != nil {
		if *in.Quantity < 1 {
			return nil, &ValidationError{Message: "quantity must be at least 1"}
		}
		out.Quantity = *in.Quantity
	}
	if in.AvailableQuantity != nil {
		if *in.AvailableQuantity < 0 {
			return nil, &ValidationError{Message: "available_quantity must be at least 0"}
		}
		out.AvailableQuantity = *in.AvailableQuantity
	}
	if out.AvailableQuantity > out.Quantity {
		return nil, &ValidationError{Message: "available_quantity must not exceed quantity"}
	}
	if in.Description != nil {
		desc, err := normalizeOptionalString(in.Description, 0)
		if err != nil {
			return nil, err
		}
		out.Description = desc
	}
	if in.CoverURL != nil {
		cover, err := normalizeOptionalString(in.CoverURL, 0)
		if err != nil {
			return nil, err
		}
		out.CoverURL = cover
	}
	if in.DriveID != nil {
		out.DriveID = in.DriveID
	}

	return &out, nil
}

func normalizeListFilter(f *ListFilter) error {
	if f.Limit <= 0 {
		f.Limit = defaultLimit
	}
	if f.Limit > maxLimit {
		f.Limit = maxLimit
	}
	if f.Offset < 0 {
		return &ValidationError{Message: "offset must be >= 0"}
	}
	if f.Subject != "" {
		if _, ok := allowedSubjects[f.Subject]; !ok {
			return &ValidationError{Message: "invalid subject"}
		}
	}
	if f.Grade != nil {
		if *f.Grade < 0 || *f.Grade > 12 {
			return &ValidationError{Message: "grade must be between 0 and 12"}
		}
	}
	if f.Status != "" && f.Status != "available" && f.Status != "donated" {
		return &ValidationError{Message: "status must be available or donated"}
	}
	f.Q = strings.TrimSpace(f.Q)
	f.Language = strings.TrimSpace(f.Language)
	return nil
}

func normalizeSubject(v *string) (*string, error) {
	if v == nil {
		return nil, nil
	}
	s := strings.TrimSpace(*v)
	if s == "" {
		return nil, nil
	}
	if _, ok := allowedSubjects[s]; !ok {
		return nil, &ValidationError{Message: "subject must be one of: Mathematics, Science, Biology, Chemistry, Physics, English, History, Geography, Computer Science, Literature"}
	}
	return &s, nil
}

func normalizeCondition(v *string) (*string, error) {
	if v == nil {
		return nil, nil
	}
	s := strings.TrimSpace(*v)
	if s == "" {
		return nil, nil
	}
	if _, ok := allowedConditions[s]; !ok {
		return nil, &ValidationError{Message: "condition must be one of: Excellent, Good, Fair, Poor"}
	}
	return &s, nil
}

func normalizeGrades(from, to *int16) (*int16, *int16, error) {
	if from == nil && to == nil {
		return nil, nil, nil
	}
	if from == nil || to == nil {
		return nil, nil, &ValidationError{Message: "grade_from and grade_to must both be set"}
	}
	if *from < 0 || *from > 12 || *to < 0 || *to > 12 {
		return nil, nil, &ValidationError{Message: "grade_from and grade_to must be between 0 and 12"}
	}
	if *from > *to {
		return nil, nil, &ValidationError{Message: "grade_from must be less than or equal to grade_to"}
	}
	return from, to, nil
}

func normalizeOptionalString(v *string, maxRunes int) (*string, error) {
	if v == nil {
		return nil, nil
	}
	s := strings.TrimSpace(*v)
	if s == "" {
		return nil, nil
	}
	if maxRunes > 0 && utf8.RuneCountInString(s) > maxRunes {
		return nil, &ValidationError{Message: "value exceeds maximum length"}
	}
	return &s, nil
}
