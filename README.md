# Ollie Type 1 Travel website

Static personal brand, UGC portfolio and Type 1 travel resource website for Ollie Type 1 Travel.

## Framework

This is a static HTML/CSS/JavaScript website. It does not use React, Next.js, Astro, Eleventy or a package manager.

## File structure

- `index.html` — homepage
- `blog/` — blog index and article pages
- `resources/` — Type 1 travel resources page
- `about/` — about page
- `work-with-me/` — brand and UGC partnership page
- `contact/` — contact page
- `Website assets/` — images and videos
- `downloads/` — media kit and checklist downloads
- `styles.css` and `variants.css` — site styling
- `script.js` — mobile navigation and header behaviour
- `sitemap.xml`, `robots.txt`, `feed.xml` — SEO files

## Development

No install is required.

Preview locally from this folder:

`python3 -m http.server 8080`

Then open:

`http://localhost:8080/`

## Testing

There is no automated test suite. Before publishing, manually check:

- Homepage
- `/blog/`
- All article pages
- `/resources/`
- `/about/`
- `/work-with-me/`
- `/contact/`
- Mobile menu
- Checklist and media kit download links
- Contact email and social links

## Build

No build command is required. The site is static.

## Deployment

Netlify publish directory:

`.`

Netlify build command:

Leave blank, or use no build command.

Deploy by pushing to GitHub and letting Netlify redeploy from the connected repository.

## Security

Do not commit passwords, API keys, Outlook credentials, Netlify tokens or private documents.
