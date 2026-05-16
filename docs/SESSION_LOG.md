# Session Log

## 2026-05-11 (continued)

### Clean Runtime Phase 2A: src/pfra/app.mjs shadow scoring

- Added standards loading (`loadPfraStandards`, three altitude tables) to `src/pfra/app.mjs` on init.
- Added `computeScoreFromState(state)` pure function: calls `scorePfraAssessment` with altitude-adjusted cardio (run/HAMR/walk), identical logic to `pfra-calculator.js` but owned by `app.mjs`.
- Added `getScoreResult()` (score from current internal state), `refreshScoreFromDom()` (refresh state + score), `isReady()`, `getLoadError()`.
- Exposed all through `window.afptApp` — no DOM rendering, `main2.js` and `pfra-calculator.js` untouched.
- Updated `assertAppMjsFoundation(page)` with Phase 2A checks: `isReady()` becomes true; shadow total matches visible PFRA total; WHtR DOM change updates shadow body score; altitude Group 4 (via dispatch) changes shadow run score; dispatch+getScoreResult changes body score without touching DOM; visible score unchanged throughout.
- `npm test` passed: 131 scoring fixtures, 89 cached files, 28 required offline assets, all browser regressions.
- Committed and pushed.

### Clean Runtime Phase 1: src/pfra/app.mjs passive state observer

- Created `src/pfra/app.mjs`: passive state observer exposing `window.afptApp = { getState, refreshStateFromDom, dispatch }`.
  - `refreshStateFromDom()` reads all PFRA state from DOM: sex, ageGroup, whtr, altitudeGroup, strength/core/cardio event+value+exempt, selectedComponent.
  - `dispatch(action)` updates internal state only — no DOM mutations, no rendering.
  - `getState()` returns a shallow copy of the current state.
  - Loaded as a passive parallel path; `main2.js` and `pfra-calculator.js` continue to run unmodified.
- Added `<script type="module" src="./src/pfra/app.mjs?v=20260511-app-mjs">` to `index.html` after existing module scripts.
- Added `assertAppMjsFoundation(page)` to `tools/browser-regression.mjs`: verifies `window.afptApp` API exists, initial state reads correctly from DOM (sex=female, ageGroup=under-25, altitudeGroup=0, cardio.event=two-mile-run), `refreshStateFromDom` picks up `#alt-select` DOM change, `dispatch` mutates internal state without touching DOM.
- `npm test` passed: 131 scoring fixtures, 89 cached files, 28 required offline assets, all browser regressions.
- Committed and pushed.

## 2026-05-11

### Altitude Adjustment Phase A (UI Wiring): Wire #alt-select into PFRA Scoring

- Added `altitudeSelect: byId('alt-select')` to `getPfraDom()` in `src/pfra/dom.mjs`.
- Added `altitudeTables = {}` module variable, `currentAltitudeGroup()` function, and `altitudeAdjustedCardioPerformance()` function to `pfra-calculator.js`. Adjustment logic: run subtracts correction seconds (lookup from altitude-run-2-mile.json), HAMR adds group shuttles, walk subtracts bonus seconds (sea-level-to-altitude max time delta) before passing to `scoreWalk`.
- Updated `updatePfraCalculator()` to compute `adjustedCardioPerformance` via altitude adjustment before calling `scorePfraAssessment`. Non-cardio components unaffected.
- Updated `loadTables()` in `pfra-calculator.js` to fetch altitude tables in parallel with PFRA standards: `altitude-run-2-mile.json`, `altitude-walk-2km-male.json`, `altitude-walk-2km-female.json`.
- Added `altitudeSelect?.addEventListener('change', updatePfraCalculator)` for instant PFRA recalc on altitude change.
- Fixed pre-existing bug: `main2.js` `altitudeSel.addEventListener('change', ...)` called `updateScoreMinMaxText()` unconditionally — crashes in PFRA+Walk mode because `scoreArrays.cardio.max` is undefined (legacy run array used, no `.max` property). Added `isPfraModeActive()` guard: legacy score UI update and `runSelChange` now skip in PFRA mode (PFRA handler covers it).
- Added `assertAltitudeAdjustment(page)` to `tools/browser-regression.mjs`: verifies Group 4 changes run score (1523s - 62s guaranteed improvement), body/strength unaffected, score reverts on restore, HAMR score valid at Group 4, walk score valid at Group 1.
- `npm test` passed: 131 scoring fixtures, 88 cached files, 28 required offline assets, all browser regressions.
- Committed and pushed.

### Component Editor Phase D: Move Core Controls into #core-editor

- Moved `.situp-txt` (containing `#sit-txt-p`), `#sit-sel-chart-section` (containing `#sit-sel`, `#sit-btn`, `#sit-txt`, `.plank-colon`, `#plankmintxt`), and `.sit-slide` (containing `#sit-slider`, `#sit-tick`) from stacked page flow into `#core-editor` in `index.html`.
- Added `component-editor__header` with `component-editor__title` "CORE" and `component-editor__pfra-score` span with `id="pfra-core-score"`. `#pfra-core-score` was already expected by `pfra-calculator.js` via `dom.mjs` — just needed to exist in the DOM.
- Removed old stacked core sections from the main page flow.
- Removed `.situp-txt,`, `.sit-sel-chart,`, `.sit-slide,` from the shared app-column CSS rule in `style.css`. Added `#core-editor` scoped overrides (border, color, button styles).
- Fixed Phase C artifact: removed erroneous `.sit-txt-p` from `#strength-editor .strength-txt-p, #strength-editor .sit-txt-p` rule (`.sit-txt-p` belongs in core).
- Updated `tools/browser-regression.mjs`:
  - Added `assertCoreEditor(page)`: switches to core, verifies `#pfra-core-score` visible, exercises Exempt → Situps → Plank → Situps sequence, checks score header mirrors total.
  - Chart shortcut test now switches to core before clicking `#sit-btn` (element is inside hidden panel until then).
  - Legacy sit interaction wrapped in `selectComponent('core')` + `waitForFunction` guard.
  - PFRA sit interaction wrapped similarly; after `fill('#sit-txt', '54')` explicitly dispatches `input` on the slider to reliably rebind the PFRA threshold tick (29 vs legacy 35) before clicking `#sit-tick`.
- `npm test` passed: 98 scoring fixtures, 84 cached files, 28 required offline assets, all browser regressions.
- Committed and pushed: `9128339`.

## 2026-05-10 (continued)

### Component Editor Architecture Phase B: activeComponentEditor Container

- Added `#active-component-editor` div with `data-active-component="strength"` to `index.html`, placed between `#component-summary-strip` and `#strength-card`.
- Added three empty editor panels: `#strength-editor` (visible by default), `#core-editor` (hidden), `#cardio-editor` (hidden). No controls moved yet.
- Extended `selectComponent()` in `src/ui/component-editor.mjs` to toggle the `hidden` attribute on the three editor panels so only the active component's panel is visible.
- Added CSS for `.active-component-editor` (shared app-column sizing) and `.component-editor` (token-based panel background/border); `.component-editor[hidden] { display: none }` ensures hidden panels are removed from layout.
- Added `assertActiveComponentEditor()` browser regression: verifies strength visible by default, all three click paths show correct editor, theme switch preserves visibility state.
- Added editor visibility fields (`strengthEditorVisible`, `coreEditorVisible`, `cardioEditorVisible`) to `componentEditorState()`.
- Added theme-switch preservation checks for editor visibility in `assertThemeFoundation`.
- `npm test` passed: 84 cached files, 28 required offline assets, all browser regressions.

### Settings Hub Placement Fix

- Root cause: `.info-section` has `transform: translateX(-50%)`, making it the CSS containing block for all `position: fixed` descendants — including `.settings-hub-panel`. The old `right: max(0px, calc((100vw - 400px) / 2))` was computed relative to the info-section's right edge, not the viewport, pushing the panel far left.
- Fix: `right: 0` places the panel flush to the info-section's right edge = exactly the app frame right edge on all viewport widths.
- Added `assertSettingsPanelAlignment()` browser regression verifying panel right edge is within 60px of the settings toggle right edge on desktop.

### Component Editor Architecture Phase A: componentSummaryStrip

- Created `docs/COMPONENT_EDITOR_ARCHITECTURE.md` defining the universal mock pattern (all five mocks share: 3-column summary strip + one active editor) and why the Phase 7A/7B stacked-card approach was wrong.
- Added `#component-summary-strip` with PUSH/CORE/RUN summary card buttons to `index.html`.
- Created `src/ui/component-editor.mjs` with `selectedComponent` state, `selectComponent()`, variant class switching, `afpt:themechange` listener, `afpt:componentchange` event dispatch, and `window.afptComponentEditor` API.
- Added `componentSummaryStrip`, `componentSummaryCard`, `activeComponentEditor` slots to `LAYOUT_SLOTS` in `layout-variants.mjs`; added 10 new variants; updated all 5 theme presets.
- `npm test` passed.

## 2026-05-10

### Phase 7 Visual Realignment — Part 3: App-Frame Width Contract

**Problem:** The previous 368px fix matched the wrong anchor. The top bar, generic sections, and score header each had different hardcoded max-widths (400px, 400px, 368px), none centered consistently, and all too narrow for desktop.

**Decision:** Use `--afpt-app-max-width: 640px` as the single app-frame width. `--afpt-card-max-width` aliases it so changing one variable changes the whole column.

**Changes:**
- Added `--afpt-app-max-width: 640px` to `:root`. Changed `--afpt-card-max-width` from hardcoded `368px` to `var(--afpt-app-max-width)`.
- `section { max-width }` updated from `400px` to `var(--afpt-app-max-width)`.
- `.info-section-wrapper { max-width }` updated from `400px` to `var(--afpt-app-max-width)`.
- `.info-section { max-width }` updated from `400px` to `var(--afpt-app-max-width)`. Added `left: 50%; transform: translateX(-50%)` to center the fixed top bar on desktop (works correctly on mobile too).
- Score header, demographics, all cards already used `var(--afpt-card-max-width)` — they inherit 640px automatically.
- `assertDesktopCardAlignment()` extended to also check `.info-section` width is within 40px of `#score-header`.
- `npm test` passed.

### Phase 7 Visual Realignment — Part 2: Desktop Layout Geometry Fix

**Problem identified:** After the token-color realignment, mobile looked correct but on desktop the strength card and PFRA panel stretched to 100% body width while the score header and demographic controls were constrained to `max-width: 368px`. This made the layout look inconsistent rather than like a unified column.

**Root cause:** The score header and demographics had `max-width: 368px; margin: 0 auto;` but `#strength-card`, `.pfra-panel`, `.runlaps-row`, and the legacy situp/run sections had no max-width constraint.

**Decision:** Option A — match all primary card/section elements to the score header's existing 368px constraint. Option B (wider desktop column) is documented as the intended future direction; the 368px value is now expressed as `--afpt-card-max-width` so it can be widened in a single change later.

**Changes:**
- Added `--afpt-card-max-width: 368px` to `:root` as a shared layout token.
- Updated `.score-header` and `.sex-age-sel-section` to use `var(--afpt-card-max-width)` instead of the hardcoded value.
- Added a shared app-column rule applying `max-width: var(--afpt-card-max-width); width: calc(100% - 1rem); margin-inline: auto;` to `#strength-card`, `.situp-txt`, `.sit-sel-chart`, `.sit-slide`, `.run-txt`, `.cardio-sel-chart`, `.run-slider-section`, `.runlaps-row`, and `.pfra-panel`.
- Added `assertDesktopCardAlignment(page)` to `tools/browser-regression.mjs`: on the desktop pass it measures rendered widths of `#score-header` and `#strength-card` and asserts they are within 40px of each other.
- `npm test` passed.

## 2026-05-09

### Context

The user requested autonomous migration mode for this repo. The app is not production-live and does not have a purchased custom domain yet. The goal is functional correctness and modernization, not deployment to a custom domain.

### Starting State

- Recent offline PWA modernization was already pushed.
- Local uncommitted hardening work existed for:
  - stable slider tick click handlers,
  - PFRA run text input synchronization,
  - service-worker first-install reload behavior,
  - browser regression tests,
  - Playwright Core dev dependency.
- `npm test` passed before the autonomous migration docs were added.
- `npm audit` reported 0 vulnerabilities before this migration pass.

### Migration Direction

Use this architecture target:

```text
standards data
-> pure scoring functions
-> app state
-> UI rendering
-> event bindings
```

### Stop Conditions

Stop only if scoring rules are ambiguous, source standards conflict, the app cannot run, a major feature would be removed, or a framework/TypeScript/major dependency is required.

### Phase 1 Checkpoint

- Added `src/pfra/scoring.mjs` for DOM-free PFRA scoring.
- Added `src/pfra/standards.mjs` for PFRA standards/table loading.
- Updated `pfra-calculator.js` to use the shared scoring and standards modules.
- Updated PFRA validation tests to exercise WHtR, 2 km walk, full assessment scoring, and table scoring through shared functions.
- Updated Workbox/PWA validation so the new modules are cached offline.
- `npm test` passed after this phase.

### Phase 2 Checkpoint

- Added `src/pfra/dom.mjs` for PFRA/legacy DOM lookup.
- Added `src/pfra/state.mjs` for PFRA defaults, labels, and legacy-to-PFRA event mapping.
- Added `src/pfra/ui.mjs` for PFRA rendering helpers, lap text, slider states, and threshold tick positioning.
- Kept `pfra-calculator.js` as the adapter that coordinates the existing UI with the new modules.
- `npm test` passed after this phase.

### Phase 3 And 4 Notes

- Added a formal `window.afptLegacy` boundary in `main2.js`.
- Updated PFRA integration to prefer `window.afptLegacy` for legacy score sync, age/sex reset, and tick binding.
- Added `docs/LEGACY_BOUNDARIES.md`.
- Added `docs/STATIC_HOSTING_CHECKLIST.md`.
- `workbox-config.js` now includes `src/pfra/*.mjs`; PWA validation checks the PFRA modules are precached.

### Phase 5 Notes

- Removed stale end-of-file comments from `main2.js`.
- Updated README, standards docs, project overview, and test plan to match the migrated PFRA module structure.
- Final verification completed:
  - `npm test` passed.
  - `npm audit` reported 0 vulnerabilities.
  - `git diff --check` passed.
  - Syntax checks passed for `main2.js`, `pfra-calculator.js`, `pwa.js`, `tools/browser-regression.mjs`, and all `src/pfra/*.mjs` modules.

### GitHub Pages Deployment Verification

- Verified live site URL: `https://james-craven.github.io/AFPT/`.
- Public GitHub Pages API endpoints returned 404 without authentication, so deployment status was verified from the live Pages site instead.
- Live Pages response returned HTTP 200 with a `Last-Modified` timestamp after the push to `master`.
- Confirmed deployed `pfra-calculator.js`, `src/pfra/scoring.mjs`, and `sw.js` include the migrated PFRA module structure.
- Confirmed all 75 service-worker precache URLs return successful responses from GitHub Pages.
- Browser verification on the live site passed with no console/runtime errors.
- Confirmed Legacy mode loads and shows the expected default run score text.
- Confirmed PFRA mode loads, updates cardio labels, shows the 2-mile run score text, and renders 8 lap times.
- Confirmed a validated PFRA max-score example returns `PFRA Total: 100.0 - Excellent`.
- Confirmed live PWA/offline behavior in a persistent Chrome profile: service worker activated for scope `https://james-craven.github.io/AFPT/`, the page reloaded offline, PFRA standards loaded offline, and PFRA run scoring text rendered offline.

### PFRA Scoring Verification Expansion

- Reviewed the previous 16 PFRA checks: 10 direct event-table examples, 3 WHtR examples, 2 walk-threshold examples, and 1 full-assessment max example.
- Added `tools/fixtures/pfra-scoring-examples.json` as the clear fixture source for scoring examples.
- Expanded automated scoring coverage to 98 examples:
  - 75 direct table examples across strength, core, run, plank, and HAMR events.
  - 8 WHtR examples.
  - 10 two-kilometer walk pass/fail threshold examples.
  - 5 full-assessment examples.
- Added max, minimum, failing, midpoint, and immediate threshold-boundary examples across male/female and young/middle/older age groups.
- Preserved the known current examples in the fixture with `previous-*` ids.
- Source-table ambiguity: `standards/af-pfra-2026.json` still reports `source-mapped-incomplete`, while the generated event-table files are marked `needsReview:false`; final production confidence should include continued PDF spot checks or an independent row-by-row audit.

### UI Redesign Planning

- Entered planning-only mode for the Claude-inspired visual redesign.
- Confirmed the current app remains the source of truth for behavior, scoring, standards data, PWA/offline behavior, and deployment.
- Inspected the production app shell, legacy/PFRA bridge, PFRA UI/state helpers, browser tests, PWA docs, and uploaded mock files.
- Added planning contract docs:
  - `docs/UI_REDESIGN_PLAN.md`
  - `docs/FEATURE_PARITY_MATRIX.md`
  - `docs/MOCK_IMPLEMENTATION_MAP.md`
  - `docs/UI_TEST_PLAN.md`
- Documented that the uploaded mock HTML references `mocks/mock-tactical.jsx`, `mocks/mock-stencil.jsx`, `mocks/mock-blues.jsx`, `mocks/mock-light.jsx`, and `mocks/mock-fitness.jsx`, but those files were not present in Downloads.
- Captured visual-only/demo-only mock pieces that should not be copied into production: React/CDN runtime, Babel-in-browser, design canvas, device frames, frame toggle, mock seed scoring data, and generated stub chart rows.

### UI Redesign Mock Completion

- Reviewed the newly provided concrete mock layouts:
  - `/Users/jamescraven/Downloads/mock-tactical.jsx`
  - `/Users/jamescraven/Downloads/mock-stencil.jsx`
  - `/Users/jamescraven/Downloads/mock-blues.jsx`
  - `/Users/jamescraven/Downloads/mock-light.jsx`
  - `/Users/jamescraven/Downloads/mock-fitness.jsx`
- Removed the planning caveat about missing `mocks/mock-*.jsx` files.
- Updated the mock implementation map with per-layout takeaways.
- Recommended a Tactical/Connect hybrid as the first production direction: Tactical information density with the quieter Connect Light visual finish.
- Initially constrained theme switching to visual styling only; this was superseded by the later layout variant planning section.

### UI Layout Variant Planning

- Updated the UI redesign strategy from a single themeable layout to a modular layout variant system.
- Clarified that all five Claude visual directions should become user-selectable theme presets, not isolated hardcoded calculators.
- Added `docs/LAYOUT_VARIANT_SYSTEM.md` to define layout slots, variant rules, theme presets, and future user overrides.
- Added `docs/THEME_PARITY_MATRIX.md` to track required cross-theme feature parity.
- Added `docs/UI_IMPLEMENTATION_PHASES.md` to sequence the shared render contract, registries, presets, dev variant picker, persistence, and public customization UI.
- Updated the redesign plan, mock map, feature parity matrix, UI test plan, and TODO to reflect this rule: a theme preset chooses variants, a user customization overrides variants, and neither themes nor variants own scoring logic.

### UI Variant Foundation

- Added `src/ui/layout-variants.mjs` with layout slots, five theme presets, placeholder/default variants, and preset validation helpers.
- Added `src/ui/theme-controller.mjs` to apply the active preset using `data-theme` and `data-theme-preset` attributes on `html` and `body`.
- Added `#theme-preset-select` to the existing hamburger menu as a safe preset selector without replacing the current menu or calculator layout.
- Added CSS token definitions for the five presets while keeping the current layout and calculator controls intact.
- Updated Workbox and PWA cache validation so the new UI modules are available offline.
- Updated browser regression coverage to verify default theme load, preset registry validity, slot-compatible variants, preset persistence, and score/slider invariance after theme switching.

### Settings Hub Foundation

- Replaced the visible hamburger checkbox pattern with a shared settings/control hub in the fixed header.
- Preserved existing menu function IDs for run altitude, walk/shuttle altitude, shuttle score card, shuttle audio, and install behavior so current `main2.js` handlers remain authoritative.
- Moved the Phase 1 theme preset selector into the settings hub.
- Added settings access for build info and a manual PWA update check without changing service-worker update modal behavior.
- Added `src/ui/settings-hub.mjs` for open/close, overlay, Escape key, keyboard activation, and action-close behavior.
- Updated browser regression coverage for settings touch target size, open/close behavior, score/slider invariance, run altitude chart access, shuttle audio access, install control, PWA update control/API, and build-info control.

### Score Header Foundation

- Added `src/ui/score-header.mjs` as the first real visual slot renderer.
- The score header observes and mirrors `#score-txt`, which remains owned by `main2.js` and `src/pfra/ui.mjs`; no scoring rules or standards modules were changed.
- Added score header markup in `index.html` and visually retained `#score-txt` as the hidden source-of-truth output for legacy/PFRA renderers.
- Added foundation styles for the registered `scoreHeader` variants: `light-card`, `tactical-score-number`, `stencil-score-block`, `blues-ring`, and `fitness-gradient-ring`.
- Updated browser regression coverage so Legacy and PFRA score headers must mirror the real score source, and theme switching must change the score header variant without changing score value or status.

### Header Demographics Controls

- Moved the real `#sex-sel`, `#age-sel`, and `#standards-mode` controls into the score/header area instead of creating mirrored controls.
- Kept existing IDs and event bindings so `main2.js`, `pfra-calculator.js`, and `src/pfra/dom.mjs` remain authoritative for behavior.
- Added compact header-control styling for the three controls while keeping them visible and usable on mobile.
- Updated browser regression coverage for desktop/mobile visibility, sex/age range updates, Legacy/PFRA switching, score-header mirroring after control changes, and theme switching preserving selected sex/age/mode.

### Lap Display Foundation

- Added `src/ui/lap-display.mjs` for the `lapDisplay` slot.
- Kept legacy `changeLapTime` and PFRA `renderPfraLapTimes` as the only lap calculation/rendering sources.
- Visually hid `#run-lap-times` as the source-of-truth text and rendered `#lap-display` from that already-rendered output.
- Added foundation renderers for `light-rows`, `tactical-horizontal-bars`, `stencil-vertical-bars`, `fitness-tiles`, and `blues-table`.
- Exposed a temporary dev-friendly `window.afptLapDisplay` variant override API without adding public customization UI.
- Updated browser regression coverage so Legacy 6-lap and PFRA 8-lap values must remain intact while theme switching changes lap presentation only.

### Strength Card Foundation (Phase 7B)

- Created `src/ui/strength-card.mjs` for the `strengthCard` slot.
- Wrapped the real legacy strength sections (`.strength-txt`, `.push-sel-chart`, `.push-slide` — containing `#push-sel`, `#push-txt`, `#push-slider`, `#push-tick`, `#push-btn`) in a `#strength-card` wrapper. All existing IDs, class names, and event bindings remain unchanged.
- Added a card header with title and `#pfra-strength-score` display; the score is hidden in legacy mode via `body:not(.pfra-mode) .strength-card__score { display: none }`.
- Removed `#pfra-strength-score` from `.pfra-score-grid` (now lives in the strength card header).
- `main2.js` and `pfra-calculator.js` remain authoritative for all scoring and event handling.
- Added foundation variant styles for all five registered variants.
- Added browser regression coverage: strength card variant applied, PFRA score visible in PFRA mode, exemption sets score to EXEMPT, event switch updates score text, score header mirrors total, theme switch preserves event/value/variant and changes card presentation.
- Updated `docs/FEATURE_PARITY_MATRIX.md`, `docs/THEME_PARITY_MATRIX.md`, `docs/UI_TEST_PLAN.md`, `docs/TODO.md`.
- `npm test` passed: 83 cached files, 28 required offline assets, all browser regressions.

### Body Composition Card Foundation (Phase 7A)

- Created `src/ui/body-composition-card.mjs` for the `bodyCompositionCard` slot.
- Moved the real `#pfra-whtr` input and `#pfra-body-score` output from the raw `.pfra-fields`/`.pfra-score-grid` markup into a `#body-composition-card` wrapper element inside `#pfra-panel`.
- Existing IDs and event bindings preserved; `pfra-calculator.js` and `src/pfra/scoring.mjs` remain authoritative for all scoring behavior.
- Added foundation variant styles for `light-clean`, `tactical-dense`, `stencil-clipped`, `blues-polished`, and `fitness-gradient-card`. All five variants share the same markup; variants differ through CSS class modifiers.
- The card is visible only in PFRA mode, inheriting the existing `body:not(.pfra-mode) .pfra-panel { display: none }` rule.
- Added browser regression coverage: card visible in PFRA, hidden in legacy, WHtR change updates body score and total score header mirrors it, theme switching preserves WHtR value and body score, theme switch applies the correct preset variant and changes card presentation.
- Updated `docs/FEATURE_PARITY_MATRIX.md`, `docs/THEME_PARITY_MATRIX.md`, `docs/UI_TEST_PLAN.md`, `docs/TODO.md`.
- `npm test` passed: 82 cached files, 28 required offline assets, all browser regressions.

### Chart Drawer Foundation

- Added `src/ui/chart-drawer.mjs` for the `chartDisplay` slot.
- Reused the existing `#modal` and `#modal-img` IDs so current chart click handlers keep choosing chart image sources.
- Replaced the visual full-screen chart modal with a drawer-style shell, scrim, close button, Escape close behavior, and active chart variant classes.
- Added foundation styling hooks for `light-chart-drawer`, `tactical-drawer`, `stencil-drawer`, `blues-chart-drawer`, and `fitness-glass-chart`.
- Kept chart data as the existing image assets; no chart images were converted to structured tables.
- Updated browser regression coverage for run altitude, walk/shuttle altitude, shuttle score, strength, core, and cardio chart shortcuts plus close-by-button, close-by-Escape, and close-by-scrim behavior.

## Component Editor Phase C — Strength controls into #strength-editor

- Moved all real strength controls (`.strength-txt`, `.push-sel-chart`, `.push-slide` with `#push-sel`, `#push-txt`, `#push-slider`, `#push-tick`, `#push-btn`, `#push-txt-p`, `.hrpush-txt`) out of the old `#strength-card` wrapper and into `#strength-editor`.
- Added a `.component-editor__header` header row inside `#strength-editor` with `component-editor__title` ("PUSH") and `component-editor__pfra-score` (`#pfra-strength-score`).
- Removed the entire `#strength-card` div from `index.html`.
- Removed the `strength-card.mjs` script tag from `index.html` (file retained on disk for service-worker cache count stability).
- Removed `#strength-card` from the shared app-column sizing rule in `style.css` (`.active-component-editor` already carries app-column sizing from Phase B).
- Added `.component-editor__header`, `.component-editor__title`, `.component-editor__pfra-score` CSS with token-based values.
- Added `body:not(.pfra-mode) .component-editor__pfra-score { display: none }` to preserve PFRA-mode-only score display.
- Updated token-scoped overrides from `#strength-card .strength-txt` etc. to `#strength-editor .strength-txt` etc.; kept `.strength-card` variant CSS in style.css (slot still registered).
- Updated `browser-regression.mjs`: `strengthCardState()` now reads from `#strength-editor`; `assertStrengthCard()` targets `#strength-editor` and `.component-editor__pfra-score`; `assertThemeFoundation()` removes strength card variant assertions; `assertDesktopCardAlignment()` uses `#active-component-editor`.
- All tests pass: 98 PFRA fixtures, SW build (84 files), PWA cache (28 required assets), browser regressions.

## Handoff checkpoint — end of Phase C session

**Repo state:** master is clean at commit `7d19189`.

**What exists now:**
- `#component-summary-strip` — three-button selector strip (PUSH / CORE / RUN) with theme variant wiring.
- `#active-component-editor` — container with `#strength-editor`, `#core-editor`, `#cardio-editor`. Panel switching via `selectComponent()` in `src/ui/component-editor.mjs`.
- `#strength-editor` — contains all real strength controls (`.strength-txt`, `.push-sel-chart`, `.push-slide`). `#pfra-strength-score` lives here. Old `#strength-card` is gone.
- Core and Cardio are still in their old stacked sections below `#active-component-editor`. `#core-editor` and `#cardio-editor` are empty.

**Next task:** Phase D — move Core controls into `#core-editor`. See `CLAUDE.md` → "Current Next Phase" and `docs/NEXT_SESSION_PROMPT.md` for the exact continuation prompt.

**Tests:** 98 PFRA fixtures, SW build (84 files), PWA cache (28 required assets), browser regressions — all pass.

## Pacer Audio Cue Experiment

- Created rollback tag `pre-pacer-audio-37800c4` before implementation.
- Added optional pace-plan audio cues that are off by default and use the existing 3200m / 8-lap visual pacer timing.
- Added inline pace-plan controls for cue style, course mode, cue frequency, out/back segment preset, and a test cue.
- Added generated beep support, optional speech synthesis, missed-cue coalescing, and graceful screen wake-lock handling.
- Added pure cue-schedule tests and browser coverage for defaults, persistence, score safety, test cue stubbing, wake-lock request, and audio controller state.
- Added TODO to later experiment with replacing inline controls with a compact pace-plan settings icon/modal.

## Pacer Audio Hardening and Launch Planning

- Added cue intensity (`normal`, `loud`, `max`) with louder multi-beep patterns to make cues more noticeable over music.
- Added optional vibration/haptics for browsers/devices that support `navigator.vibrate`.
- Added inline user guidance to keep the screen awake and test volume with headphones or music before running.
- Added `docs/MARKETING_LEGAL_LAUNCH_PLAN.md` covering positioning, user education, distribution, privacy/terms/disclaimer needs, and launch assets.

## Pacer Audio PWA Priming

- Updated guidance after on-device testing showed installed Home Screen PWA cues can duck Spotify on at least one iPhone setup.
- Added audio priming on pacer start: the goal-time tap now unlocks audio, requests transient audio-session behavior when available, plays a start/arming cue, and keeps the audio context warm while the pacer is running.
- Added a short delay after Test Cue audio unlock to improve first-tap reliability on installed PWAs.
- Updated browser coverage for the start arming cue, audio-session hint, keepalive lifecycle, and revised Home Screen guidance.
