import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
type Database = { query<T extends Record<string, unknown>>(sql: string, params?: unknown[]): Promise<{ rows: T[] }> };
const globalDb = globalThis as unknown as { picksideDb?: Promise<Database> };
export async function database(): Promise<Database> {
  if (!globalDb.picksideDb) globalDb.picksideDb = connect().catch(error => { globalDb.picksideDb = undefined; throw error; });
  return globalDb.picksideDb;
}
async function connect(): Promise<Database> {
  if (process.env.DATABASE_URL) {
    const { default: postgres } = await import('postgres');
    const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 5 });
    return { async query<T extends Record<string, unknown>>(query: string, params: unknown[] = []) { const rows = await sql.unsafe<T[]>(query, params as never[]); return { rows: Array.from(rows) }; } };
  }
  if (process.env.LOCAL_DATABASE !== '1') throw new Error('Set DATABASE_URL or explicitly enable LOCAL_DATABASE=1.');
  const { PGlite } = await import('@electric-sql/pglite');
  const dataDir = path.resolve(/* turbopackIgnore: true */ process.env.LOCAL_DATABASE_PATH || '.data/pickside');
  await mkdir(dataDir, { recursive: true });
  const db = new PGlite(dataDir);
  await db.exec(await readFile(path.resolve('supabase/migrations/202609190001_initial.sql'), 'utf8'));
  return db;
}
