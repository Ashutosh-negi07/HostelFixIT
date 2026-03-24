-- ============================================================
-- V1: Baseline schema — matches the existing database
-- Flyway will NOT run this against existing databases
-- (baseline-on-migrate=true skips V1).
-- It exists so new developers can spin up a fresh DB.
-- ============================================================

-- 1. Hostels
CREATE TABLE IF NOT EXISTS hostels (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       VARCHAR(255) NOT NULL,
    address    VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Users
CREATE TABLE IF NOT EXISTS users (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       VARCHAR(255) NOT NULL,
    phone      BIGINT,
    email      VARCHAR(150) UNIQUE,
    password   VARCHAR(255) NOT NULL,
    role       VARCHAR(255) NOT NULL,
    hostel_id  UUID REFERENCES hostels(id),
    is_active  BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE
);

-- 3. Categories
CREATE TABLE IF NOT EXISTS categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Complaints
CREATE TABLE IF NOT EXISTS complaints (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id         UUID NOT NULL REFERENCES users(id),
    assigned_worker_id UUID REFERENCES users(id),
    hostel_id          UUID NOT NULL REFERENCES hostels(id),
    category_id        UUID NOT NULL REFERENCES categories(id),
    description        TEXT NOT NULL,
    photo_url          VARCHAR(255),
    status             VARCHAR(255) NOT NULL DEFAULT 'PENDING',
    priority           VARCHAR(255) NOT NULL DEFAULT 'NORMAL',
    created_at         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at         TIMESTAMP WITH TIME ZONE,
    resolved_at        TIMESTAMP WITH TIME ZONE
);

-- 5. Feedback
CREATE TABLE IF NOT EXISTS feedback (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL UNIQUE REFERENCES complaints(id),
    rating       INTEGER NOT NULL,
    comment      TEXT,
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Complaint Status History
CREATE TABLE IF NOT EXISTS complaint_status_history (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES complaints(id),
    old_status   VARCHAR(255) NOT NULL,
    new_status   VARCHAR(255) NOT NULL,
    changed_by   UUID NOT NULL REFERENCES users(id),
    changed_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
