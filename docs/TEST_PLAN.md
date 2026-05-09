# Test Plan

## Required Commands

Run after each major implementation phase:

```sh
npm test
```

Run before final handoff:

```sh
npm audit
git diff --check
node -c main2.js
node -c pfra-calculator.js
node -c pwa.js
node -c src/pfra/dom.mjs
node -c src/pfra/scoring.mjs
node -c src/pfra/standards.mjs
node -c src/pfra/state.mjs
node -c src/pfra/ui.mjs
node -c tools/browser-regression.mjs
```

## Current Automated Coverage

`npm test` runs:

- `tools/validate-pfra-tables.mjs`
  - Validates representative PFRA table scores.
- `npm run build:sw`
  - Regenerates `sw.js`.
- `tools/validate-pwa-cache.mjs`
  - Verifies required offline assets are precached.
- `tools/browser-regression.mjs`
  - Runs Chrome regression checks for desktop and mobile viewports.
  - Checks legacy default scoring text.
  - Checks PFRA mode labels, slider ranges, text entry, age changes, and cardio switching.
  - Checks minimum tick click behavior.
  - Checks hamburger menu hit area.
  - Checks offline reload with the service worker.

## Manual Smoke Checks

- Open `http://127.0.0.1:4173/?no-sw=1` during local development.
- Switch between Legacy and PFRA 2026.
- Confirm PFRA run label says `2 Mile`, HAMR says `20m HAMR`, and lap text shows 8 laps.
- Confirm the app still loads when offline after priming with `?sw=1`.
