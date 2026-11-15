// Mirrors server/internal/donation.
export type Donation = {
  id: number;
  book_id: number;
  book_title: string;
  child_name: string | null; // older donations only
  grade: number;
  school: string;
  donated_on: string;
  volunteer_id: number | null;
  volunteer_name: string | null;
  current_owner_id: number | null; // who owns the copy now
  current_owner_name: string | null;
  transfers: number; // times it has been passed on
  created_at: string;
};

// One entry in a copy's donation history: the admin's assignment or an owner's hand-over.
export type Transfer = {
  id: number;
  donation_id: number;
  book_id: number;
  kind: 'assign' | 'transfer';
  from_id: number;
  from_name: string;
  to_id: number;
  to_name: string;
  transferred_on: string;
  created_at: string;
};

export type TransferInput = { volunteer_id: number; transferred_on?: string };

export type CreateDonationInput = { book_id: number; volunteer_id: number; grade: number; school: string; donated_on?: string };

// One row of the admin's transfer history, with book details and the copy's current owner.
export type HistoryEntry = {
  id: number;
  kind: 'assign' | 'transfer';
  donation_id: number;
  book_id: number;
  book_title: string;
  book_author: string | null;
  book_subject: string | null;
  book_cover_url: string | null;
  from_id: number;
  from_name: string;
  to_id: number;
  to_name: string;
  transferred_on: string;
  created_at: string;
  current_owner_id: number | null;
  current_owner_name: string | null;
  recipient_still_owns: boolean;
};

export type HistoryParams = {
  book_id?: number;
  user_id?: number;
  q?: string;
  kind?: 'assign' | 'transfer';
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
};
