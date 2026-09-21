import 'server-only';
import { randomBytes } from 'node:crypto';
import { database } from './database';
import type { Matchup, MatchupInput } from './schema';
const selectMatchup = `SELECT m.*, (SELECT count(*)::int FROM votes WHERE matchup_slug=m.slug AND choice='A') AS a_votes, (SELECT count(*)::int FROM votes WHERE matchup_slug=m.slug AND choice='B') AS b_votes FROM matchups m`;
function record(row: Record<string, unknown>): Matchup {
  return { slug: String(row.slug), a: { title: String(row.a_title), subtitle: String(row.a_subtitle) }, b: { title: String(row.b_title), subtitle: String(row.b_subtitle) }, category: String(row.category), created_at: String(row.created_at), closed_at: row.closed_at ? String(row.closed_at) : null, a_votes: Number(row.a_votes), b_votes: Number(row.b_votes) };
}
export async function createMatchup(data: MatchupInput, ownerId: string | null = null) {
  const db = await database();
  for (let i = 0; i < 5; i++) {
    const slug = randomBytes(8).toString('base64url').slice(0, 10);
    const result = await db.query('INSERT INTO matchups (slug,a_title,a_subtitle,b_title,b_subtitle,category,owner_id) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (slug) DO NOTHING RETURNING slug', [slug, data.a.title, data.a.subtitle, data.b.title, data.b.subtitle, data.category, ownerId]);
    if (result.rows.length) return slug;
  }
  throw new Error('Could not allocate matchup URL.');
}
export async function getMatchup(slug: string): Promise<Matchup | null> {
  if (!/^[\w-]{10}$/.test(slug)) return null;
  const db = await database();
  const { rows } = await db.query(selectMatchup + ' WHERE m.slug=$1', [slug]);
  return rows[0] ? record(rows[0]) : null;
}
export async function listOwnedMatchups(ownerId: string, page = 1): Promise<Matchup[]> {
  const db = await database();
  const { rows } = await db.query(selectMatchup + ' WHERE m.owner_id=$1 ORDER BY m.created_at DESC, m.slug DESC LIMIT 21 OFFSET $2', [ownerId, (page - 1) * 20]);
  return rows.map(record);
}
export async function closeMatchup(slug: string, ownerId: string) {
  if (!/^[\w-]{10}$/.test(slug)) return false;
  const db = await database();
  const { rows } = await db.query('UPDATE matchups SET closed_at=coalesce(closed_at, now()) WHERE slug=$1 AND owner_id=$2 RETURNING slug', [slug, ownerId]);
  return rows.length > 0;
}
export async function existingVote(slug: string, hash: string, userId: string | null = null) {
  const db = await database();
  const { rows } = await db.query('SELECT choice FROM votes WHERE matchup_slug=$1 AND (voter_hash=$2 OR user_id=$3) ORDER BY (user_id=$3) DESC NULLS LAST LIMIT 1', [slug, hash, userId]);
  return rows[0]?.choice as 'A' | 'B' | undefined;
}
export class MatchupClosedError extends Error {
  constructor() { super('Voting has closed for this matchup.'); this.name = 'MatchupClosedError'; }
}
export async function castVote(slug: string, hash: string, choice: 'A' | 'B', userId: string | null = null) {
  const db = await database();
  const prior = await existingVote(slug, hash, userId);
  if (prior) return prior;
  try {
    await db.query('INSERT INTO votes (matchup_slug,voter_hash,choice,user_id) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING', [slug, hash, choice, userId]);
  } catch (error) {
    if (error instanceof Error && error.message.includes('matchup_closed')) throw new MatchupClosedError();
    throw error;
  }
  return existingVote(slug, hash, userId);
}

export async function listActivity(userId: string, page = 1) {
  const db = await database();
  const { rows } = await db.query(selectMatchup.replace('SELECT m.*,', 'SELECT m.*, v.choice AS picked, v.created_at AS voted_at,') + ' JOIN votes v ON v.matchup_slug=m.slug WHERE v.user_id=$1 ORDER BY v.created_at DESC, m.slug DESC LIMIT 21 OFFSET $2', [userId, (page - 1) * 20]);
  return rows.map(row => ({ ...record(row), picked: row.picked as 'A' | 'B', voted_at: String(row.voted_at) }));
}
