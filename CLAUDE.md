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

## Current Next Phase

**Phase 7A — Body composition card shell** (`bodyCompositionCard` slot)

- Wrap/move real `#pfra-whtr` input and `#pfra-body-score` output into a `bodyCompositionCard` slot.
- Preserve existing IDs and event bindings.
- Add styling hooks for `light-clean`, `tactical-dense`, `stencil-clipped`, `blues-polished`, `fitness-gradient-card` variants.
- Ensure all five theme presets resolve to a valid `bodyCompositionCard` variant.
- Add browser regression checks: WHtR visible in PFRA mode, changes update score, score header mirrors update, theme switching preserves value, Legacy/PFRA switching works.

Recommended card order after body composition: strength → core → cardio (most complex last).

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
