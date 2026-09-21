# Activity release
Apply supabase/migrations/202609200002_activity.sql in Supabase SQL Editor before deploying this feature. It adds a nullable account ID to votes and indexes; previous votes remain anonymous. Local development applies it automatically.

Activity is available through My Matchups → Activity at /activity. It lists picks made while signed in, newest first, twenty per page, with current percentages and links to results. It remains available after voting closes. Signed-out visitors are sent to sign-in and returned to Activity.

Votes remain public only as totals. Account IDs are not returned in public matchup data. Database RLS still denies direct browser access. Verified server identity determines whose activity is read and whose new vote is saved. A unique database index prevents repeat account votes across browsers; existing anonymous-cookie duplicate prevention remains in place. Earlier anonymous picks are not imported.

Preview checks:
1. Apply the migration, deploy the feature, and sign in.
2. Vote on a fresh matchup; open My Matchups → Activity and verify the choice and totals.
3. Sign in to the same account in a separate browser; reopen the matchup. Results should show the same pick, with no new vote.
4. Sign in as a different user in a separate browser; confirm the first user's history is absent.
5. Vote anonymously in a fresh private browser; confirm no sign-in is needed.
6. Close a participated matchup and confirm it remains in Activity.
7. Check empty history, mobile layout, and pagination before merging.

This branch includes the preceding card cleanup; merge that PR first if it is still open.
