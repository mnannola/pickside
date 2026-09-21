import Link from 'next/link';
import { redirect } from 'next/navigation';
import { currentCreator } from '@/lib/supabase/server';
import { listActivity } from '@/lib/repository';
import { percentages } from '@/lib/schema';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Activity', robots: { index: false, follow: false } };
export default async function Activity({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const user = await currentCreator();
  if (!user) redirect('/signin?next=/activity');
  const raw = Number((await searchParams).page || 1);
  const page = Number.isSafeInteger(raw) && raw > 0 && raw <= 10000 ? raw : 1;
  const records = await listActivity(user.id, page);
  return <div className="page-shell"><div className="page-heading"><span className="eyebrow">YOU PICKED A SIDE</span><h1>Your <span className="accent-word">Activity.</span></h1><p>Your picks, and where everyone stands now.</p></div><nav className="account-tabs" aria-label="Your account"><Link href="/my-matchups">My Matchups</Link><Link href="/activity" aria-current="page">Activity</Link></nav>{records.length === 0 ? <section className="dashboard-empty"><h2>{page > 1 ? 'You’re all caught up.' : 'Your first pick starts here.'}</h2><p>Picks you make while signed in appear here. Earlier anonymous picks stay anonymous.</p><Link className="button button-primary" href={page > 1 ? '/activity' : '/create'}>{page > 1 ? 'Back to recent picks' : 'Create a matchup'}</Link></section> : <div className="owned-matchups">{records.slice(0,20).map(m => { const [a,b] = percentages(m.a_votes,m.b_votes); return <article className="owned-matchup" key={m.slug}><div className="owned-top"><span className={'status-pill ' + (m.closed_at ? 'is-closed' : '')}>{m.closed_at ? 'Voting closed' : 'Open for picks'}</span><span>{m.category}</span></div><h2><Link href={'/m/' + m.slug + '/results'}>{m.a.title} <span>vs.</span> {m.b.title}</Link></h2><p className="activity-pick">✓ You picked {m.picked === 'A' ? m.a.title : m.b.title}</p><div className="activity-results"><p>{m.a.title} <strong>{a}%</strong></p><p>{m.b.title} <strong>{b}%</strong></p></div><div className="owned-stats"><span>{m.a_votes + m.b_votes} votes</span><time dateTime={new Date(m.voted_at).toISOString()}>{new Date(m.voted_at).toLocaleDateString('en-US', { timeZone:'UTC', month:'short', day:'numeric', year:'numeric' })}</time><Link className="text-link" href={'/m/' + m.slug + '/results'}>View results →</Link></div></article>; })}</div>}<nav className="pagination" aria-label="Activity pages">{page > 1 && <Link className="button button-outline" href={'/activity?page=' + (page-1)}>← Newer</Link>}{records.length > 20 && <Link className="button button-outline" href={'/activity?page=' + (page+1)}>Older →</Link>}</nav></div>;
}
