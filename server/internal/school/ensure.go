package school

import (
	"context"

	"github.com/jackc/pgx/v5"
)

type querier interface {
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
}

// Ensure adds the school if no school with that name (ignoring case) exists, and returns it.
func Ensure(ctx context.Context, db querier, name string) (School, error) {
	var s School
	err := db.QueryRow(ctx, `
		WITH ins AS (
			INSERT INTO schools (name) VALUES ($1) ON CONFLICT (lower(name)) DO NOTHING RETURNING id, name, created_at
		)
		SELECT id, name, created_at FROM ins
		UNION ALL
		SELECT id, name, created_at FROM schools WHERE lower(name) = lower($1)
		LIMIT 1`, name).Scan(&s.ID, &s.Name, &s.CreatedAt)
	return s, err
}
