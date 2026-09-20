'use client';
export default function ErrorPage({ reset }: { reset: () => void }) { return <div className="page-shell empty-page"><span className="eyebrow">A SMALL TIMEOUT</span><h1>Let’s try that again.</h1><p>We couldn’t load this page. Your existing votes are safe.</p><button className="button button-primary" onClick={reset}>Try again</button></div>; }
