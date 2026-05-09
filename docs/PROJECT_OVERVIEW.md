# Project Overview

AFPTCalc is a static, mobile-first USAF fitness calculator built with HTML, CSS, and vanilla JavaScript. It is intended to be hosted on GitHub Pages, installed as a PWA, and usable offline after a successful first load.

## Current User Goals

- Keep the app low-cost and ad-free.
- Make the calculator usable on phones and accessible from the web.
- Preserve offline access for users with limited connectivity.
- Modernize PFRA 2026 standards so future updates are easier.
- Keep legacy standards available during the migration.

## Current Runtime Shape

- `index.html` provides the full app shell.
- `style.css` owns the existing visual structure.
- `main2.js` contains the legacy calculator, global state, DOM wiring, score text rendering, chart selection, and much of the slider behavior.
- `pfra-calculator.js` adapts the existing UI to PFRA 2026 scoring.
- `pwa.js` controls service-worker registration, local development behavior, and update prompts.
- `sw.js` is generated and checked in for GitHub Pages.
- `standards/af-pfra-2026.json` describes the PFRA source package and points to extracted tables.
- `standards/extracted/tables/*.json` contains generated PFRA scoring tables.

## Current Strengths

- Static hosting remains simple.
- Offline-first PWA path exists and is test-covered.
- PFRA 2026 tables are structured as JSON.
- Browser regression tests now cover key legacy, PFRA, mobile, and offline flows.

## Current Risks

- Legacy scoring and UI updates are tightly coupled in `main2.js`.
- PFRA UI integration still adapts through legacy DOM controls instead of a dedicated app state layer.
- Some legacy standards remain embedded in code rather than versioned data.
- The app relies on global functions and shared mutable DOM state.
- Source PDF/import automation is not implemented yet and should not bypass human review.

