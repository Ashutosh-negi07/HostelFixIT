-- V4: Fix role check constraint to include SUPER_ADMIN
-- V3 ran but the constraint update was rolled back when DataInitializer failed.
-- This migration applies the constraint fix as a separate, clean migration.

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
    ADD CONSTRAINT users_role_check
    CHECK (role IN ('STUDENT', 'WORKER', 'WARDEN', 'ADMIN', 'SUPER_ADMIN'));
