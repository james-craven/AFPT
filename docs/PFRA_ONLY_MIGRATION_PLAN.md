# PFRA-Only Migration Plan

**Decision:** Stop migrating legacy controls into the new component editors. Instead, progressively
disconnect the legacy calculator and convert the app to PFRA 2026 only.

**Rationale:** `main2.js` and `pfra-calculator.js` both own the same DOM controls and both bind
threshold ticks, causing timing/order bugs (e.g. `#sit-tick` snapping to legacy minimum 35 instead
of PFRA minimum 29). The bridge is a permanent source of fragility. PFRA scoring now has 98 passing
test examples. The new UI architecture is in place. Legacy scaffolding is now costing more than it
is worth.

**Restore point:** tag `pre-pfra-only-migration` (commit `9ac80e4`, 2026-05-11).

---

## 1. What Must Be Preserved

### Scoring engine (keep as-is)
- `src/pfra/scoring.mjs` — pure functions, 98 tested examples
- `src/pfra/standards.mjs` — table loading from JSON
- `src/pfra/state.mjs` — age/sex/event mappings
- `src/pfra/dom.mjs` — DOM element lookup
- `src/pfra/ui.mjs` — PFRA rendering helpers
- `standards/af-pfra-2026.json` + `standards/extracted/tables/*.json`

### UI infrastructure (keep as-is)
- `src/ui/component-editor.mjs` + all editor panels (`#strength-editor`, `#core-editor`, `#cardio-editor`)
- `src/ui/chart-drawer.mjs`
- `src/ui/lap-display.mjs`
- `src/ui/score-header.mjs`
- `src/ui/settings-hub.mjs`
- `src/ui/theme-controller.mjs`
- `src/ui/layout-variants.mjs`
- `src/ui/body-composition-card.mjs`

### PWA / offline system
- `pwa.js`, `sw.js`, `tools/build-sw.mjs`, `tools/validate-pwa-cache.mjs`

### Test infrastructure
- `tools/validate-pfra-tables.mjs` + `tests/fixtures/`
- `tools/browser-regression.mjs` (will be updated per phase)

### PFRA scoring coverage
PFRA 2026 already scores all components:
- **Strength:** push-ups, hand-release push-ups
- **Core:** sit-ups, reverse crunch, forearm plank
- **Cardio:** 2-mile run, HAMR (20-meter shuttle), 2km walk
- **Body composition:** WHtR (waist-to-height ratio)
- **Exemptions:** all components

---

## 2. What Can Be Removed or Quarantined

### Legacy mode UI (remove)
- The "Legacy" option from `#standards-mode` selector
- All legacy-mode branching in `pfra-calculator.js` (`restoreLegacyMainScore`, `isPfraModeActive` checks)
- The legacy `#score-txt` write path in `main2.js`

### Legacy scoring tables (remove after Phase 5)
- Lines 52–3640 in `main2.js`: 140+ nested score arrays
- `setScoreArrays()`, `minMaxValueAge()`, `ageSexChange()` internals
- All per-event legacy lookup functions

### Legacy control ownership (remove per phase)
- `main2.js` slider event handlers (`runSlideInput`, `pushSlideInput`, `sitSlideInput`)
- `main2.js` text input sync (`addTxtboxEventListeners`, `changeTxtboxes`)
- `main2.js` threshold tick binding (`bindSingleTickClick`, exposed as `window.afptLegacy.bindSliderTickClick`)
- `main2.js` chart modal hardcoding (opening modals with hardcoded `strengthAbsLink`/`cardioLink`)
- `window.afptLegacy` export object
- `window.syncPfraFromLegacy` bridge
- `pfra-calculator.js` entirely (bridge no longer needed once PFRA owns all controls)

### Old stacked DOM sections (already partially removed)
- Phase C done: `.strength-txt`, `.push-sel-chart`, `.push-slide` removed from stacked flow
- Phase D done: `.situp-txt`, `#sit-sel-chart-section`, `.sit-slide` removed from stacked flow
- Phase E pending: `.run-txt`, `.run-sel-chart`, `.run-slide` still in stacked flow
- Altitude selector section (`#alt-select` in `.runlaps-row`) — see gap below

---

## 3. Gaps That Must Be Filled Before Legacy Removal

These features exist in `main2.js` with **no current equivalent in `src/pfra/`**. They block
deletion of legacy code until resolved.

### Gap 1: Altitude adjustment (blocking)
- **What it does:** Adjusts run/walk times by altitude group (5250–5499ft through >6600ft).
  `calculateAltitudeDiff()` returns per-event time adjustments based on age/sex.
- **Currently:** `#alt-select` drives `main2.js` score recalculation. PFRA has no altitude logic.
- **Decision required:** Does PFRA 2026 include altitude adjustments in the official standard?
  If yes, implement in `src/pfra/scoring.mjs` + add fixture tests.
  If no (PFRA does not use altitude), remove the `#alt-select` element and note this as a
  deliberate product decision (PFRA-only, no altitude correction).

### Gap 2: Lap display format (minor, manageable)
- **What it does:** Legacy displays 6 laps for 1.5-mile run. PFRA displays 8 laps for 2-mile run.
- **Currently:** Both write to `#run-lap-times`. Lap display module mirrors that element.
- **Resolution:** After removing legacy mode, only the PFRA 8-lap format is needed. The lap
  display module already handles this. No new code required — just remove the legacy 6-lap path
  from `changeLapTime()` when `main2.js` is deleted.

### Gap 3: Shuttle run display format (minor)
- **What it does:** Legacy shows "Shuttle Level: N | Current Level Shuttles: N".
  PFRA treats HAMR as a scored event with a performance value (number of shuttles).
- **Resolution:** PFRA scoring handles HAMR correctly. The display format changes
  (no level/count breakdown, just performance and score). Acceptable product change.

### Gap 4: Walk pass/fail text (minor)
- **What it does:** Legacy shows "Pass" / "Fail" for walk. PFRA `scoreWalk()` returns numeric
  points. The display text is formatted differently.
- **Resolution:** PFRA already renders correct walk output via `pfra-calculator.js` rendering.
  No gap once legacy mode is removed.

---

## 4. Files and Modules Affected

| File | Change |
|------|--------|
| `index.html` | Phase E: move cardio controls into `#cardio-editor`. Later: remove `#alt-select` section; remove `#standards-mode` legacy option; remove stacked `.runlaps-row` if lap display slot replaces it. |
| `main2.js` | Phases 3–5: strip event handlers one component at a time; then delete or quarantine the file. |
| `pfra-calculator.js` | Phase 4: remove legacy bridge logic (`syncFromLegacyCalculator`, `handleLegacyControlChange`, `restoreLegacyMainScore`). Phase 5: delete or fold remaining code into `src/pfra/app.mjs`. |
| `src/pfra/app.mjs` (new) | Phase 3: owns all input events, calls scoring, updates UI — replaces the bridge. |
| `src/pfra/dom.mjs` | Remove legacy control references once `main2.js` no longer owns them. |
| `src/pfra/state.mjs` | Remove legacy↔PFRA mapping functions once there is no legacy. |
| `src/pfra/scoring.mjs` | Gap 1: add altitude adjustment if PFRA standard requires it. |
| `src/ui/component-editor.mjs` | No structural change. Already correct. |
| `tools/browser-regression.mjs` | Phase 3: remove legacy regression suite; update PFRA suite to not depend on `main2.js` side effects. |
| `sw.js` | Rebuilt automatically. Cache paths for any removed files must be cleaned. |

---

## 5. Phased Implementation

### Phase E (current — complete before starting migration)
Move cardio controls into `#cardio-editor`. Remove old stacked cardio sections. This finishes the
component editor migration and gives PFRA full control over all three component editors.

**Exit criteria:** All controls in component editors. No stacked push/sit/run sections remain.

---

### Phase 1 — Remove Legacy Mode from the UI
**Scope:** Product decision, UI only.

1. Remove the "Legacy" `<option>` from `#standards-mode` in `index.html`.
2. Remove legacy-mode branching from `pfra-calculator.js` (`isPfraModeActive()` always returns
   true; remove the false branch of every `if (isPfra)` block).
3. Remove `restoreLegacyMainScore()` and the `ageSexChange()` call on legacy exit.
4. Remove `window.syncPfraFromLegacy` bridge (no longer needed if only one mode exists).
5. Remove altitude selector (`#alt-select`) **if** the product decision is PFRA-only with no
   altitude adjustment (see Gap 1). If altitude must be supported, defer this to after Gap 1 is
   resolved.
6. Update `runLegacyRegression` in browser regression tests → delete it or mark as skipped.

**What still works after Phase 1:**
`main2.js` still owns all input events. PFRA scoring still runs. Score display correct.
Only the mode toggle is gone.

**Exit criteria:** `npm test` passes. No "Legacy" option in UI. PFRA is always active.

---

### Phase 2 — Create PFRA-Only Controller (`src/pfra/app.mjs`)
**Scope:** New file only, no deletions yet.

Create `src/pfra/app.mjs` that:
- Imports from `src/pfra/scoring.mjs`, `src/pfra/standards.mjs`, `src/pfra/dom.mjs`, `src/pfra/state.mjs`, `src/pfra/ui.mjs`
- Owns a single `state` object: `{sex, ageGroup, strength, core, cardio, whtr, exemptions}`
- Exposes `dispatch(action)` — actions: `SET_SEX`, `SET_AGE`, `SET_STRENGTH_EVENT`, `SET_STRENGTH_PERF`, `SET_CORE_EVENT`, `SET_CORE_PERF`, `SET_CARDIO_EVENT`, `SET_CARDIO_PERF`, `SET_WHTR`, `SET_EXEMPTION`
- After each dispatch: calls `scorePfraAssessment()`, updates all output elements directly
- Does not call `window.afptLegacy` or any `main2.js` function
- Exposes `window.afptApp` for tests

Add `<script src="src/pfra/app.mjs" type="module">` to `index.html` (does not replace
`pfra-calculator.js` yet — both loaded simultaneously so behavior is verifiable).

**Exit criteria:** `npm test` passes. `window.afptApp.dispatch()` correctly updates score display.

---

### Phase 3 — Move Input Ownership from Legacy to PFRA (per component)
**Scope:** One component at a time. Each is a separate commit.

For each component (strength → core → cardio):
1. Add event listeners in `src/pfra/app.mjs` for that component's controls (select, text input, slider).
2. Remove the corresponding event listeners from `main2.js`.
3. Remove the corresponding `handleLegacyControlChange` listeners from `pfra-calculator.js`.
4. Update `src/pfra/ui.mjs` to bind threshold ticks via `updateThresholdTick()` — no longer
   calling `window.afptLegacy.bindSliderTickClick`.
5. Update browser regression tests for that component to call `window.afptApp.dispatch()` instead
   of relying on `main2.js` side effects.

**Key invariant per step:** Score output must match before and after the swap for the same inputs.
Use the existing fixture suite as the oracle.

**Exit criteria after all three components:** No component input events are handled by `main2.js`.
`window.afptLegacy.bindSliderTickClick` is no longer called. `npm test` passes.

---

### Phase 4 — Remove pfra-calculator.js Bridge
**Scope:** Delete the bridge once `src/pfra/app.mjs` owns everything it handled.

1. Verify `pfra-calculator.js` has no remaining responsibilities (all rendering, event handling,
   and score updates are now in `src/pfra/app.mjs`).
2. Remove `<script src="./pfra-calculator.js">` from `index.html`.
3. Delete `pfra-calculator.js` (or move to `archive/` as reference).
4. Remove `window.syncPfraFromLegacy` (already removed in Phase 1).
5. Verify `src/pfra/dom.mjs` still references only elements that exist in the new DOM.
6. Update tests to not expect any `pfra-calculator.js`-specific globals.

**Exit criteria:** `npm test` passes without `pfra-calculator.js` loaded.

---

### Phase 5 — Remove or Quarantine main2.js
**Scope:** Delete or empty the legacy scoring file.

1. Verify no remaining code calls `window.afptLegacy.*` or any `main2.js` global.
2. Grep for any remaining `window.afptLegacy`, `window.syncPfraFromLegacy`, `window.updateScoreMinMaxText`, `window.ageSexChange` references in all source files.
3. Remove `<script src="./main2.js">` from `index.html`.
4. Delete `main2.js` (or move to `archive/`).
5. Remove `main2.js` from SW cache paths (rebuild `sw.js`).
6. Remove `window.afptLegacy` from any documentation references.

**Exit criteria:** `npm test` passes. `main2.js` not loaded. No orphaned legacy globals.

---

### Phase 6 — Clean PFRA Modules of Legacy Residue
**Scope:** Remove legacy↔PFRA mapping code that only existed for the bridge.

1. Remove legacy-mapping functions from `src/pfra/state.mjs` that are no longer needed
   (`legacyAgeToPfraAgeGroup`, `legacySexToPfraSex`, `strengthEventForLegacy`, etc.) —
   **only if** `src/pfra/app.mjs` reads from PFRA-native selectors directly.
   If the same DOM elements (e.g. `#sit-sel` with "Situps"/"Plank" options) are kept, these
   mappings may still be needed and should stay.
2. Remove legacy control references from `src/pfra/dom.mjs` (`legacyPushSelect`, etc.) if
   `src/pfra/app.mjs` owns those DOM IDs directly.
3. Update browser regression tests to be PFRA-only: remove any legacy score text assertions,
   remove lap time format assertions tied to 6-lap (1.5-mile) format.

**Exit criteria:** `npm test` passes. No `legacy*` symbols in PFRA module exports.

---

### Phase 7 — Remove Dead Files and Update PWA Cache
**Scope:** Cleanup.

1. Delete or archive any files no longer loaded: `pfra-calculator.js`, `main2.js`,
   any stale JS modules.
2. Rebuild `sw.js` to remove deleted files from cache manifest.
3. Update `tools/validate-pwa-cache.mjs` required file list.
4. Update `CLAUDE.md`, `docs/TODO.md`, `docs/SESSION_LOG.md`.

**Exit criteria:** `npm test` passes. PWA cache validates with correct file count.

---

## 6. Risks and Rollback

### Risk 1: Altitude adjustment user impact (medium)
If the product decision is PFRA-only with no altitude adjustment, users at altitude lose a feature.
**Mitigation:** Note explicitly in a visible UI change log or settings panel. The PFRA 2026
standard itself may not include altitude adjustment (confirm against source PDF).

### Risk 2: Scoring regression during handler transfer (high)
Moving event ownership one component at a time risks subtle differences if the new handler
does not exactly replicate the old one's timing or value normalization.
**Mitigation:** Use the 98-example fixture suite as oracle. Add browser regression assertions
that verify the same performance input yields the same score before and after each phase swap.
Consider temporarily running both old and new handlers in parallel during Phase 3 and comparing
outputs in the browser console before removing the old one.

### Risk 3: PWA cache invalidation (low)
Removing files changes the SW cache manifest. If old SW is cached, users may get stale responses.
**Mitigation:** Bump cache version string in `build-sw.mjs` at each phase that removes files.
The existing `pwa.js` already handles update detection.

### Risk 4: Test suite becomes PFRA-only too fast (low)
Deleting the legacy regression suite before Phase 5 means any regression in legacy behavior goes
undetected if the old code is still running.
**Mitigation:** Keep `runLegacyRegression` (even if skipped) until `main2.js` is confirmed
deleted in Phase 5.

### Rollback
Any phase can be rolled back to the tag `pre-pfra-only-migration` via:
```bash
git checkout pre-pfra-only-migration
```
Or cherry-pick individual phase commits out. Each phase is a clean, self-contained commit.

---

## 7. Immediate Next Step

Before starting Phase 1 of this migration plan:

**Finish Phase E** — Move cardio controls into `#cardio-editor` following the same pattern as
Phases C and D. This is already specified in `CLAUDE.md` and `docs/NEXT_SESSION_PROMPT.md`.

After Phase E, return to this document and begin Phase 1.

**Phase 1 first decision:** Resolve Gap 1 (altitude adjustment). Check the PFRA 2026 source PDF
to determine whether altitude correction is part of the PFRA standard. That answer determines
whether `#alt-select` gets removed or ported.
