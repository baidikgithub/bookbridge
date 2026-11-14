import { API_BASE_URL } from '../constants/config';

export class ApiError extends Error {
  constructor(public status: number, message: string, public body: any) {
    super(message);
  }
}

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

// Sends a request with the session token and turns error responses into ApiError.
export async function request<T>(path: string, init?: RequestInit, multipart = false): Promise<T> {
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

// Builds a query string, skipping empty values.
export const qs = (p: Record<string, string | number | undefined>) =>
  Object.entries(p)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&');

export const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) });
