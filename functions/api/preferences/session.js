// POST /api/preferences/session  { email, turnstile }
// Called by the survey page straight after the Kit signup redirect. The email in the URL is
// NOT trusted as proof of identity. It only lets us look up the subscriber, and we only issue
// a short-lived token if that subscriber signed up in the last few minutes and has not already
// completed the survey. Every failure returns the same generic response.
import { json, failVerify, readJson, sameOrigin, checkTurnstile, tooMany, validEmail, signSession, randomToken } from '../../_lib/security.js';
import { findRecentSignup, updateFields } from '../../_lib/kit.js';

const SIGNUP_WINDOW_MS = 15 * 60_000;
const TOKEN_TTL_S = 30 * 60;
// Also store a personal code on the subscriber, so the survey link in a follow-up email
// (?s={{ subscriber.id }}&t={{ subscriber.preferences_token }}) works for the next 14 days.
const EMAIL_LINK_TTL_MS = 14 * 24 * 60 * 60_000;

export async function onRequestPost({ request, env }) {
  if (!env.KIT_API_KEY || !env.PREFS_SIGNING_SECRET) return json({ ok: false, error: 'config' }, 500);
  if (!sameOrigin(request, env)) return failVerify('origin');
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  if (tooMany(`session:${ip}`, 8)) return json({ ok: false, error: 'rate' }, 429);

  const body = await readJson(request);
  if (!body || !validEmail(body.email)) return failVerify('email-format');
  if (!(await checkTurnstile(env, body.turnstile, ip))) return failVerify('turnstile');

  try {
    const sub = await findRecentSignup(env, body.email.trim(), SIGNUP_WINDOW_MS);
    const fresh = sub && Date.now() - Date.parse(sub.created_at) <= SIGNUP_WINDOW_MS;
    const done = sub && sub.fields && sub.fields.survey_completed_at;
    if (!sub || sub.state !== 'active' || !fresh || done) {
      // Server-side log only (visible in Cloudflare real-time logs). The response stays generic.
      console.log('session refused:', !sub ? 'not-found' : sub.state !== 'active' ? 'state=' + sub.state : !fresh ? 'stale' : 'already-completed');
      return failVerify();
    }
    const f = sub.fields || {};
    const live = f.preferences_token && f.preferences_token_expires && Date.parse(f.preferences_token_expires) > Date.now();
    if (!live) {
      // Best effort: the survey itself must still work if this write fails.
      try {
        await updateFields(env, sub, {
          preferences_token: randomToken(32),
          preferences_token_expires: new Date(Date.now() + EMAIL_LINK_TTL_MS).toISOString(),
        });
      } catch { /* ignore */ }
    }
    return json({ ok: true, token: await signSession(env.PREFS_SIGNING_SECRET, sub.id, TOKEN_TTL_S) });
  } catch {
    return json({ ok: false, error: 'unavailable' }, 503);
  }
}
