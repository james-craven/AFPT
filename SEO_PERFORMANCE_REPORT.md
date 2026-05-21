# SEO and Performance Report

## Audit Summary

- Project type: static vanilla JavaScript PWA.
- Build/runtime: root `index.html`, `style.css`, ES modules under `src/`, Workbox-generated `sw.js`, deployed with Vercel.
- Main page: `index.html`.
- Secondary HTML: `nocache.html` is a legacy/no-cache helper and is marked `noindex`.
- Production URL: `https://pfra.app/`.
- Metadata files: `manifest.webmanifest`, `robots.txt`, `sitemap.xml`, `vercel.json`.

## Baseline Issues Found

- Local Lighthouse before this pass:
  - Performance: 69
  - Accessibility: 95
  - Best Practices: 100
  - SEO: 100
  - LCP: 6.0 s
  - CLS: 0.147
  - TBT: 0 ms
- Accessibility gaps:
  - Missing `main` landmark.
  - Blues theme unsatisfactory score badge contrast was slightly below 4.5:1.
- Performance gaps:
  - Pace plan content was injected after initial HTML, causing layout shift.
  - `pwa.js` was loaded as a normal script.
  - Lighthouse still reports unminified/unused CSS and JavaScript. Fixing this well would require a larger production build/minification strategy.
  - Local Python server does not provide production cache/compression headers, so local cache findings are conservative.

## Files Changed

- `index.html`
- `style.css`
- `src/pfra/app.mjs`
- `sw.js`
- `SEO_PERFORMANCE_REPORT.md`

## SEO Improvements Made

- Preserved the `https://pfra.app/` canonical URL, production title, meta description, Open Graph tags, Twitter card tags, and WebApplication JSON-LD.
- Added FAQPage JSON-LD that matches the visible "Common questions" content on the page.
- Converted the app shell to a semantic `main` landmark.
- Promoted the visible app name to the page `h1` and changed the desktop intro heading to `h2`, preserving visual styling while improving heading hierarchy.
- Confirmed `robots.txt` points crawlers to `https://pfra.app/sitemap.xml`.
- Confirmed `sitemap.xml` lists the canonical home page.

## Performance Improvements Made

- Added `defer` to `pwa.js` so the PWA helper does not block parsing.
- Reserved the empty pace-plan slot before JavaScript renders the plan, reducing Lighthouse CLS from `0.147` to `0`.
- Added lazy/async loading hints to official reference images rendered inside chart/reference drawers.
- Regenerated `sw.js` so the offline cache reflects the updated HTML, CSS, and app module revisions.

## Accessibility Improvements Made

- Added a `main` landmark.
- Adjusted blues-theme unsatisfactory score badge color just enough to pass Lighthouse contrast checks.
- Added `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, and `aria-valuetext` support to the score progress bar.
- Preserved existing labels and accessible names for calculator controls.

## Lighthouse Results

Local Lighthouse was run against `http://127.0.0.1:4181/` with Chrome headless.

| Metric | Before | After |
| --- | ---: | ---: |
| Performance | 69 | 74 |
| Accessibility | 95 | 100 |
| Best Practices | 100 | 100 |
| SEO | 100 | 100 |
| LCP | 6.0 s | 6.2 s |
| CLS | 0.147 | 0 |
| TBT | 0 ms | 0 ms |
| FCP | 2.6 s | 2.6 s |
| Speed Index | 2.6 s | 2.6 s |

Production Lighthouse was also run against `https://pfra.app/` after deployment:

| Metric | Production |
| --- | ---: |
| Performance | 98 |
| Accessibility | 100 |
| Best Practices | 100 |
| SEO | 100 |
| LCP | 1.9 s |
| CLS | 0 |
| TBT | 0 ms |
| FCP | 1.2 s |
| Speed Index | 3.7 s |

Performance still has room to improve, but the remaining Lighthouse warnings are mostly from raw, unbundled static assets:

- Minify CSS.
- Minify JavaScript.
- Reduce unused CSS/JavaScript.
- Improve static asset cache lifetimes.
- Reduce render-blocking CSS.

Those are best handled with a deliberate production asset pipeline, hashed filenames, and cache-safe deploy behavior. They were not added in this pass to avoid changing the app architecture or risking stale PWA assets.

## Remaining TODOs

- Add `https://pfra.app/` to Google Search Console.
- Submit `https://pfra.app/sitemap.xml` in Search Console.
- Run PageSpeed Insights against the deployed URL after Vercel finishes deploying this commit.
- Consider a future production build pipeline for minified/fingerprinted CSS and JavaScript if performance becomes the next priority.
- Consider field monitoring through Search Console Core Web Vitals before adding any analytics or tracking.

## Commands To Run

```bash
npm test
git diff --check
python3 -m http.server 4181
npx --yes lighthouse@latest http://127.0.0.1:4181/ --chrome-flags="--headless=new --no-sandbox" --output=html --output-path=./lighthouse-local.html
```

Production checks after deploy:

```bash
curl -I https://pfra.app/
curl -sS https://pfra.app/robots.txt
curl -sS https://pfra.app/sitemap.xml
npx --yes lighthouse@latest https://pfra.app/ --chrome-flags="--headless=new --no-sandbox" --output=html --output-path=./lighthouse-production.html
```

Reference guidance used:

- Google SEO Starter Guide: https://developers.google.com/search/docs/fundamentals/seo-starter-guide
- Google image SEO guidance: https://developers.google.com/search/docs/advanced/guidelines/google-images
- Google sitemap guidance: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- web.dev Core Web Vitals: https://web.dev/articles/vitals
- Chrome Lighthouse overview: https://developer.chrome.com/docs/lighthouse/overview
