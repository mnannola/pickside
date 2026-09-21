import { NextResponse } from 'next/server';
import { serverAuthClient } from '@/lib/supabase/server';
import { authConfigured, authDestination } from '@/lib/supabase/config';
import { appOrigin } from '@/lib/config';
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = authDestination(url.searchParams.get('next'));
  if (code && authConfigured()) {
    try {
      const client = await serverAuthClient(true);
      const { error } = await client.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(new URL(next, appOrigin()), { headers: { 'Cache-Control': 'private, no-store' } });
    } catch { /* Return a recoverable sign-in screen without exposing tokens. */ }
  }
  const retry = new URL('/signin', appOrigin());
  retry.searchParams.set('error', 'link');
  retry.searchParams.set('next', next);
  return NextResponse.redirect(retry, { headers: { 'Cache-Control': 'private, no-store' } });
}
