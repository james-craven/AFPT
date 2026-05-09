# Legacy Boundaries

`main2.js` remains the legacy calculator owner during this migration. It still owns legacy scoring tables, legacy slider/textbox behavior, chart modal wiring, install prompts, and the original total score rendering.

## Stable Legacy Boundary

`main2.js` now exposes a small `window.afptLegacy` API:

- `ageSexChange`
- `bindSliderTickClick`
- `changeLapTime`
- `changeTxtboxes`
- `runSelChange`
- `updateScoreMinMaxText`

PFRA integration should prefer this boundary instead of reaching directly for legacy global functions. The old globals still exist because `main2.js` is a classic script, but new code should avoid depending on that accident of script loading.

## PFRA-Owned Code

PFRA modernization code now lives in:

- `src/pfra/scoring.mjs`
- `src/pfra/standards.mjs`
- `src/pfra/dom.mjs`
- `src/pfra/state.mjs`
- `src/pfra/ui.mjs`
- `pfra-calculator.js`

`pfra-calculator.js` is an adapter between the current UI and the PFRA modules. It should keep shrinking over time as state and event binding become more explicit.

## Later Removal Candidates

These should not be removed until legacy standards are versioned and covered by tests:

- Embedded legacy score tables in `main2.js`
- Legacy 1.5-mile run, walk, HAMR, strength, and core scoring functions
- Legacy chart image routing
- Direct legacy textbox/slider conversion helpers
- Legacy global function exposure

## Containment Rule

When adding PFRA behavior, put new scoring or standards logic in `src/pfra/` first. Use `main2.js` only when maintaining existing legacy UI behavior or bridging the current controls.

