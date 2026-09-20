import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { authConfig, authConfigured } from './config';
import { appOrigin } from '../config';

export async function serverAuthClient(writable = false) {
  const store = await cookies();
  const { url, key } = authConfig();
  return createServerClient(url, key, {
    cookieOptions: { path: '/', sameSite: 'lax', secure: appOrigin().startsWith('https:') },
    cookies: {
      getAll: () => store.getAll(),
      setAll(values) {
        // Server Components cannot write cookies. Proxy refreshes those requests.
        if (writable) for (const { name, value, options } of values) store.set(name, value, options);
      },
    },
  });
}
export const currentCreator = cache(async () => {
  if (!authConfigured()) return null;
  const client = await serverAuthClient();
  // Never authorize ownership using unverified session-cookie contents.
  const { data, error } = await client.auth.getUser();
  if (error) {
    if (error.name === 'AuthSessionMissingError' || error.status === 401 || error.status === 403 || error.code === 'refresh_token_not_found' || error.code === 'refresh_token_already_used' || error.code === 'session_not_found') return null;
    throw new Error('Sign-in is temporarily unavailable.');
  }
  return data.user;
});
