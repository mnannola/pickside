import Link from 'next/link';
import { CreateForm } from '@/components/create-form';
export const metadata = { title: 'Create a matchup' };
export default function Create() { return <div className="page-shell"><Link href="/" className="back-link">← Back to the good stuff</Link><div className="page-heading"><span className="eyebrow">LET’S START SOMETHING</span><h1>What’s the <span className="accent-word">matchup?</span></h1><p>Two things worth choosing between. You set the stage.</p></div><CreateForm/></div>; }
