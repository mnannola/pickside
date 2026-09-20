export function appOrigin() {
  const url = new URL(process.env.APP_URL || 'http://localhost:3000');
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error('APP_URL must be an HTTP(S) origin without credentials or a path.');
  if (process.env.NODE_ENV === 'production' && process.env.LOCAL_DATABASE !== '1' && url.protocol !== 'https:') throw new Error('Production requires an HTTPS APP_URL.');
  return url.origin;
}
