CREATE TABLE IF NOT EXISTS matchups (
  slug varchar(12) PRIMARY KEY CHECK (slug ~ '^[A-Za-z0-9_-]{10}$'),
  a_title varchar(80) NOT NULL CHECK (length(trim(a_title)) > 0),
  a_subtitle varchar(120) NOT NULL DEFAULT '',
  b_title varchar(80) NOT NULL CHECK (length(trim(b_title)) > 0),
  b_subtitle varchar(120) NOT NULL DEFAULT '',
  category varchar(32) NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (lower(trim(a_title)) <> lower(trim(b_title)))
);
CREATE TABLE IF NOT EXISTS votes (
  matchup_slug varchar(12) NOT NULL REFERENCES matchups(slug) ON DELETE CASCADE,
  voter_hash char(64) NOT NULL,
  choice char(1) NOT NULL CHECK (choice IN ('A', 'B')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (matchup_slug, voter_hash)
);
-- No browser/anon access. The Next server connects with the private database role.
ALTER TABLE matchups ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
