import { currentCreator } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { voteSchema } from '@/lib/schema';
import { getMatchup, castVote, MatchupClosedError } from '@/lib/repository';
import { voterHash } from '@/lib/identity';
import { allowedOrigin, readJson } from '@/lib/http';
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!allowedOrigin(request)) return NextResponse.json({ error: 'Request origin is not allowed.' }, { status: 403 });
  let body: unknown;
  try { body = await readJson(request); } catch { return NextResponse.json({ error: 'Invalid vote.' }, { status: 400 }); }
  const parsed = voteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Choose A or B.' }, { status: 400 });
  const { slug } = await params;
  try {
    const creator = await currentCreator();
  const hash = await voterHash();
    if (!hash) return NextResponse.json({ error: 'Please enable cookies, then try again.' }, { status: 401 });
    if (!await getMatchup(slug)) return NextResponse.json({ error: 'Matchup not found.' }, { status: 404 });
    const choice = await castVote(slug, hash, parsed.data.choice, creator?.id);
    return NextResponse.json({ choice }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { if (error instanceof MatchupClosedError) return NextResponse.json({ error: error.message, closed: true }, { status: 409 }); console.error('Vote failed', error); return NextResponse.json({ error: 'Your vote couldn’t be saved. Please try again.' }, { status: 503 }); }
}
