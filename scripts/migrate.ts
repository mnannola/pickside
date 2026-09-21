import { readFile } from 'node:fs/promises';
import postgres from 'postgres';
import { migrationFiles } from '../src/lib/migrations';
if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL to your Supabase/PostgreSQL connection URL.');
const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
try {
  await sql.begin(async tx => {
    for (const file of migrationFiles) await tx.unsafe(await readFile(file, 'utf8'));
  });
  console.log('Database migrations complete.');
} finally { await sql.end(); }
