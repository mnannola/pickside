import { beforeEach, afterEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ getUser: vi.fn(), factory: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({ cookies: async () => ({ getAll: () => [], set: vi.fn() }) }));
vi.mock('@supabase/ssr', () => ({ createServerClient: mocks.factory }));
import { currentCreator } from '../src/lib/supabase/server';
beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'public-test-key');
  vi.stubEnv('APP_URL', 'http://localhost:3000');
  vi.stubEnv('LOCAL_DATABASE', '1');
  mocks.factory.mockReturnValue({ auth: { getUser: mocks.getUser } });
  mocks.getUser.mockReset();
});
afterEach(() => vi.unstubAllEnvs());
it('authorizes the user verified by Supabase', async () => {
  const user = { id: 'verified-user' };
  mocks.getUser.mockResolvedValue({ data: { user }, error: null });
  expect(await currentCreator()).toEqual(user);
  expect(mocks.getUser).toHaveBeenCalledOnce();
});
it('treats a missing session as anonymous', async () => {
  mocks.getUser.mockResolvedValue({ data: { user: null }, error: { name: 'AuthSessionMissingError' } });
  expect(await currentCreator()).toBeNull();
});
it('does not accept user data accompanying an invalid token', async () => {
  mocks.getUser.mockResolvedValue({ data: { user: { id: 'forged' } }, error: { status: 401 } });
  expect(await currentCreator()).toBeNull();
});
it('fails closed during an authentication service outage', async () => {
  mocks.getUser.mockResolvedValue({ data: { user: null }, error: { status: 503 } });
  await expect(currentCreator()).rejects.toThrow('temporarily unavailable');
});
it('keeps anonymous creation available when auth is not configured', async () => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', '');
  expect(await currentCreator()).toBeNull();
  expect(mocks.getUser).not.toHaveBeenCalled();
});
