# UI Test Plan

## Goal

Prove the redesigned UI preserves existing calculator behavior while changing visual structure.

## Required Command

Run after each major redesign phase:

```sh
npm test
```

This currently validates:

- PFRA scoring fixtures.
- Service-worker cache output.
- Required offline assets.
- Legacy calculator browser behavior.
- PFRA calculator browser behavior.
- Mobile viewport behavior.
- Offline reload behavior.

## Tests To Preserve

Existing browser tests in `tools/browser-regression.mjs` must continue to cover:

- Settings/control hub hit area, open/close behavior, and score-state invariance.
- Settings/control hub reference controls for run altitude chart, shuttle audio, install, PWA update, and build info access.
- Score header appears in Legacy and PFRA modes, mirrors the real `#score-txt` value/status, and changes presentation on theme switch without changing score state.
- Header sex, age, and standards controls are visible on desktop/mobile, drive the existing real controls, and survive theme switching.
- Theme foundation loads the default preset and resolves every registered preset with slot-compatible variants.
- Theme switching preserves current score text and slider value.
- Legacy default run score.
- Legacy minimum tick click behavior.
- Legacy shuttle and run switching.
- Legacy 6-lap timing.
- PFRA mode option labels.
- PFRA strength/core/cardio score labels.
- PFRA slider ranges and min ticks.
- PFRA run text entry and slider sync.
- PFRA age changes preserving edited run values.
- PFRA -> legacy mode switching.
- Offline reload with standards loaded.

## Tests To Add During Redesign

Add or update browser checks as rows become implemented in `docs/FEATURE_PARITY_MATRIX.md`:

- Settings drawer opens and closes.
- Settings drawer exposes install/update/audio/dev-build controls or intentionally deferred replacements.
- Body composition card updates WHtR score in PFRA mode.
- Strength card event, input, slider, min tick, chart button, and exemption all work.
- Core card event, input, plank time, slider, min tick, chart button, and exemption all work.
- Cardio card run, HAMR, walk, time inputs, slider, lap display, chart button, altitude selector, and exemption all work.
- Chart drawer opens from each component and can close by button and scrim.
- Theme preset switching preserves selected sex, age, standard, events, values, exemptions, total score, and component scores.
- Every theme preset exposes the same required calculator features listed in `docs/THEME_PARITY_MATRIX.md`.
- Individual layout variant switching, once added, changes only the selected slot renderer and does not alter scoring.
- Variant changes do not hide required controls for the affected slot.
- Text does not overflow compact controls at mobile width.
- Touch targets for buttons, sliders, and drawer controls are large enough to use on phone.
- The Tactical and Connect/Light presets keep demographics, standards, score, and primary component controls visible without requiring a settings drawer.

## Manual Checks

Before declaring UI parity:

- Open local dev with `?no-sw=1` and inspect desktop plus a phone-width viewport.
- Open local service-worker mode with `?sw=1`, reload once, then verify offline behavior.
- Confirm all chart images still load.
- Confirm shuttle audio still loads and plays when permitted by the browser.
- Confirm install/update modals are not visually trapped behind redesigned drawers.
- Confirm the app can be refreshed on GitHub Pages without broken relative paths.

## Definition Of Done For Redesign

- Every row in `docs/FEATURE_PARITY_MATRIX.md` is `Implemented`, `Deferred by explicit decision`, or `Not Applicable`.
- Each implemented row has an automated or manual verification method.
- `npm test` passes.
- No UI implementation depends on React, Babel, CDN runtime scripts, or mock seed data.
- Theme switching resolves registered slot variants rather than instantiating separate calculator implementations.
- Variants receive shared state and dispatch shared actions.
- PWA/offline behavior still works.
