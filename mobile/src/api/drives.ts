import type { CreateDriveInput, Drive } from '../types';
import { json, request } from './client';

export const drivesApi = {
  listDrives: () => request<{ data: Drive[] }>('/drives').then(r => r.data),
  createDrive: (in_: CreateDriveInput) => request<{ data: Drive }>('/drives', json('POST', in_)).then(r => r.data),
};
