-- V3: Add SUPER_ADMIN support

-- 1. Add admin_id column to hostels (scopes hostel to an owning ADMIN)
ALTER TABLE hostels
    ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES users(id) ON DELETE SET NULL;

COMMENT ON COLUMN hostels.admin_id IS 'The ADMIN who owns/manages this hostel. NULL = visible only to SUPER_ADMIN';

-- 2. Extend the role check constraint to include SUPER_ADMIN
--    The constraint may or may not exist depending on how the DB was initialised.
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
    ADD CONSTRAINT users_role_check
    CHECK (role IN ('STUDENT', 'WORKER', 'WARDEN', 'ADMIN', 'SUPER_ADMIN'));
