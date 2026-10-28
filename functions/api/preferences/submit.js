// POST /api/preferences/submit  { token | (s, t), answers }
// No Turnstile here: both credentials are unguessable secrets issued after a Turnstile-checked step.
//  - token: signed signup-session token from /session (one use: refused once the survey is completed)
//  - s + t: subscriber id + single-use link token from an emailed "update your preferences" link
import { json, failVerify, readJson, sameOrigin, tooMany, verifySession, safeEqual } from '../../_lib/security.js';
import { getSubscriber } from '../../_lib/kit.js';
import { applyPreferences } from '../../_lib/apply.js';

export async function onRequestPost({ request, env }) {
  if (!env.KIT_API_KEY || !env.PREFS_SIGNING_SECRET) return json({ ok: false, error: 'config' }, 500);
  if (!sameOrigin(request, env)) return failVerify();
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  if (tooMany(`submit:${ip}`, 10)) return json({ ok: false, error: 'rate' }, 429);

  const body = await readJson(request);
  if (!body) return json({ ok: false, error: 'invalid' }, 400);
  try {
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

    // Finishing by either route clears any emailed-link code, so the survey cannot be re-opened with an old email.
    const extra = { preferences_token: '', preferences_token_expires: '' };
    await applyPreferences(env, sub, body.answers, extra);
    return json({ ok: true });
  } catch (e) {
    if (e && (e.message === 'invalid' || e.message === 'empty')) return json({ ok: false, error: e.message }, 400);
    return json({ ok: false, error: 'unavailable' }, 503);
  }
}
