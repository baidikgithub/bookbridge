import type { Account, Role, Volunteer } from '../types';
import { json, request } from './client';

export const usersApi = {
  listUsers: (role?: Role) => request<{ data: Account[] }>(`/users${role ? `?role=${role}` : ''}`).then(r => r.data),
  // Names only; available to every signed-in user.
  listVolunteers: () => request<{ data: Volunteer[] }>('/volunteers').then(r => r.data),
  setRole: (id: number, role: Role) => request<{ data: Account }>(`/users/${id}`, json('PATCH', { role })).then(r => r.data),
};
