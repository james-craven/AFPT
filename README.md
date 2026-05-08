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

## Service worker

Service worker registration is temporarily disabled in `index.html` during active development so stale PWA caches do not hide changes while iterating.

The generated service worker is still checked in as `sw.js`. When PWA/offline behavior is re-enabled, regenerate it with:

```sh
npm run build:sw
```

## Current modernization notes

- Scoring standards are currently embedded in `main2.js`.
- Chart references are currently stored as image assets in `web formatted jpgs/`.
- A future standards update system should move scoring rules into versioned data files before adding PDF/image import.
- The app is designed to stay static-hostable, low-cost, installable, and ad-free.
