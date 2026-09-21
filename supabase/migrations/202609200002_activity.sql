ALTER TABLE votes ADD COLUMN IF NOT EXISTS user_id uuid;
CREATE UNIQUE INDEX IF NOT EXISTS votes_user_matchup_unique ON votes (matchup_slug, user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS votes_user_recent_idx ON votes (user_id, created_at DESC) WHERE user_id IS NOT NULL;
-- Existing votes remain anonymous. Browser access remains denied by RLS.
