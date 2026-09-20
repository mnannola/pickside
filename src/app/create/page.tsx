import Link from 'next/link';
import { CreateForm } from '@/components/create-form';
import { currentCreator } from '@/lib/supabase/server';
import { authConfigured } from '@/lib/supabase/config';
export const metadata = { title: 'Create a matchup' };
export const dynamic = 'force-dynamic';
export default async function Create() {
  const creator = await currentCreator();
  return <div className="page-shell"><Link href="/" className="back-link">← Back to the good stuff</Link><div className="page-heading"><span className="eyebrow">LET’S START SOMETHING</span><h1>What’s the <span className="accent-word">matchup?</span></h1><p>Two things worth choosing between. You set the stage.</p></div>{creator ? <p className="ownership-note">✓ This matchup will be saved in <Link href="/my-matchups">My Matchups</Link>.</p> : authConfigured() ? <p className="ownership-note"><Link href="/signin?next=/create">Sign in to save your matchups</Link>, or keep going without an account.</p> : null}<CreateForm signedIn={Boolean(creator)}/></div>;
}
