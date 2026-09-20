'use client';
import { useState } from 'react';
import { z } from 'zod';
import { browserAuthClient } from '@/lib/supabase/client';
export function SignInForm({ destination, origin }: { destination: string; origin: string }) {
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;
    setError('');
    const parsed = z.email().safeParse(email.trim());
    if (!parsed.success) { setError('Enter a valid email address.'); return; }
    setPending(true);
    try {
      const callback = new URL('/auth/callback', origin);
      callback.searchParams.set('next', destination);
      const { error } = await browserAuthClient().auth.signInWithOtp({
        email: parsed.data,
        options: { emailRedirectTo: callback.toString(), shouldCreateUser: true },
      });
      if (error) { setError('We couldn’t send the link. Please wait a minute and try again.'); return; }
      setSent(true);
    } catch { setError('Couldn’t connect. Please try again.'); }
    finally { setPending(false); }
  }
  if (sent) return <div className="auth-message" role="status"><span className="eyebrow">CHECK YOUR INBOX</span><h2>Your link is on its way.</h2><p>Open the sign-in link sent to <strong>{email.trim()}</strong> in this same browser. It will bring you back here.</p><p>It may take a minute. Check your spam folder too.</p><button className="text-link" onClick={() => setSent(false)}>Use another email or resend</button></div>;
  return <form onSubmit={submit} className="auth-form"><label htmlFor="email">Email address</label><input id="email" type="email" autoComplete="email" inputMode="email" required maxLength={254} value={email} placeholder="you@example.com" onChange={event => setEmail(event.target.value)}/>{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-primary" disabled={pending}>{pending ? 'Sending your link…' : 'Email me a sign-in link'} <span aria-hidden="true">↗</span></button><p className="form-footnote">New here? Your first sign-in creates your account.<br/>No password to remember.</p></form>;
}
