// POST /api/preferences/session  { email, turnstile }
// Called by the survey page straight after the Kit signup redirect. The email in the URL is
// NOT trusted as proof of identity. It only lets us look up the subscriber, and we only issue
// a short-lived token if that subscriber signed up in the last few minutes and has not already
// completed the survey. Every failure returns the same generic response.
import { json, failVerify, readJson, sameOrigin, checkTurnstile, tooMany, validEmail, signSession } from '../../_lib/security.js';
import { findSubscriberByEmail } from '../../_lib/kit.js';

const SIGNUP_WINDOW_MS = 15 * 60_000;
const TOKEN_TTL_S = 30 * 60;

export async function onRequestPost({ request, env }) {
  if (!env.KIT_API_KEY || !env.PREFS_SIGNING_SECRET) return json({ ok: false, error: 'config' }, 500);
  if (!sameOrigin(request, env)) return failVerify();
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  if (tooMany(`session:${ip}`, 8)) return json({ ok: false, error: 'rate' }, 429);

  const body = await readJson(request);
  if (!body || !validEmail(body.email)) return failVerify();
  if (!(await checkTurnstile(env, body.turnstile, ip))) return failVerify();

  try {
    const sub = await findSubscriberByEmail(env, body.email.trim());
    const fresh = sub && Date.now() - Date.parse(sub.created_at) <= SIGNUP_WINDOW_MS;
    const done = sub && sub.fields && sub.fields.survey_completed_at;
    if (!sub || sub.state !== 'active' || !fresh || done) return failVerify();
    return json({ ok: true, token: await signSession(env.PREFS_SIGNING_SECRET, sub.id, TOKEN_TTL_S) });
  } catch {
    return json({ ok: false, error: 'unavailable' }, 503);
  }
}
