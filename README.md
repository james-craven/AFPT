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

- PFRA 2026 standards metadata lives in `standards/af-pfra-2026.json`.
- PFRA scoring tables live in `standards/extracted/tables/`.
- PFRA scoring and standards loading are split into vanilla ES modules under `src/pfra/`.
- UI theme preset and layout variant foundations live under `src/ui/`.
- The visible settings/control hub lives in `src/ui/settings-hub.mjs`; existing calculator scoring remains outside the UI theme layer.
- The score header renderer lives in `src/ui/score-header.mjs` and mirrors existing score output rather than recalculating scores.
- The lap display renderer lives in `src/ui/lap-display.mjs` and mirrors existing lap output rather than recalculating lap times.
- Legacy scoring standards are still embedded in `main2.js` and are documented in `docs/LEGACY_BOUNDARIES.md`.
- Chart references are currently stored as image assets in `web formatted jpgs/`.
- A future standards update system should keep the review/confirm workflow before accepting PDF/image imports.
- The app is designed to stay static-hostable, low-cost, installable, and ad-free.

## Migration docs

- `AGENTS.md`
- `docs/PROJECT_OVERVIEW.md`
- `docs/ARCHITECTURE_TARGET.md`
- `docs/REFACTOR_PLAN.md`
- `docs/LEGACY_BOUNDARIES.md`
- `docs/STATIC_HOSTING_CHECKLIST.md`
- `docs/TEST_PLAN.md`
- `docs/LAYOUT_VARIANT_SYSTEM.md`
- `docs/THEME_PARITY_MATRIX.md`
- `docs/UI_IMPLEMENTATION_PHASES.md`
- `docs/TODO.md`
- `docs/SESSION_LOG.md`
