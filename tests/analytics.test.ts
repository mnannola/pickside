import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import { beforeAll, afterAll, beforeEach, it, expect, vi } from 'vitest';
const mocks=vi.hoisted(()=>({database:vi.fn()}));
vi.mock('../src/lib/database',()=>({database:mocks.database}));
import { migrationFiles } from '../src/lib/migrations';
import { recordFlow, recordSignup } from '../src/lib/analytics';
const db=new PGlite();
const user='11111111-1111-4111-8111-111111111111';
beforeAll(async()=>{
 for(const file of migrationFiles) await db.exec(await readFile(file,'utf8'));
 await db.exec(await readFile(migrationFiles[3],'utf8'));
 await db.exec("CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY,created_at timestamptz NOT NULL DEFAULT now());");
 await db.query('INSERT INTO matchups(slug,a_title,b_title,owner_id) VALUES ($1,$2,$3,$4)',['Analytics1','Tea','Coffee',user]);
 mocks.database.mockResolvedValue(db);
});
beforeEach(()=>{vi.stubEnv('ANALYTICS_ENABLED','1');vi.stubEnv('VERCEL_ENV','production');});
afterAll(async()=>{vi.unstubAllEnvs();await db.close();});
it('deduplicates real eligible opens and excludes the owner',async()=>{
 await recordFlow('matchup_open','a'.repeat(64),'Analytics1',user);
 expect((await db.query('SELECT * FROM flow_events')).rows).toHaveLength(0);
 await recordFlow('matchup_open','a'.repeat(64),'Analytics1');
 await recordFlow('matchup_open','a'.repeat(64),'Analytics1');
 expect((await db.query('SELECT * FROM flow_events')).rows).toHaveLength(1);
});
it('ignores already-voted opens and retains successful sharing signals',async()=>{
 await db.query('INSERT INTO votes(matchup_slug,voter_hash,choice) VALUES ($1,$2,$3)',['Analytics1','b'.repeat(64),'A']);
 await recordFlow('matchup_open','b'.repeat(64),'Analytics1');
 expect((await db.query("SELECT * FROM flow_events WHERE voter_hash=$1",['b'.repeat(64)])).rows).toHaveLength(0);
 await recordFlow('share_copy','b'.repeat(64),'Analytics1');
 await recordFlow('share_copy','b'.repeat(64),'Analytics1');
 expect((await db.query("SELECT * FROM flow_events WHERE event='share_copy'")).rows).toHaveLength(1);
});
it('does not collect when disabled or on previews',async()=>{
 vi.stubEnv('ANALYTICS_ENABLED','0');
 await recordFlow('share_native','c'.repeat(64),'Analytics1');
 vi.stubEnv('ANALYTICS_ENABLED','1');vi.stubEnv('VERCEL_ENV','preview');
 await recordFlow('share_native','c'.repeat(64),'Analytics1');
 expect((await db.query("SELECT * FROM flow_events WHERE event='share_native'")).rows).toHaveLength(0);
});
it('attributes a new signup after an anonymous vote only once',async()=>{
 await db.query("UPDATE votes SET created_at=now()-interval '1 hour' WHERE voter_hash=$1",['b'.repeat(64)]);
 const newUser={id:user,created_at:new Date().toISOString()};
 await recordSignup('b'.repeat(64),newUser);
 await recordSignup('b'.repeat(64),newUser);
 await recordSignup('b'.repeat(64),{id:'22222222-2222-4222-8222-222222222222',created_at:'2020-01-01T00:00:00Z'});
 expect((await db.query('SELECT * FROM flow_signups')).rows).toHaveLength(1);
});
it('executes the report and returns six defined metrics',async()=>{
 await db.query("INSERT INTO auth.users(id,created_at) VALUES ($1,now()-interval '11 days')",[user]);
 await db.exec("UPDATE matchups SET created_at=now()-interval '10 days'; UPDATE flow_events SET created_at=now()-interval '10 days'+interval '1 minute';");
 await db.query("INSERT INTO votes(matchup_slug,voter_hash,choice,created_at) VALUES ($1,$2,$3,now()-interval '10 days'+interval '2 minutes')",['Analytics1','a'.repeat(64),'B']);
 const {rows}=await db.query<{metric:string;numerator:string;denominator:string}>(await readFile('supabase/reports/core-flow.sql','utf8'));
 expect(rows).toHaveLength(6);
 expect(rows.find(r=>r.metric==='vote_completion_24h')).toMatchObject({numerator:'1',denominator:'1'});
});
it('does not propagate measurement storage failures',async()=>{
 mocks.database.mockRejectedValueOnce(new Error('unavailable'));
 const log=vi.spyOn(console,'warn').mockImplementation(()=>{});
 await expect(recordFlow('share_copy','a'.repeat(64),'Analytics1')).resolves.toBeUndefined();
 log.mockRestore();
});
