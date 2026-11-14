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
  created_at: string;
};

export type CreateDonationInput = { book_id: number; volunteer_id: number; grade: number; school: string; donated_on?: string };
