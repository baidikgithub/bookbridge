-- Schools that receive books. Donations keep the school name as typed; this table powers the picker.
CREATE TABLE IF NOT EXISTS schools (
	id         BIGSERIAL PRIMARY KEY,
	name       TEXT NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS schools_name_key ON schools (lower(name));

INSERT INTO schools (name)
SELECT DISTINCT ON (lower(school)) school FROM donations ORDER BY lower(school), school
ON CONFLICT DO NOTHING;

CREATE INDEX IF NOT EXISTS books_drive_idx ON books (drive_id);
