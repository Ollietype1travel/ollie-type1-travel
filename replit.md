# Project setup

This project is a static HTML/CSS/JavaScript website. It has no package manager, dependency installation, or build step.

## Run locally on Replit

The `Start application` workflow serves the repository root on port 5000:

```bash
python3 -m http.server 5000 --bind 0.0.0.0
```

The Replit preview opens the site at `/`. Other pages are available from their existing paths, including `/blog/`, `/resources/`, `/about/`, `/work-with-me/`, and `/contact/`.

## Production deployment

Production is managed by the existing Cloudflare project connected to GitHub. Keep the publish directory as `.` and do not create a separate Cloudflare Pages or Netlify project.