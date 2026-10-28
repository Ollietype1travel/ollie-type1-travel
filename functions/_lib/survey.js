// Survey definition and validation. This is the single source of truth for what the
// backend will accept. Nothing outside these lists can ever become a tag or field value.

export const DESTINATIONS = {
  'North America': ['USA', 'Canada', 'Mexico'],
  'Central & South America': ['Brazil', 'Colombia', 'Peru', 'Costa Rica', 'Argentina', 'Other Central or South America'],
  'Europe': ['Southern Europe', 'Western Europe', 'Eastern Europe', 'Northern Europe'],
  'Asia & Pacific': ['Southeast Asia', 'East Asia', 'South Asia', 'Australia & New Zealand', 'Pacific Islands'],
  'Africa & Middle East': ['North Africa', 'East Africa', 'Southern Africa', 'Middle East'],
  'Polar Regions': ['Arctic', 'Antarctica'],
};
export const ALL_DESTINATIONS = Object.values(DESTINATIONS).flat();

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const MONTH_FLEXIBLE = "I'm flexible";
export const YEARS = ['2027', '2028'];
export const YEAR_BROWSING = 'Just browsing';
export const BUDGETS = ['Under £750', '£750–£1,250', '£1,250–£2,000', '£2,000+', 'Not sure yet'];
export const AGES = ['18–24', '25–34', '35–44', '45–54', '55+', 'Prefer not to say'];
export const COMPANIONS = ['Solo', 'Partner', 'Friend', 'Family', 'Not sure yet'];

// Tag names. Only tags in MANAGED_TAGS are ever added or removed by the survey.
export const TAG_COMPLETED = 'Travel Preferences Completed';
export const TAG_LINK_REQUESTED = 'Preferences Link Requested';
const destTag = (d) => `Interest - ${d}`;
const monthTag = (m) => `Travel Month - ${m === MONTH_FLEXIBLE ? 'Flexible' : m}`;
const yearTag = (y) => `Travel Year - ${y === YEAR_BROWSING ? 'Browsing' : y}`;

export const MANAGED_TAGS = new Set([
  ...ALL_DESTINATIONS.map(destTag),
  ...MONTHS.map(monthTag),
  monthTag(MONTH_FLEXIBLE),
  ...YEARS.map(yearTag),
  yearTag(YEAR_BROWSING),
]);

const unique = (a) => [...new Set(a)];
const oneOf = (v, list) => (typeof v === 'string' && list.includes(v) ? v : null);

function validList(value, allowed, max) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > max) throw new Error('invalid');
  const out = unique(value);
  for (const v of out) if (typeof v !== 'string' || !allowed.includes(v)) throw new Error('invalid');
  return out;
}

// Returns normalised answers or throws Error('invalid' | 'empty').
export function validateAnswers(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('invalid');

  const destinations = validList(raw.destinations, ALL_DESTINATIONS, ALL_DESTINATIONS.length);
  let months = validList(raw.months, [...MONTHS, MONTH_FLEXIBLE], MONTHS.length + 1);
  let years = validList(raw.years, [...YEARS, YEAR_BROWSING], YEARS.length + 1);

  // "Flexible" / "Just browsing" are mutually exclusive with the specific options.
  if (months.includes(MONTH_FLEXIBLE) && months.length > 1) throw new Error('invalid');
  if (years.includes(YEAR_BROWSING) && years.length > 1) throw new Error('invalid');
  // Keep calendar order so stored values are consistent.
  months = months.includes(MONTH_FLEXIBLE) ? months : MONTHS.filter((m) => months.includes(m));
  years = years.includes(YEAR_BROWSING) ? years : YEARS.filter((y) => years.includes(y));

  const budget = raw.budget ? oneOf(raw.budget, BUDGETS) : null;
  const age = raw.age ? oneOf(raw.age, AGES) : null;
  const companions = raw.companions ? oneOf(raw.companions, COMPANIONS) : null;
  if ((raw.budget && !budget) || (raw.age && !age) || (raw.companions && !companions)) throw new Error('invalid');

  const ordered = ALL_DESTINATIONS.filter((d) => destinations.includes(d));
  if (!ordered.length && !months.length && !years.length && !budget && !age && !companions) throw new Error('empty');
  return { destinations: ordered, months, years, budget, age, companions };
}

export function desiredTags(a) {
  return new Set([
    ...a.destinations.map(destTag),
    ...a.months.map(monthTag),
    ...a.years.map(yearTag),
  ]);
}

// Custom field values. Multi-selects are comma-separated in a fixed order.
export function fieldValues(a, nowIso) {
  return {
    travel_destinations: a.destinations.join(', '),
    preferred_travel_months: a.months.join(', '),
    preferred_travel_years: a.years.join(', '),
    trip_budget: a.budget || '',
    age_range: a.age || '',
    travel_companions: a.companions || '',
    survey_completed_at: nowIso,
  };
}
