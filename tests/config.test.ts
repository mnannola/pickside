import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { appOrigin } from '../src/lib/config';
beforeEach(() => { vi.stubEnv('VERCEL_BRANCH_URL', ''); vi.stubEnv('VERCEL_URL', ''); vi.stubEnv('VERCEL_ENV', ''); });
afterEach(() => { vi.unstubAllEnvs(); });
it('normalizes a trusted public origin', () => { vi.stubEnv('APP_URL', 'https://pickside.example/'); expect(appOrigin()).toBe('https://pickside.example'); });
it.each(['https://user:pass@example.com', 'https://example.com/path', 'https://example.com?q=1', 'file:///tmp'])('rejects invalid app origin %s', value => { vi.stubEnv('APP_URL', value); expect(() => appOrigin()).toThrow(); });
it('requires HTTPS on hosted production', () => { vi.stubEnv('NODE_ENV', 'production'); vi.stubEnv('LOCAL_DATABASE', '0'); vi.stubEnv('APP_URL', 'http://example.com'); expect(() => appOrigin()).toThrow(); });

it('uses the Vercel deployment origin for previews', () => { vi.stubEnv('VERCEL_ENV', 'preview'); vi.stubEnv('VERCEL_URL', 'pickside-preview.vercel.app'); vi.stubEnv('APP_URL', 'https://pickside.example'); expect(appOrigin()).toBe('https://pickside-preview.vercel.app'); });
it('keeps the configured origin in production', () => { vi.stubEnv('VERCEL_ENV', 'production'); vi.stubEnv('VERCEL_URL', 'pickside-build.vercel.app'); vi.stubEnv('APP_URL', 'https://pickside.example'); expect(appOrigin()).toBe('https://pickside.example'); });

it('uses the stable branch host for sign-in callbacks and mutations on previews', () => { vi.stubEnv('VERCEL_ENV', 'preview'); vi.stubEnv('VERCEL_BRANCH_URL', 'pickside-git-feature-creator-accounts-mnannolas-projects.vercel.app'); vi.stubEnv('VERCEL_URL', 'pickside-build123.vercel.app'); vi.stubEnv('APP_URL', 'http://localhost:3000'); expect(appOrigin()).toBe('https://pickside-git-feature-creator-accounts-mnannolas-projects.vercel.app'); });
