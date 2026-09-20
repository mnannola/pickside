import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import { beforeAll, afterAll, expect, it } from 'vitest';
const db = new PGlite();
beforeAll(async () => { await db.exec(await readFile('supabase/migrations/202609190001_initial.sql', 'utf8')); await db.query('INSERT INTO matchups (slug,a_title,b_title) VALUES ($1,$2,$3)', ['AbCdEf1234', 'Gladiator', 'Braveheart']); });
afterAll(async () => { await db.close(); });
it('allows only one immutable vote for concurrent attempts by the same voter', async () => {
  const hash = 'a'.repeat(64);
  await Promise.all(Array.from({ length: 12 }, (_, index) => db.query('INSERT INTO votes (matchup_slug,voter_hash,choice) VALUES ($1,$2,$3) ON CONFLICT (matchup_slug,voter_hash) DO NOTHING', ['AbCdEf1234', hash, index % 2 ? 'B' : 'A'])));
  const result = await db.query('SELECT choice FROM votes WHERE voter_hash=$1', [hash]); expect(result.rows).toEqual([{ choice: 'A' }]);
  await expect(db.query('INSERT INTO votes (matchup_slug,voter_hash,choice) VALUES ($1,$2,$3)', ['AbCdEf1234', hash, 'B'])).rejects.toThrow();
});
it('allows a separate voter and calculates exact counts', async () => {
  await db.query('INSERT INTO votes (matchup_slug,voter_hash,choice) VALUES ($1,$2,$3)', ['AbCdEf1234', 'b'.repeat(64), 'B']);
  const result = await db.query('SELECT choice,count(*)::int AS count FROM votes GROUP BY choice ORDER BY choice'); expect(result.rows).toEqual([{ choice: 'A', count: 1 }, { choice: 'B', count: 1 }]);
});
it('rejects invalid choices and non-existent matchups at database level', async () => {
  await expect(db.query('INSERT INTO votes (matchup_slug,voter_hash,choice) VALUES ($1,$2,$3)', ['AbCdEf1234', 'c'.repeat(64), 'C'])).rejects.toThrow();
  await expect(db.query('INSERT INTO votes (matchup_slug,voter_hash,choice) VALUES ($1,$2,$3)', ['NoSuch1234', 'd'.repeat(64), 'A'])).rejects.toThrow();
});
