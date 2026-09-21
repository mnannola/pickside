import 'server-only';
import { database } from './database';
export function analyticsEnabled() {
 return process.env.ANALYTICS_ENABLED === '1' && process.env.VERCEL_ENV !== 'preview';
}
export async function recordFlow(event: 'matchup_open' | 'share_copy' | 'share_native', hash: string, slug: string, userId: string | null = null) {
 if (!analyticsEnabled()) return;
 try {
  const db = await database();
  if (event === 'matchup_open') {
   await db.query(`INSERT INTO flow_events(event,matchup_slug,voter_hash)
    SELECT $1,m.slug,$2 FROM matchups m WHERE m.slug=$3 AND m.closed_at IS NULL
    AND (m.owner_id IS NULL OR m.owner_id IS DISTINCT FROM $4::uuid)
    AND NOT EXISTS (SELECT 1 FROM votes v WHERE v.matchup_slug=m.slug AND (v.voter_hash=$2 OR v.user_id=$4))
    ON CONFLICT DO NOTHING`,[event,hash,slug,userId]);
  } else {
   await db.query('INSERT INTO flow_events(event,matchup_slug,voter_hash) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',[event,slug,hash]);
  }
 } catch { console.warn('Flow analytics unavailable'); }
}

export async function recordSignup(hash: string, user: { id: string; created_at: string }) {
 if (!analyticsEnabled()) return;
 const age = Date.now() - Date.parse(user.created_at);
 if (!(age >= 0 && age < 600000)) return;
 try {
  const db = await database();
  await db.query('INSERT INTO flow_signups(user_id,voter_hash,created_at) SELECT $1,$2,$3::timestamptz WHERE EXISTS (SELECT 1 FROM votes WHERE voter_hash=$2 AND user_id IS NULL AND created_at<$3::timestamptz) ON CONFLICT DO NOTHING',[user.id,hash,user.created_at]);
 } catch { console.warn('Signup analytics unavailable'); }
}
