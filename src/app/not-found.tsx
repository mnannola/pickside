import Link from 'next/link';
export default function NotFound() { return <div className="page-shell empty-page"><span className="eyebrow">THIS ONE’S A NO-SHOW</span><h1>Matchup not found.</h1><p>That link may be incomplete. Check it, or start a fresh debate.</p><Link href="/create" className="button button-primary">Create a matchup ↗</Link></div>; }
