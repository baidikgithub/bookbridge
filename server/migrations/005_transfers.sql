-- A donated copy can be passed from one volunteer to another. holder_id is who has it now;
-- donation_transfers keeps the hand-over history. Stock is unaffected: the copy stays donated.
ALTER TABLE donations ADD COLUMN IF NOT EXISTS holder_id BIGINT REFERENCES users (id);
UPDATE donations SET holder_id = volunteer_id WHERE holder_id IS NULL;
CREATE INDEX IF NOT EXISTS donations_holder_idx ON donations (holder_id);

CREATE TABLE IF NOT EXISTS donation_transfers (
	id             BIGSERIAL PRIMARY KEY,
	donation_id    BIGINT NOT NULL REFERENCES donations (id) ON DELETE CASCADE,
	from_id        BIGINT NOT NULL REFERENCES users (id),
	to_id          BIGINT NOT NULL REFERENCES users (id),
	transferred_on DATE NOT NULL DEFAULT CURRENT_DATE,
	created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS donation_transfers_donation_idx ON donation_transfers (donation_id, id);
