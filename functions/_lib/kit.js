// Minimal Kit API v4 client. The API key stays in env.KIT_API_KEY and never reaches the browser.

const BASE = 'https://api.kit.com/v4';

export class KitError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

async function call(env, method, path, body, attempt = 0) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        'X-Kit-Api-Key': env.KIT_API_KEY,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    if (attempt < 2) { await sleep(300 * (attempt + 1)); return call(env, method, path, body, attempt + 1); }
    throw new KitError(0, 'network');
  }
  if ((res.status === 429 || res.status >= 500) && attempt < 2) {
    await sleep(400 * (attempt + 1));
    return call(env, method, path, body, attempt + 1);
  }
  if (!res.ok && !(method === 'DELETE' && res.status === 404)) throw new KitError(res.status, `kit ${res.status}`);
  if (res.status === 204) return {};
  try { return await res.json(); } catch { return {}; }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Existing subscriber only. This module has no function that creates subscribers.
export async function findSubscriberByEmail(env, email) {
  const data = await call(env, 'GET', `/subscribers?email_address=${encodeURIComponent(email)}`);
  const s = (data.subscribers || []).find((x) => x.email_address && x.email_address.toLowerCase() === email.toLowerCase());
  return s || null;
}

// The waitlist form that redirects to the survey (override with env.KIT_FORM_ID).
const SIGNUP_FORM_ID = '9892604';

// Kit's subscriber search is eventually consistent and can miss a signup for a minute or more,
// so a lookup straight after the redirect finds nothing. The form's own subscriber list shows
// new signups at once, so check the last few minutes of it before giving up.
export async function findRecentSignup(env, email, windowMs) {
  const found = await findSubscriberByEmail(env, email);
  if (found) return found;
  let s;
  try {
    const since = new Date(Date.now() - windowMs).toISOString();
    const data = await call(env, 'GET', `/forms/${env.KIT_FORM_ID || SIGNUP_FORM_ID}/subscribers?added_after=${encodeURIComponent(since)}&per_page=1000`);
    s = (data.subscribers || []).find((x) => x.email_address && x.email_address.toLowerCase() === email.toLowerCase());
  } catch { return null; }
  if (!s) return null;
  try { return (await getSubscriber(env, s.id)) || s; } catch { return s; }
}

export async function getSubscriber(env, id) {
  try {
    const data = await call(env, 'GET', `/subscribers/${id}`);
    return data.subscriber || null;
  } catch (e) {
    if (e instanceof KitError && e.status === 404) return null;
    throw e;
  }
}

export async function updateFields(env, subscriber, fields) {
  const data = await call(env, 'PUT', `/subscribers/${subscriber.id}`, {
    email_address: subscriber.email_address,
    fields,
  });
  // Kit reports unknown field keys in `warnings`. Never claim success if any field was ignored.
  if (Array.isArray(data.warnings) && data.warnings.length) throw new KitError(422, 'field warnings');
  return data.subscriber;
}

async function paged(env, path) {
  const out = [];
  let after = null;
  for (let i = 0; i < 20; i++) {
    const sep = path.includes('?') ? '&' : '?';
    const data = await call(env, 'GET', `${path}${sep}per_page=500${after ? `&after=${encodeURIComponent(after)}` : ''}`);
    out.push(...(data.tags || []));
    if (!data.pagination?.has_next_page) break;
    after = data.pagination.end_cursor;
  }
  return out;
}

let tagCache = { at: 0, map: null };
export async function tagIdMap(env, now = Date.now()) {
  if (tagCache.map && now - tagCache.at < 300_000) return tagCache.map;
  const tags = await paged(env, '/tags');
  const map = new Map(tags.map((t) => [t.name, t.id]));
  tagCache = { at: now, map };
  return map;
}

export async function subscriberTagNames(env, id) {
  const tags = await paged(env, `/subscribers/${id}/tags`);
  return new Set(tags.map((t) => t.name));
}

export const addTag = (env, tagId, subscriberId) => call(env, 'POST', `/tags/${tagId}/subscribers/${subscriberId}`, {});
export const removeTag = (env, tagId, subscriberId) => call(env, 'DELETE', `/tags/${tagId}/subscribers/${subscriberId}`);
