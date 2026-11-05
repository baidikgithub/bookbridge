package middleware

import "context"

type contextKey int

const (
	userIDKey contextKey = iota
	roleKey
)

func UserIDFromContext(ctx context.Context) (int64, bool) {
	id, ok := ctx.Value(userIDKey).(int64)
	if !ok || id == 0 {
		return 0, false
	}
	return id, true
}

func RoleFromContext(ctx context.Context) (string, bool) {
	role, ok := ctx.Value(roleKey).(string)
	if !ok || role == "" {
		return "", false
	}
	return role, true
}

// ContextWithUser is used by JWT auth middleware to attach identity to the request.
func ContextWithUser(ctx context.Context, userID int64, role string) context.Context {
	ctx = context.WithValue(ctx, userIDKey, userID)
	return context.WithValue(ctx, roleKey, role)
}
