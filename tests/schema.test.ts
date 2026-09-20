import { describe, expect, it } from 'vitest';
import { matchupSchema, voteSchema, percentages, variant } from '../src/lib/schema';
describe('matchup validation', () => {
  const valid = { a: { title: 'Gladiator' }, b: { title: 'Braveheart' } };
  it('trims text and supplies optional fields', () => { expect(matchupSchema.parse({ ...valid, a: { title: '  Gladiator  ' } })).toEqual({ a: { title: 'Gladiator', subtitle: '' }, b: { title: 'Braveheart', subtitle: '' }, category: '' }); });
  it.each(['', '  ', 'x'.repeat(81)])('rejects invalid title %j', title => { expect(matchupSchema.safeParse({ ...valid, a: { title } }).success).toBe(false); });
  it('rejects case-insensitive duplicate choices', () => { expect(matchupSchema.safeParse({ a: { title: 'Gladiator ' }, b: { title: 'gladiator' } }).success).toBe(false); });
  it('rejects oversized subtitles and categories', () => { expect(matchupSchema.safeParse({ ...valid, category: 'x'.repeat(33) }).success).toBe(false); expect(matchupSchema.safeParse({ ...valid, a: { title: 'A', subtitle: 'x'.repeat(121) } }).success).toBe(false); });
  it('accepts only A/B votes', () => { expect(voteSchema.safeParse({ choice: 'C' }).success).toBe(false); expect(voteSchema.parse({ choice: 'B' }).choice).toBe('B'); });
});
describe('results', () => {
  it.each([[0,0,0,0], [1,0,100,0], [0,1,0,100], [1,1,50,50], [1,2,33,67], [2,1,67,33]])('formats %i:%i without rounding gaps', (a,b,pa,pb) => { expect(percentages(a,b)).toEqual([pa,pb]); });
  it('keeps visual variants stable and in range for Unicode', () => { for (const text of ['Gladiator', 'Braveheart', '🌮', '日本語', '']) { expect(variant(text)).toBe(variant(text)); expect(variant(text)).toBeGreaterThanOrEqual(0); expect(variant(text)).toBeLessThan(4); } });
});
