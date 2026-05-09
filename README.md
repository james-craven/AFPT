# AFPTCalc

AFPTCalc is a static, mobile-first Air Force fitness score calculator. It is built with plain HTML, CSS, and JavaScript, and includes PWA/offline support through Workbox.

## Run locally

```sh
npm run dev
```

Then open:

```text
http://127.0.0.1:4173
```

Local development unregisters service workers by default so stale caches do not hide changes. To test the production service worker locally, first run:

```sh
npm run build
```

Then open:

```text
http://127.0.0.1:4173/?sw=1
```

## Service worker

The app is offline-first in production. The generated service worker is checked in as `sw.js` so GitHub Pages can serve it directly. Regenerate it with:

```sh
npm run build
```

The offline modernization plan lives in `docs/OFFLINE_FIRST_PLAN.md`.

## Current modernization notes

- Scoring standards are currently embedded in `main2.js`.
- Chart references are currently stored as image assets in `web formatted jpgs/`.
- A future standards update system should move scoring rules into versioned data files before adding PDF/image import.
- The app is designed to stay static-hostable, low-cost, installable, and ad-free.
