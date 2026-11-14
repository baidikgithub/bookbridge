import type { CreateDonationInput, Donation } from '../types';
import { json, qs, request } from './client';

export const donationsApi = {
  listDonations: (p: { book_id?: number; limit?: number; offset?: number } = {}) =>
    request<{ data: Donation[]; total: number }>(`/donations?${qs(p)}`),
  donate: (in_: CreateDonationInput) => request<{ data: Donation }>('/donations', json('POST', in_)).then(r => r.data),
};
