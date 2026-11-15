// Mirrors server/internal/book/model.go.
export type Book = {
  id: number;
  isbn: string | null;
  title: string;
  author: string | null;
  subject: string | null;
  grade_from: number | null;
  grade_to: number | null;
  language: string;
  condition: string | null;
  quantity: number;
  available_quantity: number;
  description: string | null;
  cover_url: string | null;
  drive_id: number | null;
  created_by: number | null;
  created_at: string;
};

export type CreateBookInput = {
  isbn?: string;
  title: string;
  author?: string;
  subject?: string;
  grade_from?: number;
  grade_to?: number;
  language?: string;
  condition?: string;
  quantity?: number;
  description?: string;
  cover_url?: string;
  drive_id?: number;
};

export type UpdateBookInput = Partial<CreateBookInput> & { available_quantity?: number };

export type ListParams = {
  subject?: string;
  grade?: number;
  language?: string;
  status?: 'available' | 'donated';
  q?: string;
  drive_id?: number;
  owner?: 'me'; // only books with a copy the signed-in user owns (Featured)
  limit?: number;
  offset?: number;
};

export type ListResult = { data: Book[]; total: number; limit: number; offset: number };

// A local image picked or captured on the device, before upload.
export type Photo = { uri: string; type?: string; fileName?: string };
