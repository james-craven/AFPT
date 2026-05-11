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

The PFRA Scoring Charts (effective 1 Mar 2026, verified locally) specify:

| Component | Events | Max points |
|-----------|--------|------------|
| Body composition | WHtR | 20 |
| Muscular strength | Push-up, Hand-release push-up | 15 |
| Core endurance | Sit-up, Cross-leg reverse crunch, Forearm plank | 15 |
| Cardiorespiratory | 2-mile run, 20-meter HAMR, 2km walk (pass/fail) | 50 |

All of these are already implemented with extracted tables and fixture tests.

---

## 3. Open Source Verification Items

These items require a human to manually review official PDFs before implementation decisions
are made. See `docs/SOURCE_OF_TRUTH_MANIFEST.md` for the full audit.

### Item A: Altitude adjustment (blocking for #alt-select removal)
- **Status:** Not present in PFRA Scoring Charts. DAFMAN 36-2905 not yet reviewed.
- **Action:** Do not remove `#alt-select`, `runAltitudeAdjust.webp`, or `walkAltitudeAdjust.webp`
  until DAFMAN 36-2905 has been manually downloaded and searched for altitude guidance.
- **If altitude is in current guidance:** Implement in `src/pfra/scoring.mjs` with fixture tests.
- **If altitude is absent from current guidance:** Remove legacy altitude behavior and document
  the removal in `SOURCE_OF_TRUTH_MANIFEST.md`.

### Item B: Exemption rules (needed before Phase 3)
- **Status:** Not verified against DAFMAN 36-2905.
- **Current behavior:** The app shows Exempt options in each component selector. PFRA exemptions
  zero-out the component; the exempt player's other components are scored normally.
- **Action:** Verify exemption rules (medical, deployment, pregnancy) against DAFMAN 36-2905
  before implementing a PFRA-only exemption controller.

### Item C: DAFMAN 36-2905 and DTM download
- **Status:** AFPC blocks automated PDF downloads.
- **Action required (human):**
  1. Open `https://www.afpc.af.mil/Portals/70/documents/FITNESS/afman36-2905.pdf` in a browser.
  2. Save to `standards/sources/dafman36-2905.pdf`.
  3. Search for altitude, elevation, 5250, 5500, 6000, 6600, adjustment.
  4. Update `SOURCE_OF_TRUTH_MANIFEST.md` with the finding.

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
| Altitude charts and `#alt-select` | After Item A verified absent from current docs |
| `main2.js` | Phase 5, after all handlers migrated |

---

## 5. Phased Implementation

### Phase E (current — complete before starting migration)
Move cardio controls into `#cardio-editor`. Remove old stacked cardio sections. This is the
last component editor phase and gives the PFRA controller full DOM ownership of all inputs.

**Exit criteria:** All push/sit/run controls are in their component editors. No stacked
legacy sections remain below `#active-component-editor`.

---

### Source verification checkpoint (between Phase E and Phase 1)
Complete Items A, B, and C above before proceeding. Record findings in
`SOURCE_OF_TRUTH_MANIFEST.md`. This takes a human with browser access to the AFPC PDFs —
it cannot be automated.

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

### Risk 1: Altitude/exemption policy not verified before code removal (high)
Removing `#alt-select` or exemption behavior before DAFMAN 36-2905 is reviewed may remove a
requirement from the current standard.
**Mitigation:** The interim rule in `SOURCE_OF_TRUTH_MANIFEST.md` blocks this. Items A and B
are gates before Phase 1 touches altitude or exemptions.

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
