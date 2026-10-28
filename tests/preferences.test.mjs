// Run with: node --test tests/   (no dependencies; Kit is mocked in memory)
import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost as session } from '../functions/api/preferences/session.js';
import { onRequestPost as submit } from '../functions/api/preferences/submit.js';
import { onRequestPost as link } from '../functions/api/preferences/link.js';
import { signSession, verifySession } from '../functions/_lib/security.js';
import { MANAGED_TAGS, TAG_COMPLETED, TAG_LINK_REQUESTED } from '../functions/_lib/survey.js';

const ENV = { KIT_API_KEY: 'k', PREFS_SIGNING_SECRET: 'test-secret-test-secret', ALLOW_INSECURE_DEV: '1' };
const ORIGIN = 'https://ollietype1travel.com';
const NOW = Date.now();

function makeKit({ down = false } = {}) {
  const tagNames = [...MANAGED_TAGS, TAG_COMPLETED, TAG_LINK_REQUESTED, 'Group Trip Waitlist', 'Checklist Legacy'];
  const tags = tagNames.map((name, i) => ({ id: 1000 + i, name }));
  const subs = new Map();
  const subTags = new Map();
  const log = [];
  const add = (id, email, minsAgo, extra = {}) => {
    subs.set(id, { id, email_address: email, state: 'active', created_at: new Date(NOW - minsAgo * 60000).toISOString(), fields: {}, ...extra });
    subTags.set(id, new Set(['Group Trip Waitlist']));
  };
  add(1, 'new@example.com', 2);
  add(2, 'old@example.com', 600);
  add(3, 'other@example.com', 3);
  globalThis.fetch = async (url, init = {}) => {
    const u = new URL(url); const m = init.method || 'GET'; const path = u.pathname.replace('/v4', '');
    log.push(`${m} ${path}${u.search}`);
    const res = (b, s = 200) => (s === 204 ? new Response(null, { status: 204 }) : new Response(JSON.stringify(b), { status: s }));
    if (down) return res({}, 503);
    if (m === 'GET' && path === '/subscribers') { const e = u.searchParams.get('email_address'); return res({ subscribers: [...subs.values()].filter((s) => s.email_address === e) }); }
    let r;
    if ((r = path.match(/^\/subscribers\/(\d+)$/))) {
      const s = subs.get(Number(r[1])); if (!s) return res({}, 404);
      if (m === 'GET') return res({ subscriber: s });
      if (m === 'PUT') { const b = JSON.parse(init.body); s.fields = { ...s.fields, ...b.fields }; return res({ subscriber: s }); }
    }
    if ((r = path.match(/^\/subscribers\/(\d+)\/tags$/))) return res({ tags: [...subTags.get(Number(r[1]))].map((name) => ({ id: tags.find((t) => t.name === name)?.id, name })), pagination: { has_next_page: false } });
    if (m === 'GET' && path === '/tags') return res({ tags, pagination: { has_next_page: false } });
    if ((r = path.match(/^\/tags\/(\d+)\/subscribers\/(\d+)$/))) {
      const name = tags.find((t) => t.id === Number(r[1])).name;
      if (m === 'POST') { subTags.get(Number(r[2])).add(name); return res({}, 201); }
      if (m === 'DELETE') { subTags.get(Number(r[2])).delete(name); return res({}, 204); }
    }
    return res({}, 404);
  };
  return { subs, subTags, log };
}
const req = (body, origin = ORIGIN) => new Request('https://ollietype1travel.com/api/preferences/x', {
  method: 'POST', headers: { 'content-type': 'application/json', origin, 'cf-connecting-ip': String(Math.random()) }, body: JSON.stringify(body),
});
const call = (fn, body, env = ENV, origin) => fn({ request: req(body, origin), env });
const answers = { destinations: ['Southeast Asia', 'Brazil', 'Southern Europe'], months: ['February', 'March', 'November'], years: ['2027', '2028'], budget: '£1,250–£2,000', age: '25–34', companions: 'Friend' };

test('signup flow: token for a fresh subscriber, answers saved to the SAME subscriber, nothing created', async () => {
  const kit = makeKit();
  const s = await (await call(session, { email: 'new@example.com' })).json();
  assert.equal(s.ok, true);
  const r = await call(submit, { token: s.token, answers });
  assert.equal((await r.json()).ok, true);
  const tags = kit.subTags.get(1);
  for (const t of ['Interest - Southeast Asia', 'Interest - Brazil', 'Interest - Southern Europe', 'Travel Month - February', 'Travel Month - March', 'Travel Month - November', 'Travel Year - 2027', 'Travel Year - 2028', TAG_COMPLETED, 'Group Trip Waitlist']) assert.ok(tags.has(t), t);
  assert.equal(kit.subs.get(1).fields.preferred_travel_months, 'February, March, November');
  assert.equal(kit.subs.get(1).fields.trip_budget, '£1,250–£2,000');
  assert.ok(kit.subs.get(1).fields.survey_completed_at);
  assert.equal(kit.subs.size, 3);
  assert.ok(!kit.log.some((l) => l.startsWith('POST /subscribers')), 'must never create subscribers');
});

test('other subscribers are untouched', async () => {
  const kit = makeKit();
  const s = await (await call(session, { email: 'new@example.com' })).json();
  await call(submit, { token: s.token, answers });
  assert.deepEqual(kit.subs.get(3).fields, {});
  assert.deepEqual([...kit.subTags.get(3)], ['Group Trip Waitlist']);
});

test('session refused for old, unknown or malformed emails, with an identical response', async () => {
  makeKit();
  const a = await call(session, { email: 'old@example.com' });
  const b = await call(session, { email: 'nobody@example.com' });
  const c = await call(session, { email: 'not-an-email' });
  assert.equal(a.status, 403);
  assert.deepEqual([await a.json(), await b.json(), await c.json()].map((x) => JSON.stringify(x)), Array(3).fill('{"ok":false,"error":"verify"}'));
});

test('signup token works once only', async () => {
  makeKit();
  const s = await (await call(session, { email: 'new@example.com' })).json();
  assert.equal((await call(submit, { token: s.token, answers })).status, 200);
  assert.equal((await call(submit, { token: s.token, answers })).status, 403);
  assert.equal((await call(session, { email: 'new@example.com' })).status, 403);
});

test('forged, tampered and expired tokens are refused', async () => {
  const kit = makeKit();
  const good = await signSession(ENV.PREFS_SIGNING_SECRET, 1, 600);
  const [v, , exp, sig] = good.split('.');
  assert.equal(await verifySession(ENV.PREFS_SIGNING_SECRET, good), 1);
  assert.equal((await call(submit, { token: `${v}.3.${exp}.${sig}`, answers })).status, 403); // swap id to attack someone else
  assert.equal((await call(submit, { token: await signSession('wrong-secret-wrong-secret', 1, 600), answers })).status, 403);
  assert.equal((await call(submit, { token: await signSession(ENV.PREFS_SIGNING_SECRET, 1, 600, NOW - 3_600_000), answers })).status, 403);
  assert.equal((await call(submit, { token: 'garbage', answers })).status, 403);
  assert.equal((await call(submit, { s: '3', t: 'guess', answers })).status, 403);
  assert.deepEqual(kit.subs.get(3).fields, {});
  assert.deepEqual(kit.subs.get(1).fields, {});
});

test('changing answers removes only obsolete survey tags and keeps unrelated tags', async () => {
  const kit = makeKit();
  kit.subTags.get(1).add('Checklist Legacy');
  const s = await (await call(session, { email: 'new@example.com' })).json();
  await call(submit, { token: s.token, answers });
  // Come back via an emailed link and change the answers.
  await call(link, { email: 'new@example.com' });
  const f = kit.subs.get(1).fields;
  assert.ok(f.preferences_token && f.preferences_token_expires);
  assert.ok(kit.subTags.get(1).has(TAG_LINK_REQUESTED));
  const r = await call(submit, { s: '1', t: f.preferences_token, answers: { destinations: ['Peru'], months: [`I'm flexible`], years: ['Just browsing'], budget: 'Not sure yet', age: '', companions: '' } });
  assert.equal(r.status, 200);
  const tags = kit.subTags.get(1);
  for (const gone of ['Interest - Brazil', 'Interest - Southeast Asia', 'Travel Month - February', 'Travel Year - 2027', 'Travel Year - 2028']) assert.ok(!tags.has(gone), gone);
  for (const kept of ['Interest - Peru', 'Travel Month - Flexible', 'Travel Year - Browsing', 'Checklist Legacy', 'Group Trip Waitlist', TAG_COMPLETED]) assert.ok(tags.has(kept), kept);
  assert.equal(kit.subs.get(1).fields.age_range, '');
  // Link token is single use.
  assert.equal(kit.subs.get(1).fields.preferences_token, '');
  assert.equal((await call(submit, { s: '1', t: f.preferences_token, answers })).status, 403);
});

test('link token: wrong value and expired value are refused; request answers identically for unknown emails', async () => {
  const kit = makeKit();
  await call(link, { email: 'old@example.com' });
  const f = kit.subs.get(2).fields;
  assert.equal((await call(submit, { s: '2', t: 'wrong', answers })).status, 403);
  kit.subs.get(2).fields.preferences_token_expires = new Date(NOW - 1000).toISOString();
  assert.equal((await call(submit, { s: '2', t: f.preferences_token, answers })).status, 403);
  const known = await (await call(link, { email: 'old@example.com' })).json();
  const unknown = await (await call(link, { email: 'nobody@example.com' })).json();
  assert.deepEqual(known, unknown);
});

test('validation: exclusivity, unknown values, empty submissions', async () => {
  makeKit();
  const t = (await (await call(session, { email: 'new@example.com' })).json()).token;
  for (const bad of [
    { months: ["I'm flexible", 'May'] }, { years: ['Just browsing', '2027'] }, { destinations: ['Atlantis'] },
    { budget: '£5' }, { destinations: 'Peru' }, {}, { destinations: [], months: [] }, null, [],
  ]) assert.equal((await call(submit, { token: t, answers: bad })).status, 400, JSON.stringify(bad));
});

test('Kit outage: no false success, and the user can retry afterwards', async () => {
  makeKit({ down: true });
  const r = await call(session, { email: 'new@example.com' });
  assert.equal(r.status, 503);
  const kit = makeKit();
  const t = await signSession(ENV.PREFS_SIGNING_SECRET, 1, 600);
  makeKit({ down: true });
  const failed = await call(submit, { token: t, answers });
  assert.equal(failed.status, 503);
  assert.notEqual((await failed.json()).ok, true);
  const kit2 = makeKit();
  assert.equal((await call(submit, { token: t, answers })).status, 200);
  assert.ok(kit2.subs.get(1).fields.survey_completed_at);
  void kit;
});

test('cross-site requests and missing config are refused; Turnstile fails closed', async () => {
  makeKit();
  assert.equal((await call(session, { email: 'new@example.com' }, ENV, 'https://evil.example')).status, 403);
  assert.equal((await call(session, { email: 'new@example.com' }, { ...ENV, KIT_API_KEY: '' })).status, 500);
  const strict = { KIT_API_KEY: 'k', PREFS_SIGNING_SECRET: ENV.PREFS_SIGNING_SECRET };
  assert.equal((await call(session, { email: 'new@example.com' }, strict)).status, 403);
});

test('survey page markup matches the backend lists', async () => {
  const { readFileSync } = await import('node:fs');
  const { ALL_DESTINATIONS, MONTHS } = await import('../functions/_lib/survey.js');
  const html = readFileSync(new URL('../travel-preferences/index.html', import.meta.url), 'utf8');
  for (const d of ALL_DESTINATIONS) assert.ok(html.includes(`value="${d.replace(/&/g, '&amp;')}"`), d);
  for (const m of MONTHS) assert.ok(html.includes(`value="${m}"`), m);
});
