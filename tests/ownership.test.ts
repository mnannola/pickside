import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import { beforeAll, beforeEach, afterAll, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ database: vi.fn(), creator: vi.fn() }));
vi.mock('../src/lib/database', () => ({ database: mocks.database }));
vi.mock('../src/lib/supabase/server', () => ({ currentCreator: mocks.creator }));
import { createMatchup, getMatchup, listOwnedMatchups, closeMatchup, castVote, listActivity, existingVote, MatchupClosedError } from '../src/lib/repository';
import { POST as createRoute } from '../src/app/api/matchups/route';
import { POST as closeRoute } from '../src/app/api/matchups/[slug]/close/route';
import { authDestination } from '../src/lib/supabase/config';
import { migrationFiles } from '../src/lib/migrations';

const db = new PGlite();
const alice = '11111111-1111-4111-8111-111111111111';
const bob = '22222222-2222-4222-8222-222222222222';
const input = { a: { title: 'Tea', subtitle: '' }, b: { title: 'Coffee', subtitle: '' }, category: 'Drinks' };
function closeRequest(slug: string, origin = 'http://localhost:3000') {
  return closeRoute(new Request('http://localhost:3000/api/matchups/' + slug + '/close', { method: 'POST', headers: { Origin: origin } }), { params: Promise.resolve({ slug }) });
}
beforeAll(async () => {
  vi.stubEnv('APP_URL', 'http://localhost:3000');
  vi.stubEnv('LOCAL_DATABASE', '1');
  await db.exec(await readFile(migrationFiles[0], 'utf8'));
  await db.query('INSERT INTO matchups (slug,a_title,b_title) VALUES ($1,$2,$3)', ['Legacy0001', 'Old A', 'Old B']);
  await db.exec(await readFile(migrationFiles[1], 'utf8'));
  await db.exec(await readFile(migrationFiles[1], 'utf8'));
  await db.exec(await readFile(migrationFiles[2], 'utf8'));
  mocks.database.mockResolvedValue(db);
});
beforeEach(() => { mocks.creator.mockReset(); mocks.creator.mockResolvedValue(null); });
afterAll(async () => { await db.close(); vi.unstubAllEnvs(); });

it('preserves existing anonymous links without granting anyone ownership', async () => {
  expect(await getMatchup('Legacy0001')).toMatchObject({ slug: 'Legacy0001', closed_at: null });
  expect(await closeMatchup('Legacy0001', alice)).toBe(false);
  expect((await listOwnedMatchups(alice)).some(m => m.slug === 'Legacy0001')).toBe(false);
});
it('lists only the verified creator’s matchups', async () => {
  const own = await createMatchup(input, alice);
  const other = await createMatchup(input, bob);
  const anonymous = await createMatchup(input);
  const list = await listOwnedMatchups(alice);
  expect(list.some(m => m.slug === own)).toBe(true);
  expect(list.some(m => m.slug === other || m.slug === anonymous)).toBe(false);
  expect(list[0]).not.toHaveProperty('owner_id');
});
it('ignores forged owner IDs and uses server-verified identity on creation', async () => {
  mocks.creator.mockResolvedValue({ id: alice });
  const response = await createRoute(new Request('http://localhost:3000/api/matchups', { method: 'POST', headers: { Origin: 'http://localhost:3000', 'Content-Type': 'application/json' }, body: JSON.stringify({ ...input, owner_id: bob }) }));
  expect(response.status).toBe(201);
  const { slug } = await response.json();
  expect((await listOwnedMatchups(alice)).some(m => m.slug === slug)).toBe(true);
  expect(await closeMatchup(slug, bob)).toBe(false);
});
it('does not silently create anonymous matchups when identity verification fails', async () => {
  mocks.creator.mockRejectedValue(new Error('Auth unavailable'));
  const before = await db.query('SELECT count(*)::int AS count FROM matchups');
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  const response = await createRoute(new Request('http://localhost:3000/api/matchups', { method: 'POST', headers: { Origin: 'http://localhost:3000' }, body: JSON.stringify(input) }));
  log.mockRestore();
  expect(response.status).toBe(503);
  expect((await db.query('SELECT count(*)::int AS count FROM matchups')).rows).toEqual(before.rows);
});
it('requires same-origin requests and the owner to close voting', async () => {
  const slug = await createMatchup(input, alice);
  expect((await closeRequest(slug)).status).toBe(401);
  mocks.creator.mockResolvedValue({ id: bob });
  expect((await closeRequest(slug)).status).toBe(404);
  mocks.creator.mockResolvedValue({ id: alice });
  expect((await closeRequest(slug, 'https://attacker.example')).status).toBe(403);
  expect((await getMatchup(slug))?.closed_at).toBeNull();
  expect((await closeRequest(slug)).status).toBe(200);
  const closed = (await getMatchup(slug))?.closed_at;
  expect(closed).toBeTruthy();
  expect((await closeRequest(slug)).status).toBe(200);
  expect((await getMatchup(slug))?.closed_at).toBe(closed);
});
it('retains results and existing votes but rejects new votes after closing', async () => {
  const slug = await createMatchup(input, alice);
  expect(await castVote(slug, 'a'.repeat(64), 'A')).toBe('A');
  await closeMatchup(slug, alice);
  expect(await castVote(slug, 'a'.repeat(64), 'B')).toBe('A');
  await expect(castVote(slug, 'b'.repeat(64), 'B')).rejects.toBeInstanceOf(MatchupClosedError);
  expect(await getMatchup(slug)).toMatchObject({ a_votes: 1, b_votes: 0 });
});
it('enforces closing, ownership and choice immutability at database level', async () => {
  const slug = await createMatchup(input, alice);
  await castVote(slug, 'c'.repeat(64), 'A');
  await expect(db.query('UPDATE matchups SET a_title=$1 WHERE slug=$2', ['Changed', slug])).rejects.toThrow('choices_locked_after_first_vote');
  await expect(db.query('UPDATE matchups SET owner_id=$1 WHERE slug=$2', [bob, slug])).rejects.toThrow('matchup_identity_is_immutable');
  await closeMatchup(slug, alice);
  await expect(db.query('UPDATE matchups SET closed_at=NULL WHERE slug=$1', [slug])).rejects.toThrow('closed_matchup_is_final');
  await expect(db.query('INSERT INTO votes (matchup_slug,voter_hash,choice) VALUES ($1,$2,$3)', [slug, 'd'.repeat(64), 'B'])).rejects.toThrow('matchup_closed');
});
it('has a consistent final state when a vote races with closing', async () => {
  const slug = await createMatchup(input, alice);
  await Promise.allSettled([castVote(slug, 'e'.repeat(64), 'A'), closeMatchup(slug, alice)]);
  const result = await getMatchup(slug);
  expect(result?.closed_at).toBeTruthy();
  expect([0, 1]).toContain(result?.a_votes);
  await expect(castVote(slug, 'f'.repeat(64), 'B')).rejects.toBeInstanceOf(MatchupClosedError);
  expect((await getMatchup(slug))?.a_votes).toBe(result?.a_votes);
});
it('only allows known local destinations after sign-in', () => {
  for (const next of ['https://evil.example', '//evil.example', '/auth/signout', '/\\evil.example', null, undefined]) expect(authDestination(next)).toBe('/my-matchups');
  expect(authDestination('/create')).toBe('/create');
  expect(authDestination('/activity')).toBe('/activity');
});

it('saves only signed-in picks to the correct private activity list', async () => {
  const slug = await createMatchup(input);
  await castVote(slug, '1'.repeat(64), 'B', alice);
  await castVote(slug, '2'.repeat(64), 'A', bob);
  await castVote(slug, '3'.repeat(64), 'A');
  expect((await listActivity(alice)).find(m => m.slug === slug)).toMatchObject({ picked:'B', a_votes:2, b_votes:1 });
  expect((await listActivity(bob)).find(m => m.slug === slug)).toMatchObject({ picked:'A' });
  expect(await getMatchup(slug)).not.toHaveProperty('user_id');
});
it('keeps an account vote unchanged across browsers and concurrent retries', async () => {
  const slug = await createMatchup(input);
  await Promise.all([castVote(slug, '4'.repeat(64), 'A', alice), castVote(slug, '5'.repeat(64), 'B', alice)]);
  const m = await getMatchup(slug);
  expect(m!.a_votes + m!.b_votes).toBe(1);
  const pick = await existingVote(slug, '', alice);
  expect(await castVote(slug, '6'.repeat(64), pick === 'A' ? 'B' : 'A', alice)).toBe(pick);
  expect((await listActivity(alice)).filter(m => m.slug === slug)).toHaveLength(1);
});
it('does not attach earlier anonymous votes when signing in', async () => {
  const slug = await createMatchup(input);
  await castVote(slug, '7'.repeat(64), 'A');
  expect(await castVote(slug, '7'.repeat(64), 'B', alice)).toBe('A');
  expect((await listActivity(alice)).some(m => m.slug === slug)).toBe(false);
});
it('retains activity after voting closes', async () => {
  const slug = await createMatchup(input, alice);
  await castVote(slug, '8'.repeat(64), 'B', bob);
  await closeMatchup(slug, alice);
  expect((await listActivity(bob)).find(m => m.slug === slug)?.closed_at).toBeTruthy();
  expect(await existingVote(slug, '', bob)).toBe('B');
});
