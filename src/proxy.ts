import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { authConfig, authConfigured } from '@/lib/supabase/config';

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!authConfigured()) return response;
  const { url, key } = authConfig();
  const client = createServerClient(url, key, {
    cookieOptions: { path: '/', sameSite: 'lax', secure: request.nextUrl.protocol === 'https:' },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(values) {
        for (const { name, value } of values) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of values) response.cookies.set(name, value, options);
      },
    },
  });
  // Proxy refreshes only; each protected handler independently verifies the user.
  await client.auth.getUser();
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
export const config = { matcher: ['/create', '/my-matchups', '/signin', '/api/matchups', '/api/matchups/:slug/close', '/auth/signout'] };
