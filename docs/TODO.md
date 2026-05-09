# TODO

## Active Migration Queue

- [x] Phase 0: Commit control docs and current verified hardening baseline.
- [x] Phase 1: Extract PFRA standards access into `src/pfra/standards.mjs`.
- [x] Phase 1: Extract pure PFRA scoring into `src/pfra/scoring.mjs`.
- [x] Phase 1: Update tests to use the shared PFRA scoring module.
- [x] Phase 2: Split PFRA DOM lookup, state sync, rendering, and events where practical.
- [ ] Phase 3: Document legacy scoring boundaries and future removable code.
- [ ] Phase 4: Verify service-worker cache paths after module extraction.
- [ ] Phase 5: Final docs update, verification, and checkpoint.

## Later Improvements

- Move legacy standards out of `main2.js` into versioned data.
- Add a review-first standards import workflow for PDFs/images.
- Add more browser regression cases for exemptions, walk scoring, plank time entry, and alternate component combinations.
- Remove the temporary development build modal before a production launch.
