import 'server-only';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { appOrigin } from './config';
export const cookieName = 'pickside_voter';
function secret() { const value = process.env.VOTER_SECRET; if (!value || value.length < 32 || (process.env.NODE_ENV === 'production' && process.env.LOCAL_DATABASE !== '1' && value.startsWith('local-development-'))) throw new Error('VOTER_SECRET must contain at least 32 characters.'); return value; }
function sign(id: string) { return createHmac('sha256', secret()).update(id).digest('hex'); }
export function newIdentity() { const id = randomBytes(32).toString('hex'); return `${id}.${sign(id)}`; }
export function verifyIdentity(value?: string) { if (!value || !/^[a-f0-9]{64}\.[a-f0-9]{64}$/.test(value)) return null; const [id, signature] = value.split('.'); return timingSafeEqual(Buffer.from(sign(id)), Buffer.from(signature)) ? sign(`voter:${id}`) : null; }
export async function voterHash() { return verifyIdentity((await cookies()).get(cookieName)?.value); }
export const origin = appOrigin;
