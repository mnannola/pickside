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
  const hash = await voterHash(); if (hash && await existingVote(slug, hash)) redirect('/m/' + slug + '/results');
  const total = matchup.a_votes + matchup.b_votes; const created = (await searchParams).created === '1';
  return <div className="page-shell matchup-page">{created && <div className="success-banner" role="status">✓ Your matchup is ready. Copy the link and start the debate.</div>}<div className="page-heading centered"><span className="eyebrow">{matchup.category || 'THE MOMENT OF TRUTH'}</span><h1>Go on. <span className="accent-word">Pick a side.</span></h1><p>{total === 0 ? 'A clean slate. Be the first to take a stand.' : total + (total === 1 ? ' person has' : ' people have') + ' picked a side. Where do you stand?'}</p></div><VotePanel matchup={matchup}/><div className="below-matchup"><span>No signup needed. Your pick stays anonymous.</span><Link href={'/m/' + slug + '/results'} className="text-link">Just see the results →</Link></div><Share slug={slug}/></div>;
}
