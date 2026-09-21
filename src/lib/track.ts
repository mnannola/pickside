'use client';
export async function track(event: 'matchup_open' | 'share_copy' | 'share_native', slug: string) {
 if (navigator.doNotTrack === '1' || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl) return;
 if (event === 'matchup_open' && new URLSearchParams(window.location.search).get('created') === '1') return;
 try { await fetch('/api/analytics', { method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({event,slug}),keepalive:true }); } catch { /* Never block voting or sharing. */ }
}
