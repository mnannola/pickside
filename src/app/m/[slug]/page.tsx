import { currentCreator } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getMatchup, existingVote } from '@/lib/repository';
import { voterHash } from '@/lib/identity';
import { matchupMetadata } from '@/lib/metadata';
import { VotePanel } from '@/components/vote-panel';
import { Share } from '@/components/share';
export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ created?: string }> };
export async function generateMetadata({ params }: Props) { return matchupMetadata((await params).slug); }
export default async function VotePage({ params, searchParams }: Props) {
  const { slug } = await params; const matchup = await getMatchup(slug); if (!matchup) notFound();
  if (matchup.closed_at) redirect('/m/' + slug + '/results');
  const creator = await currentCreator();
  const hash = await voterHash(); if ((hash || creator) && await existingVote(slug, hash || '', creator?.id)) redirect('/m/' + slug + '/results');
  const total = matchup.a_votes + matchup.b_votes; const created = (await searchParams).created === '1';
  return <div className="page-shell matchup-page"><section className="matchup-stage" aria-label="Choose your side"><div className="page-heading centered">{matchup.category && <span className="eyebrow">{matchup.category}</span>}<h1><span className="accent-word">Pick a side.</span></h1><p>{total === 0 ? 'A clean slate. Make the first pick.' : total + (total === 1 ? ' person has' : ' people have') + ' picked a side.'}</p></div><VotePanel matchup={matchup}/></section>{created && <div className="success-banner" role="status">✓ Your matchup is ready. Copy the link and start the debate.</div>}<div className="below-matchup">{creator ? <Link href="/activity" className="text-link">Your pick will be saved to Activity →</Link> : <span>No signup needed. Your pick stays anonymous.</span>}<Link href={'/m/' + slug + '/results'} className="text-link">Just see the results →</Link></div><Share slug={slug}/></div>;
}
