import type { CreateDonationInput, Donation, HistoryEntry, HistoryParams, Transfer, TransferInput } from '../types';
import { json, qs, request } from './client';

export const donationsApi = {
  // owner: 'me' lists the donated copies the signed-in user owns right now.
  listDonations: (p: { book_id?: number; owner?: 'me'; limit?: number; offset?: number } = {}) =>
    request<{ data: Donation[]; total: number }>(`/donations?${qs(p)}`),
  donate: (in_: CreateDonationInput) => request<{ data: Donation }>('/donations', json('POST', in_)).then(r => r.data),
  // Donate an owned copy onward. Only its current owner (or an admin) can.
  transfer: (donationId: number, in_: TransferInput) =>
    request<{ data: Donation }>(`/donations/${donationId}/transfer`, json('POST', in_)).then(r => r.data),
  // Admin only: every assignment and transfer across all users.
  history: (p: HistoryParams = {}) =>
    request<{ data: HistoryEntry[]; total: number }>(`/transfers?${qs(p)}`),
  listTransfers: (donationId: number) => request<{ data: Transfer[] }>(`/donations/${donationId}/transfers`).then(r => r.data),
};
