-- ============================================================
-- V2: Add in-app notifications table
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID NOT NULL REFERENCES users(id),
    title          VARCHAR(255) NOT NULL,
    message        TEXT,
    is_read        BOOLEAN NOT NULL DEFAULT false,
    reference_id   UUID,
    reference_type VARCHAR(255),
    created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for fast "unread count" and "list by user" queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_read
    ON notifications(user_id, is_read);
