import { NextResponse } from 'next/server';
import { currentCreator } from '@/lib/supabase/server';
import { closeMatchup } from '@/lib/repository';
import { allowedOrigin } from '@/lib/http';
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!allowedOrigin(request)) return NextResponse.json({ error: 'Request origin is not allowed.' }, { status: 403 });
  try {
    const creator = await currentCreator();
    if (!creator) return NextResponse.json({ error: 'Sign in to manage your matchups.' }, { status: 401 });
    const { slug } = await params;
    if (!await closeMatchup(slug, creator.id)) return NextResponse.json({ error: 'Matchup not found.' }, { status: 404 });
    return NextResponse.json({ closed: true }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ error: 'Could not close voting. Please try again.' }, { status: 503 });
  }
}
