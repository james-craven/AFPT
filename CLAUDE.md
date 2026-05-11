# CLAUDE.md

## Project

AFPTCalc is a static, mobile-first USAF fitness/PFRA calculator hosted on GitHub Pages as an offline-capable PWA. Built with vanilla HTML, CSS, and ES modules — no framework.

The redesign goal is a modular UI variant system:

```
standards data → pure scoring functions → app state → slot variant renderers → event bindings
```

One calculator engine. Shared state/actions. Named layout slots. Registered variants. Theme presets. Future user overrides.

## Design Reference

Mock files live in `design-reference/`:
- `shared.jsx` — theme palettes (`THEMES`), CSS custom property token names, shared primitives
- `mock-tactical.jsx`, `mock-stencil.jsx`, `mock-blues.jsx`, `mock-light.jsx`, `mock-fitness.jsx` — per-theme layout layouts

**Read these files before any visual UI implementation.** They define the visual language and CSS token system the production code should implement.

Rules:
- Do not import React, Babel, CDN scripts, or mock seed data (`AFPT_DATA`) into production.
- Use `design-reference/` as a read-only visual specification.
- Use `shared.jsx`'s `THEMES` object as the authoritative source for CSS custom property values (`--bg`, `--panel`, `--ink`, `--accent`, etc.).
- Font stacks must fall back to system fonts (app is offline-first — no hard remote font dependencies).

See `docs/VISUAL_ALIGNMENT_AUDIT.md` for the current gap analysis.

## Non-Negotiables

- No React, TypeScript, Babel-in-browser, CDN runtimes, server, database, or framework.
- Keep vanilla JavaScript, CSS, and ES modules.
- Keep GitHub Pages / static hosting.
- Preserve PWA/offline behavior (`pwa.js`, `sw.js`, Workbox).
- Preserve legacy calculator access (`main2.js`, `window.afptLegacy`).
- Do not duplicate scoring logic.
- Do not change PFRA scoring/standards unless explicitly tasked.
- Existing app behavior is the source of truth.
- Mock `.jsx` files are visual references only — do not ship React, CDN, or stub data from them.
- Theme variants render state and dispatch actions; they do not own scoring.

## Current Architecture

Key files:

| File | Role |
|---|---|
| `index.html` | App shell |
| `style.css` | Visual structure |
| `main2.js` | Legacy calculator, sliders, chart wiring, `window.afptLegacy` |
| `pfra-calculator.js` | PFRA UI adapter |
| `pwa.js` | Service-worker registration and update flow |
| `sw.js` | Generated, checked in for GitHub Pages |
| `src/pfra/scoring.mjs` | Pure PFRA scoring functions (no DOM) |
| `src/pfra/standards.mjs` | PFRA standards/table loading |
| `src/pfra/dom.mjs` | PFRA DOM lookup |
| `src/pfra/state.mjs` | PFRA defaults, labels, event mapping |
| `src/pfra/ui.mjs` | PFRA rendering helpers |
| `src/ui/layout-variants.mjs` | Layout slots, variant registry, theme presets |
| `src/ui/theme-controller.mjs` | Applies active preset via `data-theme` / `data-theme-preset` |
| `src/ui/settings-hub.mjs` | Settings drawer, open/close, keyboard |
| `src/ui/score-header.mjs` | `scoreHeader` slot — mirrors `#score-txt` |
| `src/ui/lap-display.mjs` | `lapDisplay` slot — mirrors `#run-lap-times` |
| `src/ui/chart-drawer.mjs` | `chartDisplay` slot — wraps `#modal` / `#modal-img` |
| `standards/af-pfra-2026.json` | PFRA source metadata |
| `standards/extracted/tables/*.json` | Generated PFRA scoring tables |

Legacy scoring boundary: `window.afptLegacy` exposes `ageSexChange`, `bindSliderTickClick`, `changeLapTime`, `changeTxtboxes`, `runSelChange`, `updateScoreMinMaxText`. New code should prefer this over raw globals.

## Completed Redesign Phases

- **Phase 1** — Theme/variant foundation: layout slots, variant registry, five theme presets, CSS tokens, `data-theme` attribute, safe preset selector.
- **Phase 2** — Settings hub: replaced hamburger checkbox with `src/ui/settings-hub.mjs`; preserved existing menu function IDs.
- **Phase 3** — Score header: `src/ui/score-header.mjs` mirrors `#score-txt`; foundation styles for all five `scoreHeader` variants.
- **Phase 4** — Header demographics: real `#sex-sel`, `#age-sel`, `#standards-mode` moved (not mirrored) into header; existing event bindings preserved.
- **Phase 5** — Lap display: `src/ui/lap-display.mjs` mirrors `#run-lap-times`; foundation renderers for all five `lapDisplay` variants.
- **Phase 6** — Chart drawer: `src/ui/chart-drawer.mjs` wraps `#modal`/`#modal-img` in drawer shell; chart image sources remain in legacy handlers.
- **Component Editor Phase A** — `#component-summary-strip` with PUSH/CORE/RUN summary buttons; `src/ui/component-editor.mjs` with `selectedComponent` state and variant wiring.
- **Component Editor Phase B** — `#active-component-editor` container with three empty panels (`#strength-editor`, `#core-editor`, `#cardio-editor`); panel switching via `selectComponent()`.
- **Component Editor Phase C** — Real strength controls moved into `#strength-editor` (`.strength-txt`, `.push-sel-chart`, `.push-slide` with all IDs preserved). Old `#strength-card` removed. `strength-card.mjs` script tag removed (file kept on disk).
- **Component Editor Phase D** — Real core controls (`.situp-txt`, `#sit-sel-chart-section`, `.sit-slide` with all IDs preserved) moved into `#core-editor`. Old stacked core sections removed. `#pfra-core-score` added (already wired in `pfra-calculator.js`). CSS app-column rule updated; `#core-editor` scoped overrides added.

## Layout Slots (from `docs/LAYOUT_VARIANT_SYSTEM.md`)

`appShell` · `scoreHeader` · `demographicsControls` · `standardsSwitcher` · `settingsPanel` · `bodyCompositionCard` · `strengthCard` · `coreCard` · `cardioCard` · `lapDisplay` · `chartDisplay` · `inputControls` · `componentScoreDisplay` · `navigationPattern`

## Theme Presets

`tactical` · `light` · `stencil` · `blues` · `fitness`

A theme preset chooses a variant for each slot. A future user customization overrides individual slots. Neither owns scoring.

## Required Gate (before every commit/push)

```bash
npm test
git diff --check
git status
```

`npm test` runs:
1. PFRA scoring fixtures (98 examples)
2. Service-worker build (`sw.js`)
3. PWA cache validation (81 files, 28 required offline assets)
4. Browser regression suite

Push normally to `master` only if tests pass. Never force push.

## Current State (as of Phase D completion)

- `#strength-editor` contains the real strength controls. `#strength-card` is gone.
- `#core-editor` contains the real core controls. Old stacked core sections are gone. `#pfra-core-score` exists and is wired.
- `#cardio-editor` exists in the DOM but is empty — real Cardio controls are still in their old stacked section below.
- Do not visually polish component editors yet.

## Current Next Phase

**Component Editor Phase E — Move Cardio controls into `#cardio-editor`**

Move these existing elements into `#cardio-editor` (keep all IDs and event bindings):
- `.run-txt` section containing `#run-txt-p`
- `.run-sel-chart` section containing `#run-sel`, `#run-btn`, `#run-txt`
- `.run-slide` section containing `#run-slider` and `#run-tick`

Also add inside `#cardio-editor`:
- A `component-editor__header` div with:
  - `component-editor__title` span: "RUN"
  - `component-editor__pfra-score` span with id `pfra-cardio-score` (hidden outside PFRA mode, same CSS rule as `#pfra-strength-score` and `#pfra-core-score`)

After moving:
- Remove the old stacked cardio section elements from the DOM.
- Remove `.run-txt,`, `.run-sel-chart,`, `.run-slide,` from the shared app-column CSS rule (if present).
- Add `#cardio-editor` scoped overrides mirroring the pattern used for `#strength-editor` and `#core-editor`.
- Check `pfra-calculator.js` / `dom.mjs` for any `#pfra-cardio-score` references — wire it up if the ID already exists there.
- Update browser regression tests:
  - Chart shortcut test for `#run-btn` needs to switch to cardio first.
  - Legacy/PFRA run interactions need to switch to cardio first.
  - Add `assertCardioEditor(page)`: switch to cardio, verify `#pfra-cardio-score` visible in PFRA mode, exercise run input, check score header mirrors total.

Rules:
- Preserve all IDs and event bindings.
- Do not duplicate controls.
- Do not change scoring logic.
- Do not visually polish editors.
- Run `npm test`, `git diff --check`, commit and push.

## Key Docs

| Doc | Purpose |
|---|---|
| `docs/PROJECT_OVERVIEW.md` | Goals, current shape, risks |
| `docs/ARCHITECTURE_TARGET.md` | Target data flow, layer rules, constraints |
| `docs/LAYOUT_VARIANT_SYSTEM.md` | Slot definitions, variant rules, render contract |
| `docs/UI_IMPLEMENTATION_PHASES.md` | Phase sequence and done criteria |
| `docs/FEATURE_PARITY_MATRIX.md` | Per-feature status and verification |
| `docs/THEME_PARITY_MATRIX.md` | Per-slot per-theme parity status |
| `docs/MOCK_IMPLEMENTATION_MAP.md` | Mock takeaways; what not to copy |
| `docs/UI_TEST_PLAN.md` | Browser regression test plan |
| `docs/LEGACY_BOUNDARIES.md` | What `main2.js` owns; PFRA module boundaries |
| `docs/SESSION_LOG.md` | Chronological change log |
| `docs/TODO.md` | Active migration queue |
