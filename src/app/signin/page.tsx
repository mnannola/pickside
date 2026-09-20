import Link from 'next/link';
import { redirect } from 'next/navigation';
import { authConfigured, authDestination } from '@/lib/supabase/config';
import { currentCreator } from '@/lib/supabase/server';
import { appOrigin } from '@/lib/config';
import { SignInForm } from '@/components/sign-in-form';
export const metadata = { title: 'Sign in', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';
export default async function SignIn({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const params = await searchParams;
  const destination = authDestination(params.next);
  if (await currentCreator()) redirect(destination);
  return <div className="page-shell auth-page"><span className="eyebrow">YOUR DEBATES, ALL TOGETHER</span><h1>Make it <span className="accent-word">yours.</span></h1><p className="lede">Sign in to save your matchups and see how the votes unfold.</p><div className="auth-card">{params.error && <p className="form-error" role="alert">That sign-in link expired or couldn’t be verified. Request a fresh link and open it in this browser.</p>}{authConfigured() ? <SignInForm destination={destination} origin={appOrigin()}/> : <div className="auth-message"><h2>Creator sign-in is coming soon.</h2><p>You can still create and vote on matchups without an account.</p><Link href="/create" className="button button-primary">Create a matchup ↗</Link></div>}</div><p className="auth-note">Just here to vote? No sign-in needed.</p><Link href="/" className="text-link">Back to Pickside</Link></div>;
}
