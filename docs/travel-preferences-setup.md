# Travel preferences survey: setup

Page: `/travel-preferences/`  ·  API: Cloudflare Pages Functions in `functions/api/preferences/`  ·  Tests: `node --test tests/preferences.test.mjs`

## How a subscriber is identified
1. Kit saves the signup, then redirects to `/travel-preferences/?email=…` (Kit's "send subscriber data" option).
2. The page removes the email from the address bar and asks `/api/preferences/session` for a token. A token is only issued if that email belongs to an ACTIVE subscriber who joined in the last 15 minutes and has not completed the survey. The token is signed, expires after 30 minutes and stops working once the survey is saved.
3. Anyone else (older subscribers, expired tokens, direct visits) requests a personal link by email. `/api/preferences/link` stores a random single-use token (valid 1 hour) in two Kit custom fields and re-adds the tag **Preferences Link Requested**. A Kit automation on that tag sends the email.
4. Answers are only accepted with a valid token. The API never creates subscribers.

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
Fields: Travel Destinations, Preferred Travel Months, Preferred Travel Years, Trip Budget, Age Range, Travel Companions, Survey Completed At.
Tags: `Interest - …` (24), `Travel Month - …` (13), `Travel Year - …` (3), `Travel Preferences Completed`.
Example: Subscribers → filter **Tag is** `Interest - Southeast Asia` AND **Tag is** `Travel Month - February` AND **Trip Budget is** `£1,250–£2,000`. "Any of these months" needs a separate segment per month or an export.
