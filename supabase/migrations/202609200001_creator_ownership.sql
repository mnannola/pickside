ALTER TABLE matchups ADD COLUMN IF NOT EXISTS owner_id uuid;
ALTER TABLE matchups ADD COLUMN IF NOT EXISTS closed_at timestamptz;
CREATE INDEX IF NOT EXISTS matchups_owner_created_idx ON matchups (owner_id, created_at DESC) WHERE owner_id IS NOT NULL;

-- The vote and close paths serialize on the same matchup row. A vote either
-- commits before closing or is rejected after closing, even under concurrency.
CREATE OR REPLACE FUNCTION guard_open_matchup_vote() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE ended_at timestamptz;
BEGIN
  SELECT closed_at INTO ended_at FROM matchups WHERE slug = NEW.matchup_slug FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'matchup_not_found' USING ERRCODE = '23503';
  END IF;
  IF ended_at IS NOT NULL THEN
    RAISE EXCEPTION 'matchup_closed' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS votes_require_open_matchup ON votes;
CREATE TRIGGER votes_require_open_matchup BEFORE INSERT ON votes
  FOR EACH ROW EXECUTE FUNCTION guard_open_matchup_vote();

CREATE OR REPLACE FUNCTION guard_matchup_changes() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.slug IS DISTINCT FROM OLD.slug OR NEW.owner_id IS DISTINCT FROM OLD.owner_id THEN
    RAISE EXCEPTION 'matchup_identity_is_immutable';
  END IF;
  IF OLD.closed_at IS NOT NULL AND NEW.closed_at IS DISTINCT FROM OLD.closed_at THEN
    RAISE EXCEPTION 'closed_matchup_is_final';
  END IF;
  IF ROW(NEW.a_title, NEW.a_subtitle, NEW.b_title, NEW.b_subtitle, NEW.category)
     IS DISTINCT FROM ROW(OLD.a_title, OLD.a_subtitle, OLD.b_title, OLD.b_subtitle, OLD.category)
     AND EXISTS (SELECT 1 FROM votes WHERE matchup_slug = OLD.slug) THEN
    RAISE EXCEPTION 'choices_locked_after_first_vote';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS matchups_preserve_ownership_and_choices ON matchups;
CREATE TRIGGER matchups_preserve_ownership_and_choices BEFORE UPDATE ON matchups
  FOR EACH ROW EXECUTE FUNCTION guard_matchup_changes();
-- Existing rows retain NULL owners: public links do not confer ownership.
-- RLS remains enabled with no browser policies. All writes go through the
-- Next server, which verifies Supabase identity and filters on owner_id.
