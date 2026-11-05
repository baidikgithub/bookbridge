import { useCallback, useEffect, useState } from 'react';
import { API_BASE_URL } from './config';

// Mirrors server/internal/book/model.go.
export type Book = {
  id: number;
  isbn: string | null;
  title: string;
  author: string | null;
  subject: string | null;
  grade_from: number | null;
  grade_to: number | null;
  language: string;
  condition: string | null;
  quantity: number;
  available_quantity: number;
  description: string | null;
  cover_url: string | null;
  drive_id: number | null;
  created_by: number | null;
  created_at: string;
};

export type CreateBookInput = {
  isbn?: string;
  title: string;
  author?: string;
  subject?: string;
  grade_from?: number;
  grade_to?: number;
  language?: string;
  condition?: string;
  quantity?: number;
  description?: string;
};

export type ListParams = {
  subject?: string;
  grade?: number;
  language?: string;
  status?: 'available' | 'donated';
  q?: string;
  limit?: number;
  offset?: number;
};

type ListResult = { data: Book[]; total: number; limit: number; offset: number };

export const SUBJECTS = [
  'Mathematics',
  'Science',
  'Biology',
  'Chemistry',
  'Physics',
  'English',
  'History',
  'Geography',
  'Computer Science',
  'Literature',
];

export const CONDITIONS = ['Excellent', 'Good', 'Fair', 'Poor'];

export class ApiError extends Error {
  constructor(public status: number, message: string, public body: any) {
    super(message);
  }
}

export type User = { id: number; name: string; email: string; role: 'volunteer' | 'coordinator' | 'admin' };

// Session lives in memory only, so signing in is needed after each app launch.
// Swap in secure storage (e.g. react-native-keychain) to keep people signed in.
let token: string | null = null;
let onUnauthorized: () => void = () => {};
export const session = {
  set: (t: string | null) => {
    token = t;
  },
  onUnauthorized: (fn: () => void) => {
    onUnauthorized = fn;
  },
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(API_BASE_URL + path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && token) {
      onUnauthorized();
    }
    throw new ApiError(res.status, body?.error ?? `Request failed (${res.status})`, body);
  }
  return body as T;
}

export type Stats = {
  titles: number;
  total: number;
  available: number;
  donated: number;
  by_subject: { label: string; count: number }[];
  by_grade: { label: string; count: number }[];
  monthly: { month: string; collected: number }[];
};

type AuthResult = { token: string; user: User };

const qs = (p: Record<string, string | number | undefined>) =>
  Object.entries(p)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&');

export const api = {
  listBooks: (p: ListParams = {}) => request<ListResult>(`/books?${qs(p)}`),
  getBook: (id: number) => request<{ data: Book }>(`/books/${id}`).then(r => r.data),
  createBook: (in_: CreateBookInput) =>
    request<{ data: Book }>('/books', { method: 'POST', body: JSON.stringify(in_) }).then(r => r.data),
  updateBook: (id: number, in_: Partial<CreateBookInput> & { available_quantity?: number }) =>
    request<{ data: Book }>(`/books/${id}`, { method: 'PUT', body: JSON.stringify(in_) }).then(r => r.data),

  login: (email: string, password: string) =>
    request<AuthResult>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (name: string, email: string, password: string) =>
    request<AuthResult>('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),

  // The server caps a page at 100, so dashboards page through everything.
  async allBooks(): Promise<Book[]> {
    const out: Book[] = [];
    for (let offset = 0; ; offset += 100) {
      const page = await api.listBooks({ limit: 100, offset });
      out.push(...page.data);
      if (page.data.length === 0 || out.length >= page.total) {
        return out;
      }
    }
  },
};

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fn, deps);

  const load = useCallback(() => {
    let live = true;
    setLoading(true);
    setError(null);
    run()
      .then(d => live && setData(d))
      .catch(e => live && setError(e instanceof Error ? e.message : String(e)))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [run]);

  useEffect(load, [load]);
  const reload = useCallback(() => {
    load();
  }, [load]);
  return { data, error, loading, reload, setData };
}

const GRADE_BANDS: [string, number, number][] = [
  ['K–3', 0, 3],
  ['4–6', 4, 6],
  ['7–9', 7, 9],
  ['10–12', 10, 12],
];

// Dashboard totals worked out on the phone from the full book list.
export function computeStats(books: Book[], months = 12): Stats {
  const subj = new Map<string, number>();
  const grade = new Map<string, number>(GRADE_BANDS.map(([l]) => [l, 0]));
  const now = new Date();
  const keys: string[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  const month = new Map<string, number>(keys.map(k => [k, 0]));
  let total = 0;
  let available = 0;

  for (const b of books) {
    total += b.quantity;
    available += b.available_quantity;
    const s = b.subject ?? 'Uncategorised';
    subj.set(s, (subj.get(s) ?? 0) + b.quantity);
    if (b.grade_from != null && b.grade_to != null) {
      for (const [label, lo, hi] of GRADE_BANDS) {
        if (b.grade_from <= hi && b.grade_to >= lo) {
          grade.set(label, (grade.get(label) ?? 0) + b.quantity);
        }
      }
    }
    const d = new Date(b.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (month.has(key)) {
      month.set(key, month.get(key)! + b.quantity);
    }
  }

  return {
    titles: books.length,
    total,
    available,
    donated: total - available,
    by_subject: [...subj.entries()].sort((a, b) => b[1] - a[1]).map(([label, count]) => ({ label, count })),
    by_grade: [...grade.entries()].map(([label, count]) => ({ label, count })),
    monthly: keys.map(k => ({ month: k, collected: month.get(k)! })),
  };
}

export const gradeLabel = (b: Book) => {
  if (b.grade_from == null || b.grade_to == null) {
    return 'Grade not set';
  }
  return b.grade_from === b.grade_to ? `Grade ${b.grade_from}` : `Grade ${b.grade_from}–${b.grade_to}`;
};

// Stable placeholder colour per book until cover photos are stored.
const COVERS = ['#7A2E2E', '#2E5E4E', '#2F4BD0', '#8A5A12', '#4B3B7A'];
export const coverColor = (b: Pick<Book, 'id'>) => COVERS[b.id % COVERS.length];

export const monthLabel = (key: string) =>
  new Date(`${key}-01T00:00:00`).toLocaleDateString('en-GB', { month: 'short' });
