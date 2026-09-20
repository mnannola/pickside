import type { Metadata } from 'next';
import { getMatchup } from './repository';
export async function matchupMetadata(slug: string, results = false): Promise<Metadata> {
  const matchup = await getMatchup(slug); if (!matchup) return { title: 'Matchup not found', robots: { index: false } };
  const title = matchup.a.title + ' vs. ' + matchup.b.title;
  const description = results ? 'See where everyone stands in ' + title + '. What’s your pick?' : 'Two contenders. One choice. Pick your side in ' + title + '.';
  return { title: results ? title + ' — Results' : title, description, alternates: { canonical: '/m/' + slug + (results ? '/results' : '') }, openGraph: { title, description, type: 'website', url: '/m/' + slug, siteName: 'Pickside' }, twitter: { card: 'summary', title, description } };
}
