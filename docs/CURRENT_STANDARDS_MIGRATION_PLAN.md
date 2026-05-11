# Current Official Standards Migration Plan

**Supersedes:** `docs/PFRA_ONLY_MIGRATION_PLAN.md` (archived below for reference).

**Product requirement:** This app must calculate the current official USAF fitness assessment
using the current official Air Force guidance documents as the source of truth.

**What that means:**
- Legacy mode can be removed **because it implements outdated standards**, not because its
  features are inconvenient.
- Altitude adjustment, exemptions, lap timing, and pass/fail rules stay if the current official
  documents require them; they go if those documents exclude them.
- No scoring behavior may be added, removed, or changed without tracing it to a source document
  in `docs/SOURCE_OF_TRUTH_MANIFEST.md`.

**Source of truth:** `docs/SOURCE_OF_TRUTH_MANIFEST.md` — every scoring rule must be listed there.

**Source audit completed:** 2026-05-11 — DAFMAN 36-2905 (24 March 2026) OCR'd and audited.
See `docs/source-extracts/fitness-guidance-source-audit.md` for full findings.

**Restore point:** tag `pre-pfra-only-migration` (commit `9ac80e4`, 2026-05-11).

---

## Why Legacy Mode Can Be Removed

The legacy calculator implements the old AFT standard:
- 1.5-mile run (replaced by 2-mile run or 20-meter HAMR)
- Old score arrays by age/sex for pushups/situps/run (replaced by PFRA scoring tables)
- Altitude adjustment calibrated to 1.5-mile run times (the event no longer exists in PFRA)
- Legacy threshold calculations and lap display format (6 laps for 1.5-mile)

The current official standard is PFRA 2026 (effective 1 March 2026). PFRA scoring is already
implemented with 98 source-backed fixture tests. The old standard is not the current guidance.
Legacy mode must go.

---

## 1. What Must Be Preserved

### Scoring engine (keep as-is)
- `src/pfra/scoring.mjs` — pure functions, 98 tested examples
- `src/pfra/standards.mjs` — table loading from JSON
- `src/pfra/state.mjs` — age/sex/event mappings
- `src/pfra/dom.mjs` — DOM element lookup
- `src/pfra/ui.mjs` — PFRA rendering helpers
- `standards/af-pfra-2026.json` + `standards/extracted/tables/*.json`
- `standards/sources/PFRA-Scoring-Charts.pdf` — primary source document, keep forever

### UI infrastructure (keep as-is)
- `src/ui/component-editor.mjs` + all editor panels
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
- `tools/validate-pfra-tables.mjs` + `tools/fixtures/pfra-scoring-examples.json`
- `tools/browser-regression.mjs` (updated per phase)

---

## 2. What the Current Standard Covers

Sources: PFRA Scoring Charts (effective 1 Mar 2026) + DAFMAN 36-2905 (24 March 2026).

| Component | Events | Max points | Notes |
|-----------|--------|------------|-------|
| Body composition | WHtR | 20 | WHtR truncated to 2 decimal places; age-agnostic |
| Muscular strength | Push-up, Hand-release push-up | 15 | Component minimum required |
| Core endurance | Sit-up, Cross-leg reverse crunch, Forearm plank | 15 | Component minimum required |
| Cardiorespiratory | 2-mile run, 20-meter HAMR, 2km walk (pass/fail) | 50 | Component minimum required |

All scoring events are already implemented with extracted tables and fixture tests.

**Altitude adjustment (confirmed required):** DAFMAN 36-2905 Attachment 3 mandates time/shuttle
adjustments for assessments performed above 5,250 ft. Applies to 2-mile run, 2-km walk, and
20-meter HAMR. Four altitude bands: 5,250–5,499 ft, 5,500–5,999 ft, 6,000–6,599 ft, ≥6,600 ft.
**Implemented** — pure functions in `src/pfra/scoring.mjs` (33 fixture tests) and UI wiring in
`pfra-calculator.js` reads `#alt-select` and applies altitude adjustment to cardio performance
before scoring. See Phase A (complete) below.

---

## 3. Source Verification Status

See `docs/source-extracts/fitness-guidance-source-audit.md` for full OCR audit findings.

### Item A: Altitude adjustment — RESOLVED (2026-05-11)
- **Status:** CONFIRMED REQUIRED. Present in DAFMAN 36-2905, 24 March 2026, Attachment 3.
- **Finding:** Altitude time/shuttle corrections apply above 5,250 ft for 2-mile run, 2-km walk
  (male and female tables are separate), and 20-meter HAMR.
- **Action:** Implement in `src/pfra/scoring.mjs` with source-backed fixture tests. See Phase A.
- **Do not remove:** `#alt-select`, `runAltitudeAdjust.webp`, or `walkAltitudeAdjust.webp` until
  the PFRA implementation covers this. Then replace them with the new PFRA altitude UI.

### Item B: Exemption rules (needed before Phase 3)
- **Status:** Partially verified. DAFMAN 36-2905 §3.9 confirms exemption scoring for AF Form 469.
  Walk-only members are component exempt for cardiorespiratory. Further implementation detail
  (medical, deployment, pregnancy categories) not fully captured in the 13-page excerpt.
- **Current behavior:** The app shows Exempt options in each component selector. PFRA exemptions
  zero-out the component; the exempt member's other components are scored normally.
- **Action:** Current exemption behavior is directionally correct per §3.9. Full audit of all
  exemption categories should be completed before Phase 3 if behavior changes are needed.

### Item C: DAFMAN 36-2905 source PDFs — RESOLVED (2026-05-11)
- **Status:** DONE. Pages from DAFMAN 36-2905 (13 pages, Chapter 3) and Attachment 3 (2 pages)
  downloaded and saved to `standards/sources/`. OCR extracted to
  `standards/sources/extracted-text/`. Full audit in `docs/source-extracts/fitness-guidance-source-audit.md`.
- **No further action required** for Items A and C. Audit may be extended if deeper policy
  coverage is needed for exemptions (Item B).

---

## 4. What Can Be Removed (after source verification)

| Item | Remove when |
|------|-------------|
| "Legacy" option in `#standards-mode` | Phase 1 |
| Legacy mode branching in `pfra-calculator.js` | Phase 1 |
| Legacy score arrays in `main2.js` (lines 52–3640) | Phase 5 |
| Legacy event handlers (slider, text input, tick binding) | Phase 3 |
| `window.afptLegacy` export | Phase 5 |
| `window.syncPfraFromLegacy` bridge | Phase 1 |
| `pfra-calculator.js` entirely | Phase 4 |
| `main2.js` | Phase 5, after all handlers migrated |

**Do NOT remove:** Altitude charts (`runAltitudeAdjust.webp`, `walkAltitudeAdjust.webp`),
`#alt-select`, or any altitude-related assets. Altitude adjustment is a confirmed current-standard
requirement (Item A resolved). These assets are replaced by PFRA altitude implementation in
Phase A — they are not removed until that implementation is complete and tested.

---

## 5. Phased Implementation

### Phase E (current — complete before starting migration)
Move cardio controls into `#cardio-editor`. Remove old stacked cardio sections. This is the
last component editor phase and gives the PFRA controller full DOM ownership of all inputs.

**Exit criteria:** All push/sit/run controls are in their component editors. No stacked
legacy sections remain below `#active-component-editor`.

---

### Source verification checkpoint — COMPLETE (2026-05-11)
Items A and C are resolved. Item B (exemption categories) is directionally verified and does not
block Phase A or Phase 1. Proceed to Phase A.

---

### Phase A — Implement Altitude Adjustment in PFRA Scoring
**Status: COMPLETE (2026-05-11).**

Altitude adjustment is mandated by DAFMAN 36-2905, Attachment 3. It must be implemented in
the PFRA scoring engine before legacy altitude code (`calculateAltitudeDiff()` in `main2.js`)
can be removed.

**Source:** `docs/source-extracts/fitness-guidance-source-audit.md`, confirmed from
`standards/sources/Pages from DAFMAN 36-2905-2.pdf` (Attachment 3).

**Altitude bands:**

| Group | Range |
|-------|-------|
| 0 (no adjustment) | < 5,250 ft |
| 1 | 5,250 – 5,499 ft |
| 2 | 5,500 – 5,999 ft |
| 3 | 6,000 – 6,599 ft |
| 4 | ≥ 6,600 ft |

**Events covered:**
- 2.0-mile run: time added in seconds per group (Table A3.1)
- 2.0-km walk, male: adjusted maximum walk time per group × age bracket (Table A3.2)
- 2.0-km walk, female: adjusted maximum walk time per group × age bracket (Table A3.3)
- 20-meter HAMR: shuttles added per group (+1 / +2 / +3 / +4) (Table A3.4)

**Events not covered by altitude:** Body composition, muscular strength, core endurance.

**Implementation steps:**

1. **Extract altitude tables to JSON**
   - Create `standards/extracted/tables/altitude-run.json` — per-group time adjustment for each
     performance time row in the 2-mile run table (Table A3.1). Source: OCR text + manual
     verification against the PDF.
   - Create `standards/extracted/tables/altitude-walk-male.json` and
     `altitude-walk-female.json` — maximum walk times by age bracket × group (Tables A3.2–A3.3).
   - Create `standards/extracted/tables/altitude-hamr.json` — shuttles to add per group (Table A3.4).
   - Note: OCR of Table A3.1 (run correction seconds) was partially garbled. Manually verify
     values against the PDF before writing the JSON. The walk and HAMR tables OCR'd cleanly.

2. **Add source-backed fixture tests**
   - Add altitude adjustment examples to `tools/fixtures/pfra-scoring-examples.json` (or a
     dedicated `altitude-adjustment-examples.json`).
   - Each fixture must specify: event, altitude group, input performance, expected adjusted value,
     and source document + table reference.
   - At minimum: one example per event per altitude group (≥ 16 examples total).

3. **Implement in `src/pfra/scoring.mjs`**
   - Add `getAltitudeGroup(altitudeFt)` — returns group 0–4.
   - Add `applyRunAltitudeAdjustment(timeSec, altGroup)` — adds seconds from altitude-run table.
   - Add `applyWalkAltitudeAdjustment(maxTimeSec, sex, ageGroup, altGroup)` — returns adjusted
     max walk time; used in `scoreWalk()` to shift the pass/fail threshold.
   - Add `applyHamrAltitudeAdjustment(shuttles, altGroup)` — adds shuttles from altitude-hamr table.
   - Modify `scoreRun()`, `scoreWalk()`, `scoreHamr()` to accept an optional `altitudeGroup`
     parameter (default 0 = no adjustment). This keeps the function signatures backwards-compatible
     with existing fixture tests.
   - All adjustment logic must have 100% coverage from the fixture suite before merging.

4. **Wire altitude into the UI (cardio editor)**
   - `#alt-select` already exists in the DOM. After Phase E moves cardio controls into
     `#cardio-editor`, move `#alt-select` into `#cardio-editor` as well (or into a dedicated
     altitude sub-section of the cardio editor).
   - `src/pfra/app.mjs` (Phase 2) will read `#alt-select` and pass `altitudeGroup` to scoring.
   - For Phase A specifically: the goal is the scoring engine and test coverage. UI wiring can be
     deferred to Phase 3 (input ownership transfer), provided legacy altitude UI is not removed
     before Phase 3 is complete.

**Exit criteria:**
- Altitude JSON tables exist in `standards/extracted/tables/`.
- Fixture tests for altitude pass.
- `scoreRun()`, `scoreWalk()`, `scoreHamr()` accept altitude group and return correct adjusted values.
- `npm test` passes (all 98 existing + new altitude fixtures).
- No change to the UI or DOM in this phase.

---

### Phase 1 — Remove Legacy Mode from the UI
**Scope:** Product decision, UI only.

1. Remove the "Legacy" `<option>` from `#standards-mode` in `index.html`.
2. Remove all `isPfraModeActive()` branching from `pfra-calculator.js` (always true now).
3. Remove `restoreLegacyMainScore()` and legacy-exit `ageSexChange()` call.
4. Remove `window.syncPfraFromLegacy` (main2.js no longer needs to call back).
5. Remove `runLegacyRegression` from browser regression tests (or mark skipped until Phase 5).
6. Update score header to remove "Legacy" mode label.

**Does not touch:** Altitude selector, altitude charts, main2.js event handlers, scoring logic.

**Exit criteria:** `npm test` passes. No "Legacy" option visible. PFRA is always active.

---

### Phase 2 — Create PFRA-Only Controller (`src/pfra/app.mjs`)
**Scope:** New file only, no deletions.

Create `src/pfra/app.mjs` that owns the entire PFRA scoring loop:
- `state`: `{sex, ageGroup, strength, core, cardio, whtr, exemptions}`
- `dispatch(action)` — actions per component
- After each dispatch: calls `scorePfraAssessment()`, updates all output elements
- Does not call any `main2.js` function or `window.afptLegacy.*`
- Exposes `window.afptApp` for tests

Add script tag to `index.html`. Run alongside `pfra-calculator.js` temporarily for comparison.

**Exit criteria:** `npm test` passes. `window.afptApp.dispatch()` correctly scores all events.

---

### Phase 3 — Transfer Input Ownership per Component
**Scope:** One component at a time. Each is a separate commit.

For strength, then core, then cardio:
1. Add event listeners in `src/pfra/app.mjs` for that component's controls.
2. Remove the corresponding handlers from `main2.js`.
3. Remove the corresponding `handleLegacyControlChange` listeners from `pfra-calculator.js`.
4. Wire threshold ticks via `updateThresholdTick()` in `src/pfra/ui.mjs` only — no more
   `window.afptLegacy.bindSliderTickClick`.
5. Update browser regression tests for that component to call `window.afptApp.dispatch()`.

**Invariant:** Same inputs must produce same PFRA score before and after each swap.
Use existing fixture suite as oracle.

**Exit criteria:** No component input events handled by `main2.js`. `npm test` passes.

---

### Phase 4 — Remove pfra-calculator.js Bridge
**Scope:** Delete the bridge once `src/pfra/app.mjs` owns everything.

1. Verify nothing remains in `pfra-calculator.js` that `src/pfra/app.mjs` does not cover.
2. Remove `<script src="./pfra-calculator.js">` from `index.html`.
3. Delete `pfra-calculator.js`.
4. Update `src/pfra/dom.mjs` to remove any legacy control references no longer needed.
5. Update tests to remove `pfra-calculator.js`-specific expectations.

**Exit criteria:** `npm test` passes without `pfra-calculator.js` loaded.

---

### Phase 5 — Remove main2.js
**Scope:** Delete the legacy file.

1. Grep for all remaining `window.afptLegacy.*`, `window.syncPfraFromLegacy`,
   `window.updateScoreMinMaxText`, `window.ageSexChange` references. All must be gone.
2. Remove `<script src="./main2.js">` from `index.html`.
3. Delete `main2.js`.
4. Remove `main2.js` from SW cache (rebuild `sw.js`).
5. Update `validate-pwa-cache.mjs` required file list.
6. Remove `runLegacyRegression` from browser regressions if still present.

**Exit criteria:** `npm test` passes. `main2.js` not loaded. No orphaned legacy globals.

---

### Phase 6 — Clean Residue from PFRA Modules
**Scope:** Remove legacy-bridge symbols that no longer serve a purpose.

1. Remove legacy-mapping functions from `src/pfra/state.mjs` that only existed for
   `pfra-calculator.js` bridging, if `src/pfra/app.mjs` does not use them.
2. Remove legacy control references from `src/pfra/dom.mjs` if no longer referenced.
3. Update browser regression tests to PFRA-only behavior.
4. Update `SOURCE_OF_TRUTH_MANIFEST.md` to reflect final state.

**Exit criteria:** `npm test` passes. No `legacy*` symbols in active PFRA module exports.

---

### Phase 7 — PWA Cleanup and Final Docs
1. Rebuild `sw.js` to remove deleted files.
2. Update `validate-pwa-cache.mjs` required asset list.
3. Update `CLAUDE.md`, `docs/TODO.md`, `docs/SESSION_LOG.md`.
4. Remove altitude charts from SW cache if source verification (Item A) confirmed no
   altitude in current guidance.

**Exit criteria:** `npm test` passes. Cache validates with correct file count.

---

## 6. Risks and Rollback

### Risk 1: Altitude removed before PFRA implementation is complete (high)
Altitude adjustment is a **confirmed requirement** of DAFMAN 36-2905 (Item A resolved). Removing
`#alt-select`, altitude chart assets, or `calculateAltitudeDiff()` in `main2.js` before Phase A
is complete would silently drop a mandatory feature.
**Mitigation:** Phase A is a hard gate before Phase 1 touches the altitude path. The "Do NOT
remove" note in Section 4 makes this explicit. Never remove altitude-related assets or code
without first verifying that the PFRA altitude implementation in `src/pfra/scoring.mjs` is
tested and wired to the UI.

### Risk 2: Scoring regression during handler transfer (high)
Moving event ownership component by component risks subtle normalization differences.
**Mitigation:** Use 98-example fixture suite as oracle. Consider running old and new handlers
in parallel during Phase 3 and logging discrepancies to the console before removing old ones.

### Risk 3: PWA cache invalidation (low)
Deleting files changes the SW manifest; users with old SW may get stale responses.
**Mitigation:** Bump cache version in `build-sw.mjs` at each phase that removes files.
`pwa.js` already handles update detection.

### Rollback
Any phase can be rolled back to the restore tag:
```bash
git checkout pre-pfra-only-migration
```
Each phase is committed separately. Individual phase commits can be reverted without
affecting later phases if they have no forward dependencies.

---

## Appendix: Archived PFRA_ONLY_MIGRATION_PLAN.md framing note

The original plan (commit `9ed7e8d`) framed the goal as "PFRA-only" and treated altitude
adjustment as a "gap" that might be removed if inconvenient. That framing was wrong.
The correct framing: the app implements **current official USAF fitness guidance**. Features
stay or go based on what the official documents require, not on implementation convenience.
The old plan is preserved in git history at `9ed7e8d` for reference.
