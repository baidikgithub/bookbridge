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
  cover_url?: string;
  drive_id?: number;
};

export type ListParams = {
  subject?: string;
  grade?: number;
  language?: string;
  status?: 'available' | 'donated';
  q?: string;
  drive_id?: number;
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

async function request<T>(path: string, init?: RequestInit, multipart = false): Promise<T> {
  const res = await fetch(API_BASE_URL + path, {
    ...init,
    headers: {
      // fetch sets the multipart boundary itself, so leave Content-Type off for uploads.
      ...(multipart ? {} : { 'Content-Type': 'application/json' }),
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
  monthly: { month: string; collected: number; donated: number }[];
};

// Mirrors server/internal/donation.
export type Donation = {
  id: number;
  book_id: number;
  book_title: string;
  child_name: string;
  grade: number;
  school: string;
  donated_on: string;
  volunteer_id: number | null;
  volunteer_name: string | null;
  created_at: string;
};

export type Role = User['role'];

export type School = { id: number; name: string; donations: number };
export type Drive = {
  id: number;
  name: string;
  starts_on: string | null;
  ends_on: string | null;
  titles: number;
  copies: number;
};
export type Photo = { uri: string; type?: string; fileName?: string };
export type Account = User & { created_at: string };

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

  stats: (months: number) => request<{ data: Stats }>(`/stats?months=${months}`).then(r => r.data),

  listDonations: (p: { book_id?: number; limit?: number; offset?: number } = {}) =>
    request<{ data: Donation[]; total: number }>(`/donations?${qs(p)}`),
  donate: (in_: { book_id: number; child_name: string; grade: number; school: string; donated_on?: string }) =>
    request<{ data: Donation }>('/donations', { method: 'POST', body: JSON.stringify(in_) }).then(r => r.data),

  languages: () => request<{ data: { label: string; count: number }[] }>('/languages').then(r => r.data),
  listSchools: (q = '') => request<{ data: School[] }>(`/schools?${qs({ q })}`).then(r => r.data),
  listDrives: () => request<{ data: Drive[] }>('/drives').then(r => r.data),
  createDrive: (in_: { name: string; starts_on?: string; ends_on?: string }) =>
    request<{ data: Drive }>('/drives', { method: 'POST', body: JSON.stringify(in_) }).then(r => r.data),

  // Sends a photo as multipart form data; returns the server path to store as cover_url.
  async uploadImage(photo: Photo): Promise<string> {
    const form = new FormData();
    form.append('file', { uri: photo.uri, type: photo.type ?? 'image/jpeg', name: photo.fileName ?? 'cover.jpg' } as any);
    const body = await request<{ data: { url: string } }>('/uploads', { method: 'POST', body: form, headers: {} }, true);
    return body.data.url;
  },

  listUsers: () => request<{ data: Account[] }>('/users').then(r => r.data),
  setRole: (id: number, role: Role) =>
    request<{ data: Account }>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify({ role }) }).then(r => r.data),

  login: (email: string, password: string) =>
    request<AuthResult>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (name: string, email: string, password: string) =>
    request<AuthResult>('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
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

export const shortDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

// Stored covers are server paths like /uploads/abc.jpg; local photos are file:// URIs.
export const imageUri = (uri: string | null | undefined) => (uri && uri.startsWith('/') ? API_BASE_URL + uri : uri ?? null);

export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// True for a real calendar date written YYYY-MM-DD that is today or earlier.
export const isPastDate = (v: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!m) {
    return false;
  }
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return d.getMonth() === Number(m[2]) - 1 && d.getDate() === Number(m[3]) && v <= today();
};
