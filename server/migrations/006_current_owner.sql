-- Ownership is tracked as current_owner_id, and donation_transfers becomes the full history:
-- the admin's first assignment ('assign') and each volunteer hand-over ('transfer'), with donor,
-- recipient, book and timestamp.
ALTER TABLE donations RENAME COLUMN holder_id TO current_owner_id;
ALTER INDEX IF EXISTS donations_holder_idx RENAME TO donations_owner_idx;

ALTER TABLE donation_transfers ADD COLUMN IF NOT EXISTS book_id BIGINT REFERENCES books (id);
ALTER TABLE donation_transfers ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'transfer' CHECK (kind IN ('assign', 'transfer'));
UPDATE donation_transfers t SET book_id = d.book_id FROM donations d WHERE d.id = t.donation_id AND t.book_id IS NULL;

-- Record the original assignment for donations made before history existed (donor unknown → the admin who created the book, if any).
INSERT INTO donation_transfers (donation_id, book_id, from_id, to_id, transferred_on, created_at, kind)
SELECT d.id, d.book_id, COALESCE(b.created_by, d.volunteer_id), d.volunteer_id, d.donated_on, d.created_at, 'assign'
FROM donations d JOIN books b ON b.id = d.book_id
WHERE d.volunteer_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM donation_transfers t WHERE t.donation_id = d.id AND t.kind = 'assign');

ALTER TABLE donation_transfers ALTER COLUMN book_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS donation_transfers_book_idx ON donation_transfers (book_id, created_at);
