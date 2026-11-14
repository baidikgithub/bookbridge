-- Coordinator is no longer a role. Existing coordinators become volunteers.
UPDATE users SET role = 'volunteer' WHERE role = 'coordinator';

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('volunteer', 'admin'));
