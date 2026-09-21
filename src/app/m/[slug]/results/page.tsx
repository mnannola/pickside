import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getMatchup, existingVote } from '@/lib/repository';
import { voterHash } from '@/lib/identity';
import { matchupMetadata } from '@/lib/metadata';
import { percentages } from '@/lib/schema';
import { ChoiceCard } from '@/components/choice-card';
import { Share } from '@/components/share';
export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props) { return matchupMetadata((await params).slug, true); }
export default async function Results({ params }: Props) {
  const { slug } = await params; const matchup = await getMatchup(slug); if (!matchup) notFound();
  const hash = await voterHash(); const pick = hash ? await existingVote(slug, hash) : undefined; const total = matchup.a_votes + matchup.b_votes; const [a, b] = percentages(matchup.a_votes, matchup.b_votes);
  const headline = matchup.closed_at ? 'The final picks.' : total === 0 ? 'The floor is open.' : a === b ? 'A house divided.' : 'The picks are in.';
  return <div className="page-shell matchup-page"><section className="matchup-stage" aria-label="Matchup results"><div className="page-heading centered">{matchup.category && <span className="eyebrow">{matchup.category}</span>}<h1>{headline}</h1><p>{matchup.closed_at ? 'Voting is closed. The results are here to stay.' : total === 0 ? 'No votes yet. Make the first pick.' : total === 1 ? 'The first vote is in. Keep it going.' : total + ' opinions. One friendly debate.'}</p></div><div className="matchup-grid"><ChoiceCard choice={matchup.a} side="A" percentage={a} votes={matchup.a_votes} selected={pick === 'A'}/><span className="vs" aria-hidden="true">VS</span><ChoiceCard choice={matchup.b} side="B" percentage={b} votes={matchup.b_votes} selected={pick === 'B'}/></div></section><div className="results-summary" data-testid="results-summary"><strong>{total} {total === 1 ? 'vote' : 'votes'}</strong><span>{total === 0 ? 'The next move is yours.' : a === b ? 'It’s a tie. Call in the group chat.' : (a > b ? matchup.a.title : matchup.b.title) + ' is out in front.'}</span></div>{!pick && !matchup.closed_at && <div className="centered"><Link className="button button-outline" href={'/m/' + slug}>Make your pick →</Link></div>}<Share slug={slug}/><div className="next-debate"><p>Got an even tougher choice?</p><Link href="/create" className="text-link">Create your own matchup ↗</Link></div></div>;
}
