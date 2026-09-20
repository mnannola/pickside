# Pickside
A mobile-first, no-image voting MVP built with Next.js App Router, TypeScript, Tailwind CSS, Zod, and PostgreSQL.

## Run locally
Requires Node.js 22.13+ and npm (included with Node.js).

1. Run `npm install`.
2. Copy `.env.example` to `.env.local`.
3. Run `npm run dev` and open http://localhost:3000.

Local mode uses PGlite, an embedded PostgreSQL engine with durable files in `.data/pickside`. This is a development option, not a hosted Supabase instance. Restarting the local app retains data. Only run one server per local data directory.

## Supabase / PostgreSQL
1. Create a Supabase project and obtain its server-side PostgreSQL pooler connection URL.
2. Set `DATABASE_URL` to that URL. Do not prefix it with NEXT_PUBLIC. Supabase database credentials belong only on the server.
3. Set `LOCAL_DATABASE=0`.
4. Apply `supabase/migrations/202609190001_initial.sql` in the Supabase SQL editor, or export DATABASE_URL and run `npm run db:migrate`.
5. Set `APP_URL` to the exact public HTTPS origin, and `VOTER_SECRET` to a random secret of at least 32 characters (for example: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).
6. Run `npm run build`, then `npm start`, or deploy to a Next.js-compatible host such as Vercel with those environment values.

The application uses a private server-side PostgreSQL connection with prepared statements disabled for pooler compatibility. Row-level security is enabled with no public browser policies. The database connection role must own the tables or have appropriate privileges/BYPASSRLS (the normal Supabase server database role does). Do not use the public anon role for this connection. Never disable TLS certificate verification.

## Commands
- `npm run typecheck`: TypeScript verification
- `npm test`: Vitest validation, identity and database constraint tests
- `npx playwright install chromium`: browser setup
- `npm run test:e2e`: desktop/mobile critical paths with separate voter browser contexts
- `npm run build`: production compilation

Playwright starts its own local server on port 3100 and uses `.data/e2e`. It can run alongside the app on port 3000. Results and screenshots are written to `test-results` and `playwright-report`.

## Behavior and boundaries
- Routes: `/`, `/create`, `/m/[slug]`, `/m/[slug]/results`.
- Two distinct names, each up to 80 characters; optional subtitles up to 120; shared category up to 32.
- Random 10-character URL-safe public slugs (60 random bits), with collision retries.
- Signed, random anonymous identity in an HttpOnly, SameSite=Lax, first-party cookie. Secure is enabled for HTTPS origins. Only a keyed hash is stored in votes.
- Identity is established before voting; requests without a valid cookie cannot vote. Same-origin checks protect mutations. JSON request bodies are bounded.
- The first vote is final. A composite database primary key prevents duplicate votes under retries/concurrency. Revisit redirects to results.
- Results are calculated from stored votes. An empty matchup displays 0%/0%; non-empty rounded percentages always sum to 100%. Refresh to see later votes.
- Public results can be viewed without voting. Links are intentionally public; slugs are not authorization.
- Clearing cookies or switching browsers creates a new anonymous identity. This is one vote per identity, not verified one vote per human.
- No accounts, groups, image/catalog APIs, editing, vote changes, or real-time subscriptions.
- Creation is public. Internet deployment should add platform-level abuse/rate controls before broad promotion.

## Design
Shared tokens live in `src/app/globals.css`. Canonical `ChoiceCard` is used in creation previews, voting, and results. Four deterministic palettes and geometric CSS artwork make text-only matchups complete. Cards use native buttons for voting, visible focus states, wrapping text, 48px primary controls, reduced-motion support, and a mobile stacked layout. Open Graph and Twitter metadata are generated from each matchup; no external image service is used.

## Verification status in this workspace
TypeScript, production build, all 25 Vitest tests, 21 production-server integration checks, and database persistence across a restart passed. Browser tests were attempted but the task permission policy blocks Chromium startup (spawn EPERM). Visual and browser-interaction checks remain unverified. See `STATUS.md` for details.
