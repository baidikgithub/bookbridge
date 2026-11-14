import type { Book, CreateBookInput, ListParams, ListResult, UpdateBookInput } from '../types';
import { json, qs, request } from './client';

export const booksApi = {
  listBooks: (p: ListParams = {}) => request<ListResult>(`/books?${qs(p)}`),
  getBook: (id: number) => request<{ data: Book }>(`/books/${id}`).then(r => r.data),
  createBook: (in_: CreateBookInput) => request<{ data: Book }>('/books', json('POST', in_)).then(r => r.data),
  updateBook: (id: number, in_: UpdateBookInput) => request<{ data: Book }>(`/books/${id}`, json('PUT', in_)).then(r => r.data),
  deleteBook: (id: number) => request<{ data: { status: string } }>(`/books/${id}`, { method: 'DELETE' }),
};
