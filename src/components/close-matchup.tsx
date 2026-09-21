'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
export function CloseMatchup({ slug }: { slug: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  async function close() {
    if (pending) return;
    setPending(true); setError('');
    try {
      const response = await fetch('/api/matchups/' + slug + '/close', { method: 'POST' });
      if (!response.ok) throw new Error(response.status === 401 ? 'Your session expired. Sign in again to close voting.' : 'Could not close voting. Please try again.');
      setConfirming(false); router.refresh();
    } catch (error) { setError((error as Error).message); }
    finally { setPending(false); }
  }
  return <div className="close-control">{confirming ? <div className="close-confirm"><p>Close voting for good? Results and share links will stay available.</p><div><button className="button button-outline" disabled={pending} onClick={() => setConfirming(false)}>Keep open</button><button className="button button-primary" disabled={pending} onClick={close}>{pending ? 'Closing…' : 'Yes, close voting'}</button></div></div> : <button className="text-link" onClick={() => setConfirming(true)}>Close voting</button>}{error && <p className="form-error" role="alert">{error}</p>}</div>;
}
