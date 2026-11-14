import type { AuthResult } from '../types';
import { json, request } from './client';

export const authApi = {
  login: (email: string, password: string) => request<AuthResult>('/auth/login', json('POST', { email, password })),
  register: (name: string, email: string, password: string) =>
    request<AuthResult>('/auth/register', json('POST', { name, email, password })),
};
