# TODO

## Active Migration Queue

- [x] Phase 0: Commit control docs and current verified hardening baseline.
- [x] Phase 1: Extract PFRA standards access into `src/pfra/standards.mjs`.
- [x] Phase 1: Extract pure PFRA scoring into `src/pfra/scoring.mjs`.
- [x] Phase 1: Update tests to use the shared PFRA scoring module.
- [x] Phase 2: Split PFRA DOM lookup, state sync, rendering, and events where practical.
- [x] Phase 3: Document legacy scoring boundaries and future removable code.
- [x] Phase 4: Verify service-worker cache paths after module extraction.
- [x] Phase 5: Final docs update, verification, and checkpoint.
- [x] Scoring verification: expand PFRA examples into a fixture-backed suite covering max, minimum, failing, and boundary values.
- [x] UI redesign planning: create feature parity matrix, mock implementation map, redesign plan, and UI test plan.
- [x] UI redesign planning: define modular theme presets, layout slots, and swappable visual variants.
- [x] UI implementation Phase 1 foundation: add layout slots, variant registry, theme presets, data attributes, and safe preset selector without replacing the calculator UI.
- [x] UI implementation Phase 2 foundation: replace the hamburger pattern with a shared settings/control hub while preserving existing menu functions.
- [x] UI implementation Phase 3 foundation: add score header slot rendering that mirrors real score output through active theme variants.
- [x] UI implementation Phase 4 foundation: move real sex, age, and standards controls into the score/header area.
- [x] UI implementation Phase 5 foundation: add lap display slot rendering that mirrors real legacy/PFRA lap output through active theme variants.
- [x] UI implementation Phase 6 foundation: wrap existing chart image sources in a chart drawer with active chartDisplay variants.
- [x] UI implementation Phase 7A foundation: body composition card shell wrapping real `#pfra-whtr` input and `#pfra-body-score` in a `bodyCompositionCard` slot with all five variant styles.
- [x] UI implementation Phase 7B foundation: strength card shell wrapping real legacy strength sections in a `strengthCard` slot with PFRA score display and all five variant styles.
- [x] Component editor architecture: created `docs/COMPONENT_EDITOR_ARCHITECTURE.md` defining the universal mock pattern (summary strip + one active editor) and stopping the stacked-card approach.
- [x] Settings hub placement fix: identified CSS containing-block bug (`transform` on `.info-section` made it the containing block for the fixed panel); fixed with `right: 0`.
- [x] Component editor Phase A: `#component-summary-strip` with PUSH/CORE/RUN buttons, selection state, `src/ui/component-editor.mjs`, variant system wiring.
- [x] Component editor Phase B: `#active-component-editor` container with three empty editor panels (`#strength-editor`, `#core-editor`, `#cardio-editor`); panel switching via `selectComponent()`.
- [x] Component editor Phase C: move strength controls (`#push-sel`, `#push-txt`, `#push-slider`, `#push-tick`, `#push-btn`) into `#strength-editor`; remove `#strength-card` wrapper.
- [x] Component editor Phase D: move core controls (`.situp-txt`, `.sit-sel-chart`, `.sit-slide`, `#sit-sel`, `#sit-btn`, `#sit-txt`, `#plankmintxt`, `#sit-slider`, `#sit-tick`) into `#core-editor`; add `component-editor__header` with `#pfra-core-score`; remove old stacked core sections.
- [x] Altitude adjustment Phase A (pure functions): `getAltitudeGroup`, `applyRunAltitudeAdjustment`, `applyWalkAltitudeAdjustment`, `applyHamrAltitudeAdjustment` in `src/pfra/scoring.mjs`; 33 altitude fixture tests; altitude JSON tables extracted.
- [x] Altitude adjustment Phase A (UI wiring): `pfra-calculator.js` reads `#alt-select`, loads altitude tables, applies correction to cardio performance before scoring; browser regression tests; legacy `altitudeSel` PFRA-mode guard in `main2.js`.
- [x] Clean runtime Phase 1: `src/pfra/app.mjs` passive state observer — `getState`, `refreshStateFromDom`, `dispatch` (internal only); exposed as `window.afptApp`; browser regression added.
- [x] Clean runtime Phase 2A: shadow scoring — `computeScoreFromState`, `getScoreResult`, `refreshScoreFromDom`, `isReady`, `getLoadError`; altitude-aware; no DOM rendering; shadow total verified to match visible PFRA total.
- [x] Pace plan course polish: inline start markers, separate START button, route label staggering, out/back label symmetry, and return-to-track animation.
- [x] Pace plan course morph refinement: centered controls/finish labels and added visible SVG morph layers between Track, Route, and Out/Back course shapes.
- [x] Pace plan animation guard fix: prevent course morph/line/marker animations from replaying on cardio goal-time changes.
- [x] Pace plan visual distance polish: add Out/Back return-lane dot, tighten Route bottom label spacing, and display pacer distance in miles.
- [x] Pace plan icon controls and split fix: circular play/pause/reset controls, upright runner, and exact finish split times.
- [x] Pace plan course switch control fix: keep pause/reset hidden before start when switching Track, Route, and Out/Back.
- [x] Desktop dashboard layout: add a 980px+ responsive grid, desktop chart context panel, and browser regression coverage while preserving mobile layout.
- [x] Desktop dashboard polish: move desktop chart context into the center editor workflow, keep pace as the right-side context panel, refine desktop grid tracks/max width, and preserve mobile layout.
- [x] Desktop calculator guide page: replace the generic dashboard draft with a desktop-first calculator + educational guide layout, show all four real editors at wide widths, and preserve mobile switching behavior.
- [ ] Component editor Phase E: move cardio controls into `#cardio-editor`.
- [ ] Component editor Phase F: mobile component switching hides non-selected editors while desktop shows all editor panels; verify values survive switching.
- [ ] Component editor Phase G: live value mirroring in summary cards; add `#pfra-core-score` and `#pfra-cardio-score`.

## Later Improvements

- Execute the UI redesign against `docs/LAYOUT_VARIANT_SYSTEM.md`, `docs/THEME_PARITY_MATRIX.md`, and `docs/FEATURE_PARITY_MATRIX.md` without changing calculator behavior.
- Build the shared normalized UI state/action contract for future renderers.
- Polish the score header variants after the demographic/header and lap-display slots are implemented.
- Polish lap display variants after the chart drawer and component shell slots are implemented.
- Convert chart images to structured data only after chart drawer parity is stable.
- Build theme-specific demographic control variants after the shared state/action contract exists.
- Add a dev-only layout variant picker after the shared render/action contract exists.
- Add persistent user layout customization after all theme presets pass parity.
- Try replacing the inline pace-plan audio controls with a compact settings icon/modal after the audio cue workflow is proven on-device.
- Before public distribution, add in-app links for Privacy Policy, Terms of Use, Disclaimer, Support, and the marketing/legal launch checklist.
- Move legacy standards out of `main2.js` into versioned data.
- Add a review-first standards import workflow for PDFs/images.
- Add more browser regression cases for exemptions, walk scoring, plank time entry, and alternate component combinations.
- Perform an independent row-by-row source-PDF audit of every extracted PFRA table before public production launch.
- Remove the temporary development build modal before a production launch.
