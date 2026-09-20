import { origin } from './identity';
export function allowedOrigin(request: Request) { return request.headers.get('origin') === new URL(origin()).origin; }
export async function readJson(request: Request) {
  if (Number(request.headers.get('content-length')) > 4096) throw new Error('Request too large.');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('Missing request body.');
  let length = 0; const chunks: Uint8Array[] = [];
  try { while (true) { const { done, value } = await reader.read(); if (done) break; length += value.length; if (length > 4096) { await reader.cancel(); throw new Error('Request too large.'); } chunks.push(value); } }
  finally { reader.releaseLock(); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
}
