package book

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

const bookColumns = `
	id, isbn, title, author, subject, grade_from, grade_to, language, condition,
	quantity, available_quantity, description, cover_url, drive_id, created_by, created_at`

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

func (r *Repository) Create(ctx context.Context, b *Book) (*Book, error) {
	const q = `
		INSERT INTO books (
			isbn, title, author, subject, grade_from, grade_to, language, condition,
			quantity, available_quantity, description, cover_url, drive_id, created_by
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8,
			$9, $10, $11, $12, $13, $14
		)
		RETURNING ` + bookColumns

	row := r.pool.QueryRow(ctx, q,
		b.ISBN, b.Title, b.Author, b.Subject, b.GradeFrom, b.GradeTo, b.Language, b.Condition,
		b.Quantity, b.AvailableQuantity, b.Description, b.CoverURL, b.DriveID, b.CreatedBy,
	)
	return scanBook(row)
}

func (r *Repository) GetByID(ctx context.Context, id int64) (*Book, error) {
	q := `SELECT ` + bookColumns + ` FROM books WHERE id = $1`
	b, err := scanBook(r.pool.QueryRow(ctx, q, id))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	return b, err
}

func (r *Repository) GetByISBN(ctx context.Context, isbn string) (*Book, error) {
	q := `SELECT ` + bookColumns + ` FROM books WHERE isbn = $1 LIMIT 1`
	b, err := scanBook(r.pool.QueryRow(ctx, q, isbn))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	return b, err
}

func (r *Repository) Update(ctx context.Context, b *Book) (*Book, error) {
	const q = `
		UPDATE books SET
			isbn = $1,
			title = $2,
			author = $3,
			subject = $4,
			grade_from = $5,
			grade_to = $6,
			language = $7,
			condition = $8,
			quantity = $9,
			available_quantity = $10,
			description = $11,
			cover_url = $12,
			drive_id = $13
		WHERE id = $14
		RETURNING ` + bookColumns

	row := r.pool.QueryRow(ctx, q,
		b.ISBN, b.Title, b.Author, b.Subject, b.GradeFrom, b.GradeTo, b.Language, b.Condition,
		b.Quantity, b.AvailableQuantity, b.Description, b.CoverURL, b.DriveID, b.ID,
	)
	updated, err := scanBook(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	return updated, err
}

func (r *Repository) Delete(ctx context.Context, id int64) error {
	tag, err := r.pool.Exec(ctx, `DELETE FROM books WHERE id = $1`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *Repository) HasDonations(ctx context.Context, bookID int64) (bool, error) {
	var exists bool
	err := r.pool.QueryRow(ctx, `
		SELECT EXISTS (SELECT 1 FROM donations WHERE book_id = $1)
	`, bookID).Scan(&exists)
	return exists, err
}

func (r *Repository) List(ctx context.Context, f ListFilter) ([]Book, int, error) {
	where, args := buildListWhere(f)

	countQ := `SELECT COUNT(*) FROM books WHERE ` + where
	var total int
	if err := r.pool.QueryRow(ctx, countQ, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	listQ := fmt.Sprintf(
		`SELECT %s FROM books WHERE %s ORDER BY created_at DESC, id DESC LIMIT $%d OFFSET $%d`,
		bookColumns, where, len(args)+1, len(args)+2,
	)
	rows, err := r.pool.Query(ctx, listQ, append(args, f.Limit, f.Offset)...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	books := make([]Book, 0)
	for rows.Next() {
		b, err := scanBook(rows)
		if err != nil {
			return nil, 0, err
		}
		books = append(books, *b)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}
	return books, total, nil
}

func buildListWhere(f ListFilter) (string, []any) {
	clauses := make([]string, 0, 6)
	args := make([]any, 0, 6)

	add := func(clause string, val any) {
		args = append(args, val)
		clauses = append(clauses, fmt.Sprintf(clause, len(args)))
	}

	if f.Subject != "" {
		add("subject = $%d", f.Subject)
	}
	if f.Grade != nil {
		args = append(args, *f.Grade)
		n := len(args)
		clauses = append(clauses, fmt.Sprintf(
			"grade_from IS NOT NULL AND grade_to IS NOT NULL AND grade_from <= $%d AND grade_to >= $%d",
			n, n,
		))
	}
	if f.Language != "" {
		add("language = $%d", f.Language)
	}
	switch f.Status {
	case "available":
		clauses = append(clauses, "available_quantity > 0")
	case "donated":
		clauses = append(clauses, "available_quantity = 0")
	}
	if f.Q != "" {
		args = append(args, "%"+f.Q+"%")
		n := len(args)
		clauses = append(clauses, fmt.Sprintf("(title ILIKE $%d OR author ILIKE $%d)", n, n))
	}

	if len(clauses) == 0 {
		return "TRUE", args
	}
	return strings.Join(clauses, " AND "), args
}

type scannable interface {
	Scan(dest ...any) error
}

func scanBook(row scannable) (*Book, error) {
	var b Book
	err := row.Scan(
		&b.ID, &b.ISBN, &b.Title, &b.Author, &b.Subject, &b.GradeFrom, &b.GradeTo,
		&b.Language, &b.Condition, &b.Quantity, &b.AvailableQuantity, &b.Description,
		&b.CoverURL, &b.DriveID, &b.CreatedBy, &b.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &b, nil
}
