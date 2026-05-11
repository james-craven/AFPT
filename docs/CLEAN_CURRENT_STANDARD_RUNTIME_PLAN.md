# Clean Current-Standard Runtime Plan

**Decision date:** 2026-05-11

**Context:** Altitude adjustment was just wired through the legacy bridge (`pfra-calculator.js`
↔ `main2.js`). The work exposed a deeper problem: two state systems fighting over the same DOM
IDs produce expensive debugging loops and fragile behavior. The `Cannot read properties of
undefined (reading 'split')` error was a symptom, not an isolated bug.

**Decision:** Stop integrating current-standard logic through the legacy bridge. Build a clean
current-standard runtime path in parallel, then cut over.

---

## 1. The Problem With the Current Architecture

```
main2.js  (owns sliders, ticks, input sync, mode changes, chart behavior, altitude)
    +
pfra-calculator.js  (bridge: reads legacy controls, calls scoring.mjs, renders PFRA outputs)
    +
Both systems touch the same DOM IDs
    =
Every new feature requires reasoning through two state machines, event ordering, mode flags,
microtask timing, and hidden cross-dependencies
```

**Cost per feature:** Before a change lands, Claude must re-derive:
- Which module owns this DOM ID right now?
- Which event fires first — legacy or PFRA listener?
- Which hidden editor panel is active?
- What is `pfraCardioTracksStartingValue` at this moment?
- Why did the legacy tick rebind after the PFRA microtask?

A clean controller eliminates most of this. When altitude changes, the new flow is:

```
update state.altitudeGroup → recalculate cardio → render output
```

---

## 2. What We Keep

All of this is clean, tested, and already works:

| Asset | Why it stays |
|-------|-------------|
| `src/pfra/scoring.mjs` | Pure functions, 131 tested examples, no DOM dependency |
| `standards/extracted/tables/*.json` | Source-backed PFRA scoring tables |
| `standards/extracted/tables/altitude-*.json` | Source-backed altitude correction tables |
| `tools/fixtures/pfra-scoring-examples.json` | 131 fixture cases including 33 altitude cases |
| `tools/validate-pfra-tables.mjs` | Fixture test runner |
| `src/pfra/standards.mjs` | Table/standards loading logic |
| `src/pfra/state.mjs` | Age/sex/event mappings (use what's needed, drop legacy bridges) |
| `src/pfra/dom.mjs` | DOM element registry (clean up legacy control refs in Phase 6) |
| `src/pfra/ui.mjs` | PFRA rendering helpers |
| `src/ui/component-editor.mjs` | Component strip, panel switching, `selectedComponent` state |
| `src/ui/score-header.mjs` | Score header slot |
| `src/ui/lap-display.mjs` | Lap display slot |
| `src/ui/chart-drawer.mjs` | Chart drawer slot |
| `src/ui/settings-hub.mjs` | Settings hub |
| `src/ui/theme-controller.mjs` | Theme preset system |
| `src/ui/layout-variants.mjs` | Variant registry |
| `src/ui/body-composition-card.mjs` | Body composition card |
| `pwa.js`, `sw.js`, `tools/build-sw.mjs` | PWA/offline system |
| `tools/browser-regression.mjs` | Browser test suite (update per phase) |
| All source audit docs in `docs/source-extracts/` | Source of truth documentation |
| All altitude extraction notes in `docs/source-extracts/` | Verified data provenance |

---

## 3. What We Retire / Quarantine

| Item | When | Notes |
|------|------|-------|
| `main2.js` active runtime | Phase 4 | Remove `<script>` tag; keep file until Phase 6 |
| `pfra-calculator.js` bridge | Phase 4 | Remove `<script>` tag; delete in Phase 6 |
| `window.afptLegacy` export | Phase 4 | No longer needed once `app.mjs` owns controls |
| `window.syncPfraFromLegacy` bridge | Phase 4 | `app.mjs` dispatches directly |
| Legacy mode option in `#standards-mode` | Phase 5 | Remove `<option value="legacy">` |
| Legacy slider/textbox sync (`syncLegacyInputsFromSliders`, etc.) | Phase 4 | Replaced by `app.mjs` rendering |
| Legacy tick binding (`bindSliderTickClick`, `window.afptLegacy.bindSliderTickClick`) | Phase 4 | `app.mjs` renders tick positions directly |
| Legacy age/sex/run score arrays in `main2.js` (lines 52–3640) | Phase 6 | Delete with `main2.js` |
| Legacy altitude logic (`calculateAltitudeDiff`, legacy run scoring) | Phase 6 | Delete with `main2.js` |
| `pfraCardioTracksStartingValue` flag | Phase 4 | Bridge-specific complexity, not needed |
| Legacy mode branching in `pfra-calculator.js` | Phase 4 | Bridge-specific, not needed |

**Note:** The altitude wiring done in Phase A (2026-05-11) wired `#alt-select` through the
legacy bridge as a temporary measure. Phase 3 of this plan replaces that with a direct
`app.mjs` binding. The `main2.js` PFRA guard added in Phase A stays until `main2.js` is removed.

---

## 4. New Architecture: `src/pfra/app.mjs`

### State shape

```js
{
  sex: 'female' | 'male',
  ageGroup: 'under-25' | '25-29' | '30-34' | '35-39' | '40-44' | '45-49' | '50-54' | '55-59' | '60-and-over',
  whtr: string,             // decimal string e.g. "0.49"
  altitudeGroup: 0-4,       // 0 = no adjustment
  strength: {
    event: 'push-up' | 'hand-release-push-up',
    value: string,          // rep count as string
    exempt: boolean,
  },
  core: {
    event: 'sit-up' | 'cross-leg-reverse-crunch' | 'forearm-plank',
    value: string,          // rep count or "mm:ss"
    exempt: boolean,
  },
  cardio: {
    event: 'two-mile-run' | 'hamr-20-meter' | 'two-kilometer-walk',
    value: string,          // "mm:ss" or rep count string
    exempt: boolean,
  },
  selectedComponent: 'strength' | 'core' | 'cardio',
}
```

### Actions

```js
setSex(sex)
setAgeGroup(ageGroup)
setWhtr(value)
setAltitudeGroup(group)             // reads #alt-select; group 0–4
setStrengthEvent(event)
setStrengthValue(value)
setStrengthExempt(bool)
setCoreEvent(event)
setCoreValue(value)
setCoreExempt(bool)
setCardioEvent(event)
setCardioValue(value)
setCardioExempt(bool)
setSelectedComponent(component)
```

### Render outputs (after each dispatch)

| Output | Element | Notes |
|--------|---------|-------|
| Total score | `#score-txt`, score header slot | Formatted with category |
| Body score | `#pfra-body-score` | Points 0–20 |
| Strength score | `#pfra-strength-score` | Points 0–15 or "EXEMPT" |
| Core score | `#pfra-core-score` | Points 0–15 or "EXEMPT" |
| Cardio score | `#pfra-cardio-score` | Points 0–50 or "EXEMPT" |
| Component summary cards | `#summary-strength`, `#summary-core`, `#summary-cardio` | Score chips in strip |
| Active editor score label | `#push-txt-p`, `#sit-txt-p`, `#run-txt-p` | "Score: N \| Min: X \| Max: Y" |
| Slider range | `#push-slider`, `#sit-slider`, `#run-slider` | min/max based on age/sex/event |
| Slider pass/fail state | CSS class `slider-green` / `slider-red` | Based on score > 0 |
| Min threshold tick | `#push-tick`, `#sit-tick`, `#run-tick` | Position + click-to-set |
| Lap display | `#run-lap-times`, lap display slot | 6-lap (walk) or 8-lap (run) |
| Cardio mode text | `#run-txt`, option labels | "2 Mile", "20m HAMR", "2 km Walk" |
| Altitude applied label | (optional UI element) | Which group is active |
| PFRA status | `#pfra-status` | Standards loading state |

### Data flow

```
DOM event
  → action dispatch
  → state update
  → scorePfraAssessment() with altitude adjustment
  → render all outputs
```

No callbacks into `main2.js`. No `window.syncPfraFromLegacy`. No microtask bridges.

---

## 5. Phased Implementation

### Phase 1 — Create `src/pfra/app.mjs` in parallel (no deletion)

**Scope:** New file only. `main2.js` and `pfra-calculator.js` continue to run.

1. Create `src/pfra/app.mjs` with:
   - State object initialized from current DOM values
   - `dispatch(action)` function
   - All actions listed above (state update only — no rendering yet)
   - `getState()` getter
2. Add `<script type="module" src="./src/pfra/app.mjs">` to `index.html`
3. Expose `window.afptApp = { dispatch, getState }` for test access
4. Verify: `window.afptApp.getState()` returns correct initial state in browser

**Exit criteria:** `npm test` passes. `window.afptApp` is accessible. State initializes correctly.

---

### Phase 2 — Bind controls to `app.mjs` (parallel, no old handler removal)

**Scope:** Add event listeners in `app.mjs` for all current-standard controls. Old handlers remain active — both fire.

Bind these controls:
- `#sex-sel` → `setSex`
- `#age-sel` → `setAgeGroup`
- `#pfra-whtr` → `setWhtr`
- `#alt-select` → `setAltitudeGroup`
- `#push-sel` (PFRA events only) → `setStrengthEvent` (with exempt detection)
- `#push-slider`, `#push-txt` → `setStrengthValue`
- `#sit-sel` (PFRA events only) → `setCoreEvent`
- `#sit-slider`, `#sit-txt`, `#plankmintxt` → `setCoreValue`
- `#cardio-sel` (PFRA events only) → `setCardioEvent`
- `#run-slider`, `#run-mintxt`, `#run-sectxt` → `setCardioValue`
- `#summary-strength`, `#summary-core`, `#summary-cardio` → `setSelectedComponent`

After dispatch: call `scorePfraAssessment()` and write results to render outputs listed above.

**Exit criteria:** `npm test` passes. `window.afptApp.getState()` updates correctly on all control changes. Rendered outputs match what `pfra-calculator.js` currently shows.

---

### Phase 3 — Full scoring with altitude, sliders, ticks

**Scope:** Complete the render pipeline in `app.mjs`.

1. Implement full render pass after each dispatch:
   - Component scores with altitude adjustment (using the same functions as `pfra-calculator.js`)
   - Slider range updates per event/age/sex
   - Slider pass/fail CSS classes
   - Min tick position and click-to-set behavior
   - Lap display (8-lap for run, walk labels)
   - Cardio mode text updates
2. Add `#standards-mode` binding (always PFRA — no legacy option needed in app.mjs)

**Altitude wiring:** `app.mjs` calls `applyRunAltitudeAdjustment`, `applyHamrAltitudeAdjustment`,
and `applyWalkAltitudeAdjustment` directly — same logic as the Phase A bridge implementation
in `pfra-calculator.js`, but owned cleanly by `app.mjs` with no legacy coupling.

**Browser tests:** Add `assertAppMjsScoring(page)` that exercises the `window.afptApp.dispatch`
path and verifies outputs match fixture expectations.

**Exit criteria:** `npm test` passes. `app.mjs` dispatch path produces correct scores for all
events, events at altitude, and exemptions. Browser tests pass. `pfra-calculator.js` output and
`app.mjs` output match.

---

### Phase 4 — Switch `index.html` to load `app.mjs` only

**Scope:** Remove `<script>` tags for `pfra-calculator.js` and `main2.js`. Add `app.mjs`.

1. Remove `<script src="./main2.js">` from `index.html`
2. Remove `<script src="./pfra-calculator.js">` from `index.html`
3. Verify all browser regression tests still pass with only `app.mjs` loaded
4. Update `tools/validate-pwa-cache.mjs` required file list if needed
5. Rebuild `sw.js`

**Rollback:** `git revert` this commit restores both scripts.

**Exit criteria:** `npm test` passes with `main2.js` and `pfra-calculator.js` not loaded.
All browser regressions pass against `app.mjs` only.

---

### Phase 5 — Remove Legacy mode option

**Scope:** UI only.

1. Remove `<option value="legacy">Legacy</option>` from `#standards-mode` in `index.html`
2. Remove any `isPfraModeActive()` calls from `app.mjs` (always PFRA now)
3. Update score header: remove "Legacy" mode label path
4. Remove `runLegacyRegression` from browser tests (or mark skipped)
5. Update `CLAUDE.md` to remove legacy mode references

**Exit criteria:** `npm test` passes. No "Legacy" option visible. PFRA is always active.

---

### Phase 6 — Delete dead code

**Scope:** Remove files and symbols no longer loaded.

1. Delete `main2.js`
2. Delete `pfra-calculator.js`
3. Remove `main2.js` and `pfra-calculator.js` from SW cache (rebuild `sw.js`)
4. Clean up `src/pfra/dom.mjs` — remove legacy control refs no longer referenced
5. Clean up `src/pfra/state.mjs` — remove legacy mapping functions not used by `app.mjs`
6. Remove `window.afptLegacy`, `window.syncPfraFromLegacy` (no longer exposed)
7. Update `tools/validate-pwa-cache.mjs` required file list

**Exit criteria:** `npm test` passes. No `main2.js`, `pfra-calculator.js`, `window.afptLegacy`,
or `window.syncPfraFromLegacy` references anywhere in active code.

---

### Phase 7 — Polish UI and final docs

**Scope:** UI cleanup and documentation update.

1. Move `#alt-select` into `#cardio-editor` (currently it sits outside the editor)
2. Verify all five theme variants render correctly for all component editors
3. Update `CLAUDE.md` to reflect new architecture
4. Update `docs/FEATURE_PARITY_MATRIX.md` — all rows should be `Implemented`
5. Update `docs/SESSION_LOG.md`
6. Final `npm test` pass

**Exit criteria:** `npm test` passes. All parity matrix rows implemented. Docs current.

---

## 6. Rollback Plan

Before starting Phase 4 (the cutover), create a restore tag:

```bash
git tag pre-app-mjs-cutover
git push origin pre-app-mjs-cutover
```

To roll back:
```bash
git checkout pre-app-mjs-cutover
```

Each phase is committed separately. Individual phase commits can be reverted without
affecting earlier phases if they have no forward dependencies.

**During Phases 1–3** (parallel path), the existing runtime is untouched. Rollback is
`git revert` on any commit without risk to the production path.

**Phase 4** (cutover) is the high-risk commit. The restore tag makes it reversible.

---

## 7. What Stays The Same

- All scoring tables and fixture tests are unchanged throughout
- The component editor shell (`selectComponent`, strip, panels) is unchanged
- Theme system, score header, lap display, chart drawer, settings hub are unchanged
- PWA/offline behavior is unchanged
- `#alt-select` UI is unchanged (moved into `#cardio-editor` in Phase 7)
- All altitude adjustment logic is identical — only the ownership moves from
  `pfra-calculator.js` to `app.mjs`

---

## 8. Why This Saves Time

Current cost per feature addition:
- Re-derive which module owns which DOM ID
- Reason about event ordering (legacy vs PFRA, sync vs microtask)
- Guard against PFRA mode in legacy handlers
- Trace `pfraCardioTracksStartingValue` state machine
- Debug side effects from two systems updating the same elements

Future cost per feature addition:
- Update state shape if needed
- Add action
- Add render call
- Done
