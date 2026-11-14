import type { School } from '../types';
import { qs, request } from './client';

export const schoolsApi = {
  listSchools: (q = '') => request<{ data: School[] }>(`/schools?${qs({ q })}`).then(r => r.data),
};
