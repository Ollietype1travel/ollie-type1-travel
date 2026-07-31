# Blog instructions for Ollie Type 1 Travel

This site is a static HTML website. There is no paid CMS and no complicated dashboard.

## 1. Where article files are stored

Blog articles live inside:

`blog/article-url-slug/index.html`

Examples:

- `blog/keeping-insulin-cool-southeast-asia/index.html`
- `blog/type-1-diabetes-travel-packing-list/index.html`

The blog index is:

`blog/index.html`

## 2. How to create a new article

Duplicate an existing article folder, rename the folder to the new article URL, then edit the new `index.html`.

Example:

`blog/new-guide-title/index.html`

Use lowercase words and hyphens for the folder name.

## 3. Fields you must complete

Update these in the new article:

- `<title>`
- `<meta name="description">`
- `<link rel="canonical">`
- Open Graph title, description, URL and image
- The visible article title
- Publication date
- Updated date
- Reading time
- Category
- Hero image and alt text
- Structured data block

## 4. How to add title, description, images and body copy

The article title is the `<h1>`.

The short intro is the paragraph with class `article-standfirst`.

The hero image is the image with class `article-hero-img`.

Article body copy sits inside:

`<main class="article-main">`

Use proper headings:

- `<h2>` for main sections
- `<h3>` for subsections

## 5. How to add an Amazon affiliate URL

Search for:

`AMAZON_AFFILIATE_URL_REQUIRED`

Replace it with the real Amazon affiliate link.

Keep the affiliate disclosure near the first affiliate link.

Never claim Ollie used a product unless that is true.

## 6. How to preview locally

Because this is static HTML, open `index.html` in a browser or run a simple local server from the site folder:

`python3 -m http.server 8080`

Then open:

`http://localhost:8080/`

## 7. How to run the build

There is no build step. This is a static site.

Production files are the files in this folder.

## 8. How to deploy through GitHub and Netlify

1. Make edits locally.
2. Commit changes in GitHub Desktop or Git.
3. Push to GitHub.
4. Netlify redeploys from the GitHub repo if the site is connected.

For this branch, review the changes first before merging or publishing.

## 9. Files that must never contain passwords or API keys

Never put passwords, API keys, Netlify tokens, email passwords or private credentials in:

- `index.html`
- any file inside `blog/`
- `script.js`
- `styles.css`
- `variants.css`
- `README.md`
- `BLOG-INSTRUCTIONS.md`
- any public file in this repo
