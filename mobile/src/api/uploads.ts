import type { Photo } from '../types';
import { request } from './client';

export const uploadsApi = {
  // Sends a photo as multipart form data; returns the server path to store as cover_url.
  async uploadImage(photo: Photo): Promise<string> {
    const form = new FormData();
    form.append('file', { uri: photo.uri, type: photo.type ?? 'image/jpeg', name: photo.fileName ?? 'cover.jpg' } as any);
    const body = await request<{ data: { url: string } }>('/uploads', { method: 'POST', body: form, headers: {} }, true);
    return body.data.url;
  },
};
