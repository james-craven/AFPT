# Static Hosting And PWA Checklist

## GitHub Pages Constraints

- Keep all runtime assets relative to `index.html`.
- Do not require a server process, API route, database, or build step at runtime.
- Keep `sw.js` checked in because GitHub Pages serves static files only.
- Keep new browser modules under paths included by `workbox-config.js`.
- Do not rely on custom-domain configuration during local development.

## Current Runtime Entry Points

- `index.html`
- `main2.js`
- `pfra-calculator.js`
- `src/pfra/*.mjs`
- `pwa.js`
- `sw.js`

## Verification Commands

```sh
npm test
npm audit
git diff --check
```

`npm test` must rebuild `sw.js` and confirm required offline assets are included. The browser regression suite must continue passing with desktop, mobile, and offline reload checks.

## Local Service Worker Behavior

- `http://127.0.0.1:4173/?no-sw=1` is the normal development path.
- `http://127.0.0.1:4173/?sw=1` tests production service-worker behavior locally.
- Localhost unregisters stale service workers by default unless `?sw=1` is present.

