CREATE TABLE IF NOT EXISTS users (
	id            BIGSERIAL PRIMARY KEY,
	name          TEXT NOT NULL,
	email         TEXT NOT NULL UNIQUE,
	password_hash TEXT NOT NULL,
	role          TEXT NOT NULL DEFAULT 'volunteer' CHECK (role IN ('volunteer', 'coordinator', 'admin')),
	created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS collection_drives (
	id         BIGSERIAL PRIMARY KEY,
	name       TEXT NOT NULL,
	starts_on  DATE,
	ends_on    DATE,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS books (
	id                 BIGSERIAL PRIMARY KEY,
	isbn               TEXT UNIQUE,
	title              TEXT NOT NULL,
	author             TEXT,
	subject            TEXT,
	grade_from         SMALLINT,
	grade_to           SMALLINT,
	language           TEXT NOT NULL DEFAULT 'English',
	condition          TEXT,
	quantity           INT NOT NULL DEFAULT 1 CHECK (quantity >= 1),
	available_quantity INT NOT NULL DEFAULT 1 CHECK (available_quantity >= 0 AND available_quantity <= quantity),
	description        TEXT,
	cover_url          TEXT,
	drive_id           BIGINT REFERENCES collection_drives (id),
	created_by         BIGINT REFERENCES users (id),
	created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS books_subject_idx ON books (subject);
CREATE INDEX IF NOT EXISTS books_created_at_idx ON books (created_at DESC);

CREATE TABLE IF NOT EXISTS donations (
	id           BIGSERIAL PRIMARY KEY,
	book_id      BIGINT NOT NULL REFERENCES books (id),
	child_name   TEXT NOT NULL,
	grade        SMALLINT NOT NULL CHECK (grade BETWEEN 0 AND 12),
	school       TEXT NOT NULL,
	donated_on   DATE NOT NULL DEFAULT CURRENT_DATE,
	volunteer_id BIGINT REFERENCES users (id),
	created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS donations_book_idx ON donations (book_id, donated_on DESC);
CREATE INDEX IF NOT EXISTS donations_date_idx ON donations (donated_on);
