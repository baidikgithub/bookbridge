-- History is permanent: a donation with history can no longer be deleted out from under it.
ALTER TABLE donation_transfers DROP CONSTRAINT IF EXISTS donation_transfers_donation_id_fkey;
ALTER TABLE donation_transfers ADD CONSTRAINT donation_transfers_donation_id_fkey
	FOREIGN KEY (donation_id) REFERENCES donations (id) ON DELETE RESTRICT;
CREATE INDEX IF NOT EXISTS donation_transfers_from_idx ON donation_transfers (from_id);
CREATE INDEX IF NOT EXISTS donation_transfers_to_idx ON donation_transfers (to_id);
