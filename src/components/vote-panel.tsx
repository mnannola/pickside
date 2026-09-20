'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Matchup } from '@/lib/schema';
import { ChoiceCard } from './choice-card';
let identityRequest: Promise<Response> | undefined;
function ensureIdentity() { return identityRequest ??= fetch('/api/identity', { method: 'POST' }).finally(() => { identityRequest = undefined; }); }
export function VotePanel({ matchup }: { matchup: Matchup }) {
  const router = useRouter(); const [ready, setReady] = useState(false); const [pending, setPending] = useState(false); const [error, setError] = useState('');
  async function prepare() { setError(''); try { const result = await ensureIdentity(); if (!result.ok) throw new Error('Couldn’t prepare your vote. Please try again.'); setReady(true); } catch { setError('Couldn’t connect. Please try again.'); } }
  useEffect(() => { void prepare(); }, []);
  async function vote(choice: 'A' | 'B') {
    if (pending || !ready) return; setPending(true); setError('');
    try { const response = await fetch('/api/matchups/' + matchup.slug + '/vote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ choice }) }); const result = await response.json(); if (!response.ok) throw new Error(result.error); router.push('/m/' + matchup.slug + '/results'); router.refresh(); }
    catch (e) { setError((e as Error).message || 'Something went wrong. Try again.'); setPending(false); }
  }
  return <><div className="matchup-grid"><ChoiceCard choice={matchup.a} side="A" category={matchup.category} onChoose={() => vote('A')} disabled={!ready || pending}/><span className="vs" aria-hidden="true">VS</span><ChoiceCard choice={matchup.b} side="B" category={matchup.category} onChoose={() => vote('B')} disabled={!ready || pending}/></div><div className="vote-note" aria-live="polite">{pending ? 'Saving your pick…' : !ready && !error ? 'Getting your vote ready…' : 'One pick. No take-backs. Trust your gut.'}</div>{error && <div className="form-error" role="alert">{error}{!ready && <button className="text-link" onClick={prepare}>Try again</button>}</div>}</>;
}
