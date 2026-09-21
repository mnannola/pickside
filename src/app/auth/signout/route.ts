import { NextResponse } from 'next/server';
import { allowedOrigin } from '@/lib/http';
import { serverAuthClient } from '@/lib/supabase/server';
import { authConfigured } from '@/lib/supabase/config';
import { appOrigin } from '@/lib/config';
export async function POST(request: Request) {
  if (!allowedOrigin(request)) return NextResponse.json({ error: 'Request origin is not allowed.' }, { status: 403 });
  if (authConfigured()) {
    const client = await serverAuthClient(true);
    const { error } = await client.auth.signOut({ scope: 'local' });
    if (error) return NextResponse.json({ error: 'Could not sign out. Please try again.' }, { status: 503 });
  }
  return NextResponse.redirect(new URL('/', appOrigin()), 303);
}
