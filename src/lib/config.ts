export function appOrigin() {
  const previewHost = process.env.VERCEL_BRANCH_URL || process.env.VERCEL_URL;
  const origin = process.env.VERCEL_ENV === 'preview' && previewHost
    ? 'https://' + previewHost
    : process.env.APP_URL || 'http://localhost:3000';
  const url = new URL(origin);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error('APP_URL must be an HTTP(S) origin without credentials or a path.');
  if (process.env.NODE_ENV === 'production' && process.env.LOCAL_DATABASE !== '1' && url.protocol !== 'https:') throw new Error('Production requires an HTTPS APP_URL.');
  return url.origin;
}
