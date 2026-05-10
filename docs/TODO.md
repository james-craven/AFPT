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

## Later Improvements

- Execute the UI redesign against `docs/LAYOUT_VARIANT_SYSTEM.md`, `docs/THEME_PARITY_MATRIX.md`, and `docs/FEATURE_PARITY_MATRIX.md` without changing calculator behavior.
- Build the shared normalized UI state/action contract for future renderers.
- Polish the score header variants after the demographic/header and lap-display slots are implemented.
- Polish lap display variants after the chart drawer and component shell slots are implemented.
- Convert chart images to structured data only after chart drawer parity is stable.
- Build theme-specific demographic control variants after the shared state/action contract exists.
- Add a dev-only layout variant picker after the shared render/action contract exists.
- Add persistent user layout customization after all theme presets pass parity.
- Move legacy standards out of `main2.js` into versioned data.
- Add a review-first standards import workflow for PDFs/images.
- Add more browser regression cases for exemptions, walk scoring, plank time entry, and alternate component combinations.
- Perform an independent row-by-row source-PDF audit of every extracted PFRA table before public production launch.
- Remove the temporary development build modal before a production launch.
