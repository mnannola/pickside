# Verification status

The application runs locally at http://localhost:3000 using a production Next.js build and persistent local PostgreSQL (PGlite).

## Passed
- TypeScript typecheck, including production route types.
- Production build (Next.js 16.3.5), with no build warnings.
- All 25 Vitest tests across validation, identity, configuration, and database constraints.
- 21 HTTP integration checks against the running production server: page rendering, matchup creation, random slugs, metadata, first-voter and empty results, signed cookies, independent identities, first vote, revisit redirect, concurrent duplicate prevention, second vote, percentages, invalid input, origin protection, and missing records.
- Saved votes survived a server restart.

## Fixes made during verification
- Typed the PostgreSQL driver result with its generic API.
- Created the local database directory automatically on first launch.
- Reset failed database initialization so a transient failure does not poison subsequent requests.
- Used the Vitest config runner to avoid a Windows sandbox restriction on bundled config discovery.
- Excluded runtime database paths from Next.js source-file tracing.

## Remaining checks
All six Playwright desktop/mobile tests were attempted but blocked before browser startup: Windows returned `spawn EPERM` for the installed Chromium executable. The task policy also rejected escalation because sandbox approvals are disabled. No browser-interaction, visual-layout, clipboard, or native-share verification is claimed.

To run them outside this task, from the project folder:
```powershell
npm run test:e2e
```
The suite starts its own server on port 3100 and uses a separate local test database.

Hosted Supabase credentials have not been configured. The shared schema and server PostgreSQL adapter are implemented; live Supabase deployment verification remains separate.

## Local commands
- `npm ci` installs the locked dependencies on another machine.
- `npm test` runs the unit/database tests.
- `npm run build` builds production.
- `npm start` serves production on port 3000.
- `npm run test:server` runs the HTTP checks against an already-running server (and creates test matchups).
- `npm run test:e2e` runs desktop/mobile browser tests.
