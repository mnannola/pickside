export function authConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}
export function authConfig() {
  if (!authConfigured()) throw new Error('Supabase Auth is not configured.');
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  };
}
export function authDestination(value: string | null | undefined) {
  return (value === '/create' || value === '/activity') ? value : '/my-matchups';
}
