-- Run privately in Supabase SQL Editor. Choose a cohort start/end.
-- Open cohorts need 24h to mature; creation cohorts need 7 days.
WITH settings AS (
 SELECT now()-interval '37 days' AS since, now()-interval '7 days' AS until
), opens AS (
 SELECT e.* FROM flow_events e,settings s
 WHERE event='matchup_open' AND e.created_at>=s.since AND e.created_at<s.until
), creations AS (
 SELECT m.* FROM matchups m,settings s WHERE m.created_at>=s.since AND m.created_at<s.until
), users AS (
 SELECT u.id,u.created_at FROM auth.users u,settings s WHERE u.created_at>=s.since AND u.created_at<s.until
), creators AS (
 SELECT owner_id,min(created_at) AS first_created FROM matchups WHERE owner_id IS NOT NULL GROUP BY owner_id
), creator_cohort AS (
 SELECT c.* FROM creators c,settings s WHERE first_created>=s.since AND first_created<s.until
), anonymous_voters AS (
 SELECT v.voter_hash,min(v.created_at) AS first_vote FROM votes v WHERE v.user_id IS NULL GROUP BY v.voter_hash
), recipient_cohort AS (
 SELECT v.* FROM anonymous_voters v,settings s WHERE first_vote>=s.since AND first_vote<s.until
), counts AS (
 SELECT m.slug,(SELECT count(*) FROM votes v WHERE v.matchup_slug=m.slug AND v.created_at < m.created_at+interval '7 days') AS votes
 FROM creations m
)
SELECT 'vote_completion_24h' AS metric,
 count(*) FILTER (WHERE EXISTS (SELECT 1 FROM votes v WHERE v.matchup_slug=o.matchup_slug AND v.voter_hash=o.voter_hash AND v.created_at>=o.created_at AND v.created_at<o.created_at+interval '24 hours'))::numeric AS numerator,
 count(*)::numeric AS denominator FROM opens o
UNION ALL
SELECT 'registered_creation_7d',count(*) FILTER (WHERE EXISTS(SELECT 1 FROM matchups m WHERE m.owner_id=u.id AND m.created_at>=u.created_at AND m.created_at<u.created_at+interval '7 days')),count(*) FROM users u
UNION ALL
SELECT 'share_signal_7d',count(*) FILTER (WHERE EXISTS(SELECT 1 FROM flow_events e WHERE e.matchup_slug=m.slug AND e.event IN ('share_copy','share_native') AND e.created_at>=m.created_at AND e.created_at<m.created_at+interval '7 days')),count(*) FROM creations m
UNION ALL
SELECT 'repeat_creation_7d',count(*) FILTER (WHERE (SELECT count(*) FROM matchups m WHERE m.owner_id=c.owner_id AND m.created_at<c.first_created+interval '7 days')>=2),count(*) FROM creator_cohort c
UNION ALL
SELECT 'recipient_signup_observed_7d',count(*) FILTER (WHERE EXISTS(SELECT 1 FROM flow_signups f WHERE f.voter_hash=v.voter_hash AND f.created_at>=v.first_vote AND f.created_at<v.first_vote+interval '7 days')),count(*) FROM recipient_cohort v
UNION ALL
SELECT 'median_votes_per_matchup_7d',percentile_cont(0.5) WITHIN GROUP (ORDER BY votes)::numeric,NULL::numeric FROM counts;
-- For rates: numerator / denominator * 100; zero denominator means no data.
