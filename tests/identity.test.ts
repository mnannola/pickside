import { beforeAll, expect, it } from 'vitest';
import { newIdentity, verifyIdentity } from '../src/lib/identity';
beforeAll(() => { process.env.VOTER_SECRET = 'testing-only-identity-secret-with-32-characters'; });
it('issues unique signed identities and stable pseudonymous hashes', () => { const token = newIdentity(); expect(token).not.toBe(newIdentity()); const hash = verifyIdentity(token); expect(hash).toMatch(/^[a-f0-9]{64}$/); expect(hash).toBe(verifyIdentity(token)); expect(token).not.toContain(hash); });
it('rejects modified, malformed and missing identity cookies', () => { const token = newIdentity(); expect(verifyIdentity(token.slice(0, -1) + (token.endsWith('0') ? '1' : '0'))).toBeNull(); expect(verifyIdentity('attacker-input')).toBeNull(); expect(verifyIdentity()).toBeNull(); });
