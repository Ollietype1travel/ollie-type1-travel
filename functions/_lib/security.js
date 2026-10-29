// Small security helpers for the preferences endpoints. Web Crypto only, no dependencies.

const enc = new TextEncoder();

export function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'no-referrer',
    },
  });
}

// Generic, non-revealing failure. The same body is used for every verification failure
// so the endpoints cannot be used to discover who is on the list.
// `reason` is only ever passed for checks that run before any subscriber lookup, so it says
// nothing about whether an address is subscribed.
export const failVerify = (reason) => json(reason ? { ok: false, error: 'verify', reason } : { ok: false, error: 'verify' }, 403);

export function b64url(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function randomToken(bytes = 32) {
  return b64url(crypto.getRandomValues(new Uint8Array(bytes)));
}

async function hmacKey(secret) {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}

async function hmac(secret, data) {
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(secret), enc.encode(data));
  return b64url(new Uint8Array(sig));
}

// Constant-time string comparison.
export function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const x = enc.encode(a);
  const y = enc.encode(b);
  let diff = x.length ^ y.length;
  const n = Math.max(x.length, y.length);
  for (let i = 0; i < n; i++) diff |= (x[i] || 0) ^ (y[i] || 0);
  return diff === 0;
}

// Signup session token: v1.<subscriberId>.<expiresAtSeconds>.<signature>
export async function signSession(secret, subscriberId, ttlSeconds, now = Date.now()) {
  const exp = Math.floor(now / 1000) + ttlSeconds;
  const body = `v1.${subscriberId}.${exp}`;
  return `${body}.${await hmac(secret, body)}`;
}

export async function verifySession(secret, token, now = Date.now()) {
  if (typeof token !== 'string' || token.length > 200) return null;
  const parts = token.split('.');
  if (parts.length !== 4 || parts[0] !== 'v1') return null;
  const [v, id, exp, sig] = parts;
  if (!/^\d{1,15}$/.test(id) || !/^\d{1,12}$/.test(exp)) return null;
  if (!safeEqual(sig, await hmac(secret, `${v}.${id}.${exp}`))) return null;
  if (Number(exp) * 1000 < now) return null;
  return Number(id);
}

export function sameOrigin(request, env) {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  const allowed = (env.ALLOWED_ORIGINS || 'https://ollietype1travel.com,https://www.ollietype1travel.com')
    .split(',').map((s) => s.trim()).filter(Boolean);
  return allowed.includes(origin);
}

export async function readJson(request, maxBytes = 8192) {
  const type = request.headers.get('content-type') || '';
  if (!type.toLowerCase().startsWith('application/json')) return null;
  const text = await request.text();
  if (text.length > maxBytes) return null;
  try { return JSON.parse(text); } catch { return null; }
}

// Cloudflare Turnstile. Fails closed unless explicitly running in dev mode.
export async function checkTurnstile(env, token, ip) {
  if (!env.TURNSTILE_SECRET_KEY) return env.ALLOW_INSECURE_DEV === '1';
  if (typeof token !== 'string' || !token || token.length > 2048) return false;
  const body = new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: token });
  if (ip) body.set('remoteip', ip);
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}

// Per-isolate burst limiter. It is a speed bump only: isolates are not shared, so the real
// limit must be a Cloudflare WAF rate-limiting rule on /api/preferences/* (see README).
const hits = new Map();
export function tooMany(key, limit = 12, windowMs = 60_000, now = Date.now()) {
  const recent = (hits.get(key) || []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > limit;
}

export function validEmail(v) {
  return typeof v === 'string' && v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}
