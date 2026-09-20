import { readFile } from 'node:fs/promises';
import postgres from 'postgres';
if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL to your Supabase/PostgreSQL connection URL.');
const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
try { await sql.begin(async tx => { await tx.unsafe(await readFile('supabase/migrations/202609190001_initial.sql', 'utf8')); }); console.log('Database migration complete.'); } finally { await sql.end(); }
