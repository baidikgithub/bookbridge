export type Role = 'volunteer' | 'admin';

export type User = { id: number; name: string; email: string; role: Role };

// A user as listed on the Users screen.
export type Account = User & { created_at: string };

export type AuthResult = { token: string; user: User };
