import 'server-only';
import { randomBytes } from 'node:crypto';
import { database } from './database';
import type { Matchup, MatchupInput } from './schema';
export async function createMatchup(data: MatchupInput) {
  const db = await database();
  for (let i = 0; i < 5; i++) {
    const slug = randomBytes(8).toString('base64url').slice(0, 10);
    const result = await db.query('INSERT INTO matchups (slug,a_title,a_subtitle,b_title,b_subtitle,category) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (slug) DO NOTHING RETURNING slug', [slug, data.a.title, data.a.subtitle, data.b.title, data.b.subtitle, data.category]);
    if (result.rows.length) return slug;
  }
  throw new Error('Could not allocate matchup URL.');
}
export async function getMatchup(slug: string): Promise<Matchup | null> {
  if (!/^[\w-]{10}$/.test(slug)) return null;
  const db = await database();
  const { rows } = await db.query('SELECT m.*, (SELECT count(*)::int FROM votes WHERE matchup_slug=m.slug AND choice=\'A\') AS a_votes, (SELECT count(*)::int FROM votes WHERE matchup_slug=m.slug AND choice=\'B\') AS b_votes FROM matchups m WHERE slug=$1', [slug]);
  const r = rows[0];
  if (!r) return null;
  return { slug: String(r.slug), a: { title: String(r.a_title), subtitle: String(r.a_subtitle) }, b: { title: String(r.b_title), subtitle: String(r.b_subtitle) }, category: String(r.category), created_at: String(r.created_at), a_votes: Number(r.a_votes), b_votes: Number(r.b_votes) };
}
export async function existingVote(slug: string, hash: string) { const db = await database(); const { rows } = await db.query('SELECT choice FROM votes WHERE matchup_slug=$1 AND voter_hash=$2', [slug, hash]); return rows[0]?.choice as 'A' | 'B' | undefined; }
export async function castVote(slug: string, hash: string, choice: 'A' | 'B') {
  const db = await database();
  // Immutable first vote. The composite primary key makes concurrent retries safe.
  await db.query('INSERT INTO votes (matchup_slug,voter_hash,choice) VALUES ($1,$2,$3) ON CONFLICT (matchup_slug,voter_hash) DO NOTHING', [slug, hash, choice]);
  return existingVote(slug, hash);
}
