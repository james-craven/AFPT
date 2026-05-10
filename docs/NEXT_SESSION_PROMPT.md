Continue from current master.

First run:
```
git pull origin master
git status
npm test
```

Read:
- CLAUDE.md
- docs/COMPONENT_EDITOR_ARCHITECTURE.md
- docs/TODO.md
- docs/SESSION_LOG.md

Current state:
- Component Editor Phase A complete: `#component-summary-strip` exists with PUSH / CORE / RUN buttons.
- Component Editor Phase B complete: `#active-component-editor` exists with `#strength-editor`, `#core-editor`, `#cardio-editor` panels; switching is wired.
- Component Editor Phase C complete: Strength controls are inside `#strength-editor` with a `component-editor__header` containing `#pfra-strength-score`. Old `#strength-card` is gone.
- Core and Cardio are still in their old stacked sections below `#active-component-editor`. `#core-editor` and `#cardio-editor` are empty.
- Do not visually polish component editors yet.
- Do not move Cardio yet.

Begin Phase D only:
Move real Core controls into `#core-editor`.

Move/wrap these existing elements (keep all IDs and event bindings):
- `.situp-txt` section containing `#sit-txt-p`
- `.sit-sel-chart` section (element id `sit-sel-chart-section`) containing `#sit-sel`, `#sit-btn`, `#sit-txt`, `.plank-colon`, `#plankmintxt`
- `.sit-slide` section containing `#sit-slider` and `#sit-tick`

Also add inside `#core-editor`:
- A `component-editor__header` div with:
  - `component-editor__title` span: "CORE"
  - `component-editor__pfra-score` span with id `pfra-core-score` (hidden outside PFRA mode, same CSS rule as `#pfra-strength-score`)

After moving:
- Remove the old stacked core section elements from the DOM.
- Update any CSS scoped overrides that target old selectors (e.g. `.situp-txt`, `.sit-sel-chart`) to scope under `#core-editor` instead, if needed.
- Check `style.css` for any element in the shared app-column list that should be removed (e.g. `.situp-txt`, `.sit-sel-chart`, `.sit-slide`).
- Check `pfra-calculator.js` for any `#pfra-core-score` references — wire it up if the ID already exists there.
- Update browser regression tests:
  - Any helper that reads from old core DOM locations should be updated to `#core-editor`.
  - Add or update assertions: core editor visible when CORE is selected, values survive switching, `#pfra-core-score` visible in PFRA mode.

Rules:
- Preserve all IDs and event bindings.
- Do not duplicate controls.
- Do not change scoring logic.
- Do not move Cardio yet.
- Do not visually polish editors beyond the basic `component-editor__header` pattern already established in Phase C.
- Run `npm test`, `git diff --check`, `git status`.
- Commit and push if tests pass.
