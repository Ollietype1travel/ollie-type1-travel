// POST /api/preferences/submit  { token | (s, t) | (email, turnstile), answers }
// The first two need no Turnstile: both credentials are unguessable secrets issued after a Turnstile-checked step.
//  - token: signed signup-session token from /session (one use: refused once the survey is completed)
//  - s + t: subscriber id + single-use link token from an emailed "update your preferences" link
//  - email: typed into the "link your travel preferences" box. It proves nothing, so it can only
//    fill in a subscriber who has never saved; anyone who has gets an emailed link instead.
import { json, failVerify, readJson, sameOrigin, tooMany, verifySession, safeEqual, checkTurnstile, validEmail } from '../../_lib/security.js';
import { getSubscriber, findRecentSignup } from '../../_lib/kit.js';
import { applyPreferences } from '../../_lib/apply.js';
import { validateAnswers } from '../../_lib/survey.js';
import { sendLink } from './link.js';

const SIGNUP_WINDOW_MS = 15 * 60_000;
// Finishing by any route clears any emailed-link code, so the survey cannot be re-opened with an old email.
const CLEAR_LINK = { preferences_token: '', preferences_token_expires: '' };

// Every outcome (saved, already saved and emailed a link, not on the list) answers the same way.
async function emailOnly(env, body, ip) {
  const email = body.email.trim();
  if (!validEmail(email)) return json({ ok: false, error: 'invalid' }, 400);
  if (!(await checkTurnstile(env, body.turnstile, ip))) return failVerify();
  // Check the answers before the lookup so a bad answer is reported the same way for any email.
  try { validateAnswers(body.answers); } catch (e) { return json({ ok: false, error: e.message === 'empty' ? 'empty' : 'invalid' }, 400); }

  const sub = await findRecentSignup(env, email, SIGNUP_WINDOW_MS);
  if (!sub || sub.state !== 'active') {
    console.log('email save ignored:', !sub ? 'not-found' : 'state=' + sub.state);
  } else if (sub.fields && sub.fields.survey_completed_at) {
    console.log('email save: already completed, link sent');
    await sendLink(env, sub);
  } else {
    await applyPreferences(env, sub, body.answers, CLEAR_LINK);
  }
  return json({ ok: true });
}

export async function onRequestPost({ request, env }) {
  if (!env.KIT_API_KEY || !env.PREFS_SIGNING_SECRET) return json({ ok: false, error: 'config' }, 500);
  if (!sameOrigin(request, env)) return failVerify();
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  if (tooMany(`submit:${ip}`, 10)) return json({ ok: false, error: 'rate' }, 429);

  const body = await readJson(request);
  if (!body) return json({ ok: false, error: 'invalid' }, 400);
  try {
    if (typeof body.email === 'string' && body.token === undefined && body.s === undefined) return await emailOnly(env, body, ip);
    let sub = null;
    let mode = null;
    if (typeof body.token === 'string') {
      const id = await verifySession(env.PREFS_SIGNING_SECRET, body.token);
      if (id) { sub = await getSubscriber(env, id); mode = 'session'; }
    } else if (typeof body.s === 'string' && typeof body.t === 'string' && /^\d{1,15}$/.test(body.s)) {
      sub = await getSubscriber(env, Number(body.s));
      const f = (sub && sub.fields) || {};
      const live = f.preferences_token && f.preferences_token_expires && Date.parse(f.preferences_token_expires) > Date.now();
      mode = live && safeEqual(f.preferences_token, body.t) ? 'link' : null;
    }
    if (!sub || !mode || sub.state !== 'active') return failVerify();
    // A signup-session token can only ever be used once.
    if (mode === 'session' && sub.fields && sub.fields.survey_completed_at) return failVerify();

    await applyPreferences(env, sub, body.answers, CLEAR_LINK);
    return json({ ok: true });
  } catch (e) {
    if (e && (e.message === 'invalid' || e.message === 'empty')) return json({ ok: false, error: e.message }, 400);
    return json({ ok: false, error: 'unavailable' }, 503);
  }
}
