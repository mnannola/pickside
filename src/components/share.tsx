'use client';
import { useEffect, useState } from 'react';
export function Share({ slug }: { slug: string }) {
  const [status, setStatus] = useState(''); const [url, setUrl] = useState(''); const [native, setNative] = useState(false);
  useEffect(() => { setUrl(window.location.origin + '/m/' + slug); setNative(!!navigator.share); }, [slug]);
  async function copy() { try { await navigator.clipboard.writeText(url); setStatus('Link copied!'); } catch { setStatus('Select the link below to copy it.'); } }
  async function share() { try { await navigator.share({ title: 'Pick a side', text: 'Two choices. What’s your pick?', url }); } catch (error) { if ((error as Error).name !== 'AbortError') setStatus('Sharing didn’t open. You can copy the link instead.'); } }
  return <div className="share-box"><div><strong>Better with a second opinion.</strong><p>Send this matchup to your people.</p></div><div className="share-actions"><button className="button button-primary" onClick={copy}>Copy link <span aria-hidden="true">↗</span></button>{native && <button className="button button-quiet" onClick={share}>Share</button>}</div><p className="share-status" role="status">{status}</p>{status.startsWith('Select') && <input aria-label="Matchup link" readOnly value={url} onFocus={e => e.target.select()}/>}</div>;
}
