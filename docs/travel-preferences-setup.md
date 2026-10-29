# Travel preferences survey: setup

Page: `/travel-preferences/`  ·  API: Cloudflare Pages Functions in `functions/api/preferences/`  ·  Tests: `node --test tests/preferences.test.mjs`

## How a subscriber is identified
1. Kit saves the signup, then redirects to `/travel-preferences/?email=…` (Kit's "send subscriber data" option).
2. The page removes the email from the address bar and asks `/api/preferences/session` for a token. A token is only issued if that email belongs to an ACTIVE subscriber who joined in the last 15 minutes and has not completed the survey. The token is signed, expires after 30 minutes and stops working once the survey is saved.
3. Anyone else (older subscribers, expired tokens, direct visits, links from other emails) sees **Link your travel preferences to your email**, types their email and goes straight to the survey. An email alone proves nothing, so on save (Turnstile-checked) the answers are only written if that subscriber has **never saved preferences**. If they have, nothing is changed and they are emailed a personal link instead: a random single-use token (valid 1 hour) is stored in two Kit custom fields and the tag **Preferences Link Requested** is re-added, and a Kit automation on that tag sends the email. The page shows the same thank-you whatever happened, so it never reveals whether an address is subscribed.
4. Answers are only accepted with a valid token. The API never creates subscribers.

## Survey link in emails (reminder sequence)
When the survey page handles a new signup it also stores a personal code on the subscriber (valid 14 days). Emails link to
`https://ollietype1travel.com/travel-preferences/?s={{ subscriber.id }}&t={{ subscriber.preferences_token }}`
The code is cleared as soon as the survey is saved. A subscriber with no code (for example anyone who joined before launch) lands on the "email me a link" box instead.
- Draft sequence: **Type 1 Travel Club — Travel Preferences** (3 emails, inactive, unpublished).
- In Kit, open the sequence → Settings → Exclude subscribers → Tags → select **Travel Preferences Completed**, so people who finish stop getting reminders.
- At launch, ask Claude to give existing subscribers a code (a one-off Kit update), so older subscribers can use the same link.

## Cloudflare settings (Workers & Pages → your site → Settings)
Environment variables / secrets (Production, type **Secret**):
- `KIT_API_KEY`: a Kit v4 API key (Kit → Settings → Developer → API Keys)
- `PREFS_SIGNING_SECRET`: a long random string (e.g. `openssl rand -base64 48`)
- `TURNSTILE_SECRET_KEY`: from Cloudflare Turnstile (create a widget for ollietype1travel.com)
Then put the Turnstile **site key** (public) in `travel-preferences/index.html`, replacing `REPLACE_WITH_TURNSTILE_SITE_KEY`.
Optional: `ALLOWED_ORIGINS` (comma-separated; defaults to https://ollietype1travel.com and https://www.ollietype1travel.com).

Rate limiting: add a WAF rate-limiting rule for URI path starting with `/api/preferences/`, e.g. 20 requests per minute per IP, action Block. (The in-code limiter is only a per-instance speed bump.)

## Kit settings
- Existing waitlist form → redirect to `https://ollietype1travel.com/travel-preferences/` with **Send subscriber data to thank you page** on. Check the real redirect URL once to confirm the parameter name (the page reads `email` or `email_address`).
- Keep auto-confirm as it is. Nothing here changes it.
- Automation for the update link: trigger **Tag is added → Preferences Link Requested**, then send an email whose button links to
  `https://ollietype1travel.com/travel-preferences/?s={{ subscriber.id }}&t={{ subscriber.preferences_token }}`
  (confirm `subscriber.id` renders in a test send; if it does not, tell me and we switch to an email-based key).

## Finding subscribers
Fields: Travel Destinations, Top Destination, Preferred Travel Months, Preferred Travel Years, Trip Budget, Age Range, Travel Companions, Booking Interest, Survey Completed At. Multi-choice answers (destinations, months, years, companions) are stored comma-separated.
Tags: `Interest - <country>` (57 countries and polar regions), `Region - <region>` (10, added automatically for any country picked in that region), `Travel Month - …` (13), `Travel Year - …` (2027, 2028, 2029 or later, Not sure yet; the old `Travel Year - Browsing` is removed on the next save), `Travel Preferences Completed`, `Preferences Link Requested`.
Saving again (through the emailed link) updates the same subscriber: fields are overwritten and survey tags that no longer apply are removed. The API never creates or duplicates subscribers.
Example: Subscribers → filter **Tag is** `Region - Southeast Asia` (or a single country such as `Interest - Thailand`) AND **Tag is** `Travel Month - February` AND **Trip Budget is** `£1,250–£2,000`. "Any of these months" needs a separate segment per month or an export.
