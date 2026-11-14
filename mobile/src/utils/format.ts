import { COVER_COLORS } from '../constants/books';
import type { Book, Donation } from '../types';

export const gradeLabel = (b: Book) => {
  if (b.grade_from == null || b.grade_to == null) {
    return 'Grade not set';
  }
  return b.grade_from === b.grade_to ? `Grade ${b.grade_from}` : `Grade ${b.grade_from}–${b.grade_to}`;
};

// Stable placeholder colour per book for books without a cover photo.
export const coverColor = (b: Pick<Book, 'id'>) => COVER_COLORS[b.id % COVER_COLORS.length];

// Who a donation is recorded under: the volunteer, or the child for older records.
export const donationPerson = (d: Donation) => d.volunteer_name ?? d.child_name ?? 'Unknown';

// "Baidik Mazumdar" -> "BM"
export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]!.toUpperCase())
    .join('');
