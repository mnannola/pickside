# Core flow measurement
Google sign-in stays on the later roadmap.

## Release
Apply supabase/migrations/202609200003_analytics.sql in Supabase before enabling measurement.
Set ANALYTICS_ENABLED=1 in Vercel Production and redeploy. Leave it off locally and in previews; previews are also explicitly excluded by code.
Run supabase/reports/core-flow.sql privately in Supabase SQL Editor. It returns numerator and denominator for five rates, plus the median votes metric. Divide numerator by denominator and multiply by 100; zero denominator means no data.

## Definitions
- Vote completion: unique eligible browser/matchup opens followed by a saved vote from that same voter hash within 24 hours. Refreshes do not count as new opens. Already-voted, closed, signed-in owner, and created=1 visits are excluded. This measures unique first opens, not every session.
- Creation: accounts registered in the cohort that create within seven days.
- Sharing: matchups created in the cohort with a successful copy or native-share signal within seven days, from any viewer. This does not prove delivery. Cancelled shares and failed copies do not count.
- Repeat creation: first-time registered creators that create a second matchup within seven days.
- Recipient conversion: anonymous browser identities with a first vote in the cohort and a newly registered account observed in the same browser within seven days. It is a lower bound: cookie deletion, other devices, tracking preferences, or missed callbacks cannot be attributed. Earlier anonymous picks are not attached to the account's Activity.
- Median votes: votes during each matchup's first seven days, including zero-vote matchups.

The report defaults to a mature 30-day cohort ending seven days ago. Change the settings dates to your launch date range. Only evaluate tracking-dependent metrics for cohorts beginning after measurement was enabled. Test data in the production database must be excluded manually from pilot reports; there is no automatic bot detector.

## Privacy and reliability
No third-party SDK or additional analytics cookie. Uses the existing pseudonymous voter hash; no email, raw IP, choice text, referrer, or auth token in event tables. Signup attribution stores an account ID and the browser hash privately. These identifiers are pseudonymous, not anonymous.
Browser DNT/GPC signals suppress collection; operational matchups/votes still exist and are used for aggregate reports. Review your privacy notice and applicable consent requirements before enabling collection; this switch is not a consent-management system.
Analytics failures do not roll back votes or shares. Client reports are approximate and spoofable; they are not billing or security records. Sharing without an existing voter cookie is unmeasured. The user-facing flow works with analytics disabled.
Tables have RLS enabled with no browser policies. Reports are private SQL, not a public admin endpoint.
Retain raw measurement data only as long as needed; for a pilot, periodically delete flow_events and flow_signups older than 90 days after saving aggregate reports. Older cohorts then cannot be recomputed.

## Verify
With local analytics explicitly enabled, open a fresh matchup in a new browser and vote, then copy its link. Check flow_events for one open and one copy, and votes for the saved pick. Refreshing must not duplicate opens. A cancelled native share must not record a share. Test with DNT on and analytics off. Test anonymous-voter signup in the same browser and confirm flow_signups records the conversion.
Run npm test, npm run build, and npm run test:e2e before release. Live browser and hosted signup attribution still need preview/production smoke testing; preview analytics is intentionally disabled.
