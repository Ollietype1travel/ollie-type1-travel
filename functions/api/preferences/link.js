// POST /api/preferences/link  { email, turnstile }
// "Email me a link to update my preferences." Always answers the same way, whether or not the
// address is on the list. For a real, active subscriber it stores a random single-use token and
// expiry in two custom fields, then re-applies the "Preferences Link Requested" tag. A Kit
// automation on that tag sends the email containing:
//   https://ollietype1travel.com/travel-preferences/?s={{ subscriber.id }}&t={{ subscriber.preferences_token }}
import { json, readJson, sameOrigin, checkTurnstile, tooMany, validEmail, randomToken, failVerify } from '../../_lib/security.js';
import { findSubscriberByEmail, updateFields, tagIdMap, addTag, removeTag } from '../../_lib/kit.js';
import { TAG_LINK_REQUESTED } from '../../_lib/survey.js';

const TOKEN_TTL_MS = 60 * 60_000;
const generic = () => json({ ok: true });

export async function onRequestPost({ request, env }) {
  if (!env.KIT_API_KEY || !env.PREFS_SIGNING_SECRET) return json({ ok: false, error: 'config' }, 500);
  if (!sameOrigin(request, env)) return failVerify();
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  if (tooMany(`link:${ip}`, 4)) return json({ ok: false, error: 'rate' }, 429);

  const body = await readJson(request);
  if (!body || !validEmail(body.email)) return generic();
  if (!(await checkTurnstile(env, body.turnstile, ip))) return failVerify();

  try {
    const sub = await findSubscriberByEmail(env, body.email.trim());
    if (sub && sub.state === 'active') await sendLink(env, sub);
  } catch { /* swallow: the response must not reveal anything */ }
  return generic();
}

// Also used by submit.js when an email-only save reaches someone who has already saved.
export async function sendLink(env, sub) {
  const ids = await tagIdMap(env);
  const tagId = ids.get(TAG_LINK_REQUESTED);
  if (!tagId) return;
  await updateFields(env, sub, {
    preferences_token: randomToken(32),
    preferences_token_expires: new Date(Date.now() + TOKEN_TTL_MS).toISOString(),
  });
  // Remove then add so the Kit "tag added" automation fires on every request.
  await removeTag(env, tagId, sub.id);
  await addTag(env, tagId, sub.id);
}
