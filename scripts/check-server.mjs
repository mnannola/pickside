import assert from 'node:assert/strict';
const origin = process.env.APP_URL || 'http://localhost:3000';
let checks = 0;
async function request(path, { cookie, body, method, ...options } = {}) {
  return fetch(origin + path, { redirect: 'manual', ...options, method: method || (body ? 'POST' : 'GET'),
    headers: { Origin: origin, ...(body ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}), ...options.headers },
    ...(body ? { body: JSON.stringify(body) } : {}) });
}
function check(value, message) { assert.ok(value, message); checks++; console.log('PASS ' + message); }
for (const route of ['/', '/create']) { const response = await request(route); check(response.status === 200, route + ' renders'); }
const response = await request('/api/matchups', { body: { a: { title: 'Gladiator', subtitle: 'Are you not entertained?' }, b: { title: 'Braveheart', subtitle: 'Freedom!' }, category: 'Movie night' } });
check(response.status === 201, 'create matchup');
const { slug } = await response.json();
check(/^[\w-]{10}$/.test(slug), 'compact public slug');
const voteUrl = '/m/' + slug;
let html = await (await request(voteUrl)).text();
check(html.includes('A clean slate.'), 'first-voter state');
check(html.includes('property="og:title" content="Gladiator vs. Braveheart"'), 'matchup Open Graph metadata');
html = await (await request(voteUrl + '/results')).text();
check(html.includes('Gladiator: 0%, 0 votes') && html.includes('Braveheart: 0%, 0 votes'), 'empty results');
check((await request('/api/matchups/' + slug + '/vote', { body: { choice: 'A' } })).status === 401, 'reject missing identity');
const identityA = await request('/api/identity', { method: 'POST' });
const setCookieA = identityA.headers.get('set-cookie');
check(identityA.ok && /HttpOnly/i.test(setCookieA) && /SameSite=lax/i.test(setCookieA), 'HttpOnly first-party cookie');
const cookieA = setCookieA.split(';')[0];
const identityB = await request('/api/identity', { method: 'POST' });
const cookieB = identityB.headers.get('set-cookie').split(';')[0];
check(cookieA !== cookieB, 'independent anonymous identities');
const first = await request('/api/matchups/' + slug + '/vote', { cookie: cookieA, body: { choice: 'A' } });
check(first.ok && (await first.json()).choice === 'A', 'first vote recorded');
html = await (await request(voteUrl + '/results', { cookie: cookieA })).text();
check(html.includes('Gladiator: 100%, 1 votes') && html.includes('Braveheart: 0%, 0 votes'), '100/0 results');
const revisit = await request(voteUrl, { cookie: cookieA });
const revisitHtml = await revisit.text();
check((revisit.status === 307 && revisit.headers.get('location')?.endsWith(voteUrl + '/results')) || (revisitHtml.includes('http-equiv="refresh"') && revisitHtml.includes('url=' + voteUrl + '/results')), 'revisit redirects to results');
const retries = await Promise.all(Array.from({ length: 8 }, () => request('/api/matchups/' + slug + '/vote', { cookie: cookieA, body: { choice: 'B' } })));
for (const retry of retries) assert.equal((await retry.json()).choice, 'A');
html = await (await request(voteUrl + '/results', { cookie: cookieA })).text();
check(html.includes('Gladiator: 100%, 1 votes') && html.includes('Braveheart: 0%, 0 votes'), 'concurrent duplicate votes stay immutable');
check((await request('/api/matchups/' + slug + '/vote', { cookie: cookieB, body: { choice: 'B' } })).ok, 'second identity votes');
html = await (await request(voteUrl + '/results', { cookie: cookieB })).text();
check(html.includes('Gladiator: 50%, 1 votes') && html.includes('Braveheart: 50%, 1 votes'), '50/50 aggregate results');
check((await request('/api/matchups', { headers: { Origin: 'https://other.example' }, body: { a: { title: 'A' }, b: { title: 'B' } } })).status === 403, 'cross-origin create rejected');
check((await request('/api/matchups', { body: { a: { title: 'Same' }, b: { title: 'same' } } })).status === 400, 'duplicate names rejected');
check((await request('/api/matchups/' + slug + '/vote', { cookie: cookieB, body: { choice: 'C' } })).status === 400, 'invalid vote rejected');
const missing = await request('/m/NoSuch0000');
check([200, 404].includes(missing.status) && (await missing.text()).includes('Matchup not found.'), 'missing matchup renders not-found page');
check((await request('/api/matchups/NoSuch0000/vote', { cookie: cookieA, body: { choice: 'A' } })).status === 404, 'missing matchup vote returns 404');
console.log(checks + ' server integration checks passed. Test matchup: ' + origin + voteUrl);
