import { NextResponse } from 'next/server';
import { matchupSchema } from '@/lib/schema';
import { currentCreator } from '@/lib/supabase/server';
import { createMatchup } from '@/lib/repository';
import { allowedOrigin, readJson } from '@/lib/http';
export async function POST(request: Request) {
  if (!allowedOrigin(request)) return NextResponse.json({ error: 'Request origin is not allowed.' }, { status: 403 });
  let body: unknown;
  try { body = await readJson(request); } catch { return NextResponse.json({ error: 'Please send a valid, small JSON request.' }, { status: 400 }); }
  const result = matchupSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
  try { const creator = await currentCreator(); return NextResponse.json({ slug: await createMatchup(result.data, creator?.id ?? null) }, { status: 201 }); }
  catch (error) { console.error('Create matchup failed', error); return NextResponse.json({ error: 'We couldn’t create your matchup. Please try again.' }, { status: 503 }); }
}
