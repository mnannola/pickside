# Creator accounts: preview and release

This phase adds email-link sign-in, My Matchups, creator ownership, and permanent closing of voting. Anonymous voting still works. Old anonymous matchups remain public and unowned; knowing their link does not grant management access. There is no editing interface; the database also prevents changing choices after the first vote.

## 1. Apply the new database migration

In the Supabase SQL editor, run the contents of `supabase/migrations/202609200001_creator_ownership.sql` before deploying this branch. The original migration is already applied to your project. The new migration preserves existing matchups and votes, and can be rerun.

Alternatively, with DATABASE_URL set securely in your environment, run `npm run db:migrate`. Do not commit database credentials.

## 2. Configure Vercel

Add these variables for Preview and Production:
- NEXT_PUBLIC_SUPABASE_URL: your Supabase project URL.
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: your public publishable key.

Keep DATABASE_URL, LOCAL_DATABASE=0, and VOTER_SECRET configured for each deployed environment. Keep production APP_URL=https://pickside-rouge.vercel.app.

For previews, the app uses Vercel's system VERCEL_URL when VERCEL_ENV=preview. Open the deployment-specific URL for testing. Ensure Vercel exposes system environment variables. If using a preview alias instead, open the deployment URL so mutation origins match.

Public settings provided in this task are saved in the ignored local .env.local. They are not automatically copied to Vercel. Redeploy after changing environment variables.

## 3. Configure Supabase Auth

Enable email sign-in and allow new users to sign up. Under Authentication > URL Configuration:
- Site URL: https://pickside-rouge.vercel.app
- Redirect URLs: https://pickside-rouge.vercel.app/auth/callback**
- For local testing: http://localhost:3000/auth/callback**
- For a preview: https://YOUR-EXACT-DEPLOYMENT.vercel.app/auth/callback**

The trailing ** allows the app's next query parameter. Use your exact deployment hostname, not a wildcard granting all Vercel projects access.

Keep the standard magic-link email template using ConfirmationURL. The app exchanges the resulting authorization code. Open emailed links in the same browser that requested them.

Supabase's default email sender only sends to project team members. Configure custom SMTP before inviting other people, and test delivery to a non-team email address.

References: [Supabase redirects](https://supabase.com/docs/guides/auth/redirect-urls), [Supabase SMTP](https://supabase.com/docs/guides/auth/auth-smtp), [Vercel system variables](https://vercel.com/docs/environment-variables/system-environment-variables).

## 4. Push and open a pull request

From the project folder:

```powershell
git push -u origin feature/creator-accounts
```

Open a pull request from feature/creator-accounts into main. GitHub Checks runs unit/database tests, the production build, TypeScript, and desktop/mobile Playwright tests. Vercel can create a preview from the branch.

In GitHub branch settings, require the Checks workflow's verify job before merging into main. Wait for the checks and the following preview test before merging.

## 5. Preview acceptance test

1. Sign in from My Matchups using your email. Follow the link in the same browser.
2. Create a matchup; confirm it appears in My Matchups with zero votes.
3. Open the public link in a separate private browser, vote, and revisit. Results should show the saved vote.
4. Refresh My Matchups; confirm the vote count, copy link, and results link.
5. Sign in as a second creator in a separate browser. The first creator's matchup must not appear.
6. Close voting from the original creator's dashboard. Confirm that a fresh browser sees final results and cannot vote, including from a voting tab opened before closing.
7. Sign out. Anonymous creation and voting should still work.
8. Check phone and desktop layouts, keyboard navigation, expired email links, and email delivery to a non-team user.

Automated ownership tests use a local PostgreSQL engine and mocked verified identities. They do not prove live email delivery or a real Supabase session. Browser tests in this workspace are blocked by Windows process permissions; run them through GitHub Checks or locally outside that restriction.

## 6. Release

After preview acceptance and green GitHub checks, merge into main to trigger the existing production deployment. Repeat the sign-in/create/vote/close smoke test on production. This task does not change live Supabase settings or merge into main.
