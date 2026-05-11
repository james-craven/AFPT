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
- Component Editor Phase C complete: Strength controls are inside `#strength-editor`. Old `#strength-card` is gone.
- Component Editor Phase D complete: Core controls are inside `#core-editor`. Old stacked core sections are gone. `#pfra-core-score` exists and is wired.
- Cardio is still in its old stacked section below `#active-component-editor`. `#cardio-editor` is empty.
- Do not visually polish component editors yet.

Begin Phase E only:
Move real Cardio controls into `#cardio-editor`.

Move/wrap these existing elements (keep all IDs and event bindings):
- `.run-txt` section containing `#run-txt-p`
- `.run-sel-chart` section containing `#run-sel`, `#run-btn`, `#run-txt`
- `.run-slide` section containing `#run-slider` and `#run-tick`

Also add inside `#cardio-editor`:
- A `component-editor__header` div with:
  - `component-editor__title` span: "RUN"
  - `component-editor__pfra-score` span with id `pfra-cardio-score` (hidden outside PFRA mode, same CSS rule as `#pfra-strength-score` and `#pfra-core-score`)

After moving:
- Remove the old stacked cardio section elements from the DOM.
- Remove `.run-txt,`, `.run-sel-chart,`, `.run-slide,` from the shared app-column CSS rule in `style.css` (if present).
- Add `#cardio-editor` scoped overrides mirroring the pattern used for `#strength-editor` and `#core-editor`.
- Check `pfra-calculator.js` and `src/pfra/dom.mjs` for any `#pfra-cardio-score` references — wire it up if the ID already exists there.
- Update browser regression tests:
  - Chart shortcut test for `#run-btn` must switch to cardio before clicking.
  - Legacy and PFRA run interactions must switch to cardio first.
  - Add `assertCardioEditor(page)` in `runPfraRegression` after `assertCoreEditor(page)`: switch to cardio, verify `#pfra-cardio-score` visible in PFRA mode, exercise run input, check score header mirrors total.

Rules:
- Preserve all IDs and event bindings.
- Do not duplicate controls.
- Do not change scoring logic.
- Do not visually polish editors beyond the basic `component-editor__header` pattern already established.
- Run `npm test`, `git diff --check`, `git status`.
- Commit and push if tests pass.
