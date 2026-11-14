import type { Count, Stats } from '../types';
import { request } from './client';

export const statsApi = {
  stats: (months: number) => request<{ data: Stats }>(`/stats?months=${months}`).then(r => r.data),
  languages: () => request<{ data: Count[] }>('/languages').then(r => r.data),
};
