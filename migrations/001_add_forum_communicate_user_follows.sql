-- Migration: Add Forums, Communicates, and UserFollows tables
-- Date: 2025-10-27
-- Description: System redesign - Forum → Communicate → Post hierarchy + Follow users with notification settings

-- 1. Create Forums table
CREATE TABLE IF NOT EXISTS forums (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name varchar(200) NOT NULL,
    description text,
    icon_url varchar,
    cover_url varchar,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now()
);

-- 2. Create Communicates table
CREATE TABLE IF NOT EXISTS communicates (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    forum_id uuid NOT NULL REFERENCES forums(id) ON DELETE CASCADE,
    name varchar(200) NOT NULL,
    description text,
    icon_url varchar,
    type varchar(50) NOT NULL DEFAULT 'public',
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now()
);

-- 3. Create UserFollows table
CREATE TABLE IF NOT EXISTS user_follows (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id uuid NOT NULL,
    following_id uuid NOT NULL,
    notify_on_post boolean NOT NULL DEFAULT true,
    notify_on_comment boolean NOT NULL DEFAULT true,
    notify_on_vote boolean NOT NULL DEFAULT false,
    created_at timestamp NOT NULL DEFAULT now(),
    UNIQUE(follower_id, following_id)
);

-- 4. Add communicate_id to posts table (nullable for backward compatibility)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS communicate_id uuid;
ALTER TABLE posts ADD CONSTRAINT fk_posts_communicate 
    FOREIGN KEY (communicate_id) REFERENCES communicates(id) ON DELETE SET NULL;

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_communicates_forum_id ON communicates(forum_id);
CREATE INDEX IF NOT EXISTS idx_communicates_is_active ON communicates(is_active);
CREATE INDEX IF NOT EXISTS idx_posts_communicate_id ON posts(communicate_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_forums_is_active ON forums(is_active);

-- 6. Create default forum and communicate for existing posts (optional)
-- Uncomment if you want to migrate existing posts to a default communicate

-- INSERT INTO forums (id, name, description, is_active)
-- VALUES ('00000000-0000-0000-0000-000000000001', 'General', 'Default forum for all content', true)
-- ON CONFLICT (id) DO NOTHING;

-- INSERT INTO communicates (id, forum_id, name, description, type, is_active)
-- VALUES (
--     '00000000-0000-0000-0000-000000000001',
--     '00000000-0000-0000-0000-000000000001',
--     'General Discussion',
--     'Default communicate for all posts',
--     'public',
--     true
-- )
-- ON CONFLICT (id) DO NOTHING;

-- UPDATE posts 
-- SET communicate_id = '00000000-0000-0000-0000-000000000001'
-- WHERE communicate_id IS NULL;

COMMIT;
