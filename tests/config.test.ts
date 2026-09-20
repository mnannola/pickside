import { afterEach, expect, it, vi } from 'vitest';
import { appOrigin } from '../src/lib/config';
afterEach(() => { vi.unstubAllEnvs(); });
it('normalizes a trusted public origin', () => { vi.stubEnv('APP_URL', 'https://pickside.example/'); expect(appOrigin()).toBe('https://pickside.example'); });
it.each(['https://user:pass@example.com', 'https://example.com/path', 'https://example.com?q=1', 'file:///tmp'])('rejects invalid app origin %s', value => { vi.stubEnv('APP_URL', value); expect(() => appOrigin()).toThrow(); });
it('requires HTTPS on hosted production', () => { vi.stubEnv('NODE_ENV', 'production'); vi.stubEnv('LOCAL_DATABASE', '0'); vi.stubEnv('APP_URL', 'http://example.com'); expect(() => appOrigin()).toThrow(); });

it('uses the Vercel deployment origin for previews', () => { vi.stubEnv('VERCEL_ENV', 'preview'); vi.stubEnv('VERCEL_URL', 'pickside-preview.vercel.app'); vi.stubEnv('APP_URL', 'https://pickside.example'); expect(appOrigin()).toBe('https://pickside-preview.vercel.app'); });
it('keeps the configured origin in production', () => { vi.stubEnv('VERCEL_ENV', 'production'); vi.stubEnv('VERCEL_URL', 'pickside-build.vercel.app'); vi.stubEnv('APP_URL', 'https://pickside.example'); expect(appOrigin()).toBe('https://pickside.example'); });
