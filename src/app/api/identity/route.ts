import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { cookieName, newIdentity, verifyIdentity, origin } from '@/lib/identity';
export async function POST(request: Request) {
  if (request.headers.get('origin') !== new URL(origin()).origin) return NextResponse.json({ error: 'Request origin is not allowed.' }, { status: 403 });
  const value = (await cookies()).get(cookieName)?.value;
  const response = NextResponse.json({ ready: true }, { headers: { 'Cache-Control': 'no-store' } });
  if (!verifyIdentity(value)) response.cookies.set(cookieName, newIdentity(), { httpOnly: true, secure: new URL(origin()).protocol === 'https:', sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 365 });
  return response;
}
