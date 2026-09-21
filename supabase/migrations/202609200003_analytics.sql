CREATE TABLE IF NOT EXISTS flow_events (
 event varchar(24) NOT NULL CHECK (event IN ('matchup_open','share_copy','share_native')),
 matchup_slug varchar(12) NOT NULL REFERENCES matchups(slug) ON DELETE CASCADE,
 voter_hash char(64) NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(event,matchup_slug,voter_hash)
);
CREATE INDEX IF NOT EXISTS flow_events_recent ON flow_events(created_at);
ALTER TABLE flow_events ENABLE ROW LEVEL SECURITY;
-- No browser policies: private server connection only.
CREATE TABLE IF NOT EXISTS flow_signups (
 user_id uuid PRIMARY KEY,
 voter_hash char(64) NOT NULL,
 created_at timestamptz NOT NULL
);
ALTER TABLE flow_signups ENABLE ROW LEVEL SECURITY;
