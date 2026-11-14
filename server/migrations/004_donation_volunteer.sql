-- Donations now record the volunteer chosen in the app; child name is no longer collected.
ALTER TABLE donations ALTER COLUMN child_name DROP NOT NULL;
