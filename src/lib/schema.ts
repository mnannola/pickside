import { z } from 'zod';
export const choiceSchema = z.object({ title: z.string().trim().min(1, 'Give this choice a name.').max(80), subtitle: z.string().trim().max(120).default('') });
export const matchupSchema = z.object({ a: choiceSchema, b: choiceSchema, category: z.string().trim().max(32).default('') }).refine(v => v.a.title.toLocaleLowerCase() !== v.b.title.toLocaleLowerCase(), { message: 'Choose two different names.', path: ['b', 'title'] });
export const voteSchema = z.object({ choice: z.enum(['A', 'B']) });
export type Choice = z.infer<typeof choiceSchema>;
export type MatchupInput = z.infer<typeof matchupSchema>;
export type Matchup = MatchupInput & { slug: string; created_at: string; a_votes: number; b_votes: number };
export function percentages(a: number, b: number) { const total = a + b; const first = total ? Math.round(a / total * 100) : 0; return [first, total ? 100 - first : 0] as const; }
export function variant(text: string) { let hash = 0; for (const char of text.normalize('NFC')) hash = ((hash << 5) - hash + char.codePointAt(0)!) | 0; return Math.abs(hash) % 4; }
