import Link from 'next/link';
import { redirect } from 'next/navigation';
import { currentCreator } from '@/lib/supabase/server';
import { listOwnedMatchups } from '@/lib/repository';
import { CloseMatchup } from '@/components/close-matchup';
import { Share } from '@/components/share';
import { authConfigured } from '@/lib/supabase/config';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'My Matchups', robots: { index: false, follow: false } };
export default async function MyMatchups({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  if (!authConfigured()) redirect('/signin');
  const creator = await currentCreator();
  if (!creator) redirect('/signin');
  const rawPage = Number((await searchParams).page || 1);
  const page = Number.isSafeInteger(rawPage) && rawPage > 0 && rawPage <= 10000 ? rawPage : 1;
  const records = await listOwnedMatchups(creator.id, page);
  const more = records.length > 20;
  const matchups = records.slice(0, 20);
  return <div className="page-shell"><div className="dashboard-heading"><div className="page-heading"><span className="eyebrow">YOUR CORNER OF THE DEBATE</span><h1>My <span className="accent-word">Matchups.</span></h1><p>{creator.email}</p></div><form action="/auth/signout" method="post"><button className="button button-outline">Sign out</button></form></div><nav className="account-tabs" aria-label="Your account"><Link href="/my-matchups" aria-current="page">My Matchups</Link><Link href="/activity">Activity</Link></nav><div className="dashboard-toolbar"><p>Create it. Share it. Watch the picks come in.</p><Link className="button button-primary" href="/create">New matchup ↗</Link></div>{matchups.length === 0 ? <section className="dashboard-empty"><span aria-hidden="true">↗</span><h2>{page > 1 ? 'No more matchups here.' : 'Your next great debate starts here.'}</h2><p>{page > 1 ? 'Head back to your recent matchups.' : 'Matchups you create while signed in will appear here. Earlier anonymous matchups stay available through their links.'}</p><Link href={page > 1 ? '/my-matchups' : '/create'} className="button button-primary">{page > 1 ? 'Back to recent matchups' : 'Create your first matchup'}</Link></section> : <div className="owned-matchups">{matchups.map(matchup => <article className="owned-matchup" key={matchup.slug}><div className="owned-top"><span className={'status-pill ' + (matchup.closed_at ? 'is-closed' : '')}>{matchup.closed_at ? 'Voting closed' : 'Open for picks'}</span><span>{matchup.category || 'Your matchup'}</span></div><h2><Link href={'/m/' + matchup.slug + '/results'}>{matchup.a.title} <span>vs.</span> {matchup.b.title}</Link></h2><div className="owned-stats"><strong>{matchup.a_votes + matchup.b_votes} votes</strong><Link href={'/m/' + matchup.slug + '/results'} className="text-link">View results →</Link><Link href={'/m/' + matchup.slug} className="text-link">Open matchup ↗</Link></div><Share slug={matchup.slug}/>{!matchup.closed_at && <CloseMatchup slug={matchup.slug}/>}</article>)}</div>}<nav className="pagination" aria-label="Matchup pages">{page > 1 && <Link className="button button-outline" href={'/my-matchups?page=' + (page - 1)}>← Newer</Link>}{more && <Link className="button button-outline" href={'/my-matchups?page=' + (page + 1)}>Older →</Link>}</nav></div>;
}
