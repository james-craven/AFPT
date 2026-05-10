# Mock Implementation Map

## Design Reference Location

Mock files are now in `design-reference/` in the repo root:

- `shared.jsx` — theme palettes (`THEMES`), CSS custom property token names (`--bg`, `--panel`, `--ink`, `--accent`, etc.), shared primitives (ThemeSwitcher, ChartDrawer, DemographicsRow)
- `mock-tactical.jsx` — Tactical HUD layout
- `mock-stencil.jsx` — Stencil Ops layout
- `mock-blues.jsx` — AF Dress Blues layout
- `mock-light.jsx` — Connect Light layout
- `mock-fitness.jsx` — Fitness Gradient layout

**Read these files before implementing any visual UI phase.** Do not copy React, Babel, CDN scripts, or `AFPT_DATA` mock values into production.

See `docs/VISUAL_ALIGNMENT_AUDIT.md` for gap analysis between current implementation and mock intent.

## Design Source Summary

The uploaded mock describes a unified phone artboard with five visual presets:

- Tactical HUD
- Stencil Ops
- AF Dress Blues
- Connect Light
- Fitness Gradient

The available mock files provide:

- A React/Babel HTML shell with theme and frame switching.
- Shared theme palettes in `THEMES`.
- Shared demo data in `AFPT_DATA`.
- Shared primitives for theme dots, frame toggle, demographics row, and score chart drawer.
- iOS and Android presentation frames.
- Five concrete layouts: Tactical HUD, Stencil Ops, AF Dress Blues, Connect Light, and Fitness Gradient.

Production should treat those mocks as variant inspiration, not as separate app implementations.

## Core Mapping Rule

One shared calculator behavior/state/scoring system feeds many interchangeable visual renderers.

Themes are presets. Variants are renderers for slots. User customization later overrides slot choices.

## Variant Slot Map

| Slot | Tactical | Stencil | Blues | Connect Light | Fitness |
|---|---|---|---|---|---|
| `scoreHeader` | `tactical-score-number` | `stencil-score-block` | `blues-ring` | `light-card` | `fitness-gradient-ring` |
| `componentCard` | `tactical-dense` | `stencil-clipped` | `blues-polished` | `light-clean` | `fitness-gradient-card` |
| `lapDisplay` | `tactical-horizontal-bars` | `stencil-vertical-bars` | `blues-table` | `light-rows` | `fitness-tiles` |
| `settingsPanel` | `tactical-panel` | `stencil-compact-panel` | `blues-drawer` | `light-drawer` | `fitness-glass-drawer` |
| `chartDisplay` | `tactical-drawer` | `stencil-drawer` | `blues-chart-drawer` | `light-chart-drawer` | `fitness-glass-chart` |
| `inputControls` | `slider-plus-field` | `tap-edit-plus-slider` | `stepper-plus-slider` | `numeric-field-plus-slider` | `tap-edit-plus-slider` |
| `componentScoreDisplay` | `hud-chip` | `stencil-points` | `progress-strip` | `clean-chip` | `gradient-chip` |
| `demographicsControls` | `visible-compact-selects` | `visible-shared-row` | `visible-shared-row` | `visible-shared-row` | `visible-glass-selects` |

## Layout Takeaways

| Mock | Useful Production Ideas | Cautions |
|---|---|---|
| Tactical HUD | Dense score header, always-visible sex/age/standard controls, component tabs, visible altitude control, full 8-row lap plan with pace bars | Styling should be a preset, not the only default |
| Stencil Ops | Clear status threshold bar, strong chart button placement, compact settings drawer, lap bar chart | Heavy stencil styling and clipped cards should remain variants |
| AF Dress Blues | Score ring/dial, polished component cards, stepper controls, visible altitude, clean lap table | Ring and stepper controls need careful mobile space and accessibility checks |
| Connect Light | Most production-friendly card style, readable score card, clean active editor, simple lap rows | Must not hide required controls in settings |
| Fitness Gradient | Strong score ring and compact lap tiles | Gradient/glass styling should be optional and tested for readability |

## Production Mapping

| Mock Concept | Production Meaning | Implementation Direction |
|---|---|---|
| Theme dots | Preset selector | Resolve a theme preset into slot variants; do not load separate calculator pages |
| Score header | Current total score and category | Implemented through `src/ui/score-header.mjs`; mirrors `#score-txt` using selected `scoreHeader` variant |
| Status badge | Excellent/Satisfactory/Unsatisfactory/pass/fail state | Derives from real `#score-txt` output, not mock `status` |
| Sex selector | Current `#sex-sel` | Moved real control into header; future `demographicsControls` variants should keep same behavior |
| Age selector | Current `#age-sel` | Moved real control into header; future `demographicsControls` variants should keep age mapping |
| Standard selector | Current `#standards-mode` | Moved real control into header; future `standardsSwitcher` variants should keep Legacy/PFRA behavior |
| Component cards | Current body/strength/core/cardio sections | Render through card variants using real component data |
| Slider + field controls | Existing range and text inputs | Render through input-control variants; preserve synchronization and min tick behavior |
| Run timing/lap display | `#run-lap-times` legacy 6-lap and PFRA 8-lap renderers | Implemented through `src/ui/lap-display.mjs`; mirrors the existing rendered lap text through selected `lapDisplay` variant |
| Score chart drawer | Current chart modal and mock `ChartDrawer` | Implemented through `src/ui/chart-drawer.mjs`; reuses existing chart image assets |
| Settings button | Mock header gear | Shared settings hub now preserves real install/audio/update/dev controls; theme-specific `settingsPanel` variants come later |
| Legacy/PFRA switching | Current standards selector | Keep as production mode control, not a visual theme |
| PWA/offline support | Current service worker and manifest | Leave runtime behavior unchanged; restyle prompts only after tests pass |

## What To Borrow Carefully

### Theme Tokens

The mock's `THEMES` object is a useful source of color relationships:

- `--bg`
- `--panel`
- `--panel-2`
- `--border`
- `--border-strong`
- `--ink`
- `--ink-dim`
- `--accent`
- `--accent-2`
- `--warn`
- `--bad`

Production should translate these into CSS variables in `style.css`. Do not ship remote Google Fonts as a hard dependency for the offline app unless they are bundled or replaced by system fonts.

### Score Chart Drawer

The mock drawer is useful as an interaction model, but its rows are generated from demo data. Production options:

1. First parity: drawer opens the same chart image currently shown in `#modal-img`.
2. Later upgrade: drawer renders structured PFRA table rows from `standards/extracted/tables/*.json`.
3. Legacy charts remain image-based until legacy tables move to versioned data.

### Component Cards

Cards should be functional containers, not decorative wrappers around disconnected demo values. Each card variant must expose:

- Event selector.
- Current performance input.
- Slider or time entry control.
- Current component score.
- Minimum and maximum values.
- Exempt state where available.
- Chart drawer entry.

## What Not To Copy

- `AFPT_DATA` scores, component values, lap data, or standard names.
- React component structure.
- Babel-in-browser scripts.
- `DesignCanvas`, `DCSection`, `DCArtboard`, post-it notes, or artboard state.
- iOS/Android device frames and frame toggle.
- The chart row generator inside mock `ChartDrawer`.
- Five duplicated full-page calculators.
- Mock settings rows that are placeholders rather than real app behavior.

## Suggested Production DOM Strategy

Prefer one of these low-risk approaches:

1. Keep existing element IDs until a shared action contract can replace direct DOM dependencies.
2. Add wrapper elements/classes around existing inputs before deleting old sections.
3. If markup must change, update `src/pfra/dom.mjs`, `main2.js`, and `tools/browser-regression.mjs` together in the same phase.
4. Remove old markup only when the parity matrix row for that feature is implemented and tested across the active preset.

## Mock-Specific Decisions

- Frame toggle: mock-only.
- Theme presets: implemented as the preset registry and current settings selector.
- Layout-per-theme hardcoded pages: mock-only.
- Settings gear: implemented as the settings/control hub foundation.
- Theme dots: represented by the current preset selector until a polished control is added.
- Visible demographics row: implemented by moving the real controls into the header area.
- Score chart drawer: implemented as an image-source-preserving drawer foundation.
- User slot overrides: planned later, after presets are implemented.
