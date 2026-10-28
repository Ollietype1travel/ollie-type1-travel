import { validateAnswers, desiredTags, fieldValues, MANAGED_TAGS, TAG_COMPLETED } from './survey.js';
import { tagIdMap, subscriberTagNames, addTag, removeTag, updateFields } from './kit.js';

// Writes validated answers to an EXISTING subscriber. Order matters:
// tags first (all idempotent), fields last, so a failure part-way can always be retried,
// and survey_completed_at is only set once everything else has succeeded.
export async function applyPreferences(env, subscriber, rawAnswers, extraFields = {}) {
  const answers = validateAnswers(rawAnswers);
  const want = desiredTags(answers);
  const ids = await tagIdMap(env);
  for (const name of [...want, TAG_COMPLETED]) {
    if (!ids.has(name)) throw new Error('missing-tag');
  }
  const have = await subscriberTagNames(env, subscriber.id);

  // Add what is wanted. Remove only survey-managed tags that are no longer wanted.
  for (const name of [...want, TAG_COMPLETED]) {
    if (!have.has(name)) await addTag(env, ids.get(name), subscriber.id);
  }
  for (const name of have) {
    if (MANAGED_TAGS.has(name) && !want.has(name) && ids.has(name)) {
      await removeTag(env, ids.get(name), subscriber.id);
    }
  }
  await updateFields(env, subscriber, { ...fieldValues(answers, new Date().toISOString()), ...extraFields });
}
