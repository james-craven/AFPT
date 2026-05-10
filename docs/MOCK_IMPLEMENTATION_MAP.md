# Mock Implementation Map

## Design Source Summary

The uploaded mock describes a unified phone artboard with five visual themes:

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

All referenced layout files are now available in Downloads and have been reviewed.

## Layout Takeaways

| Mock | Useful Production Ideas | Cautions |
|---|---|---|
| Tactical HUD | Dense score header, always-visible sex/age/standard controls, component tabs, visible altitude control, full 8-row lap plan with pace bars | Strong tactical styling may be too intense as the only default |
| Stencil Ops | Clear status threshold bar, strong chart button placement, compact settings drawer, lap bar chart | Heavy stencil styling and clip-path cards should be theme-only |
| AF Dress Blues | Score ring/dial, polished component cards, stepper controls, visible altitude, clean lap table | Ring and stepper controls may add complexity before parity |
| Connect Light | Most production-friendly card style, readable score card, clean active editor, simple lap rows | Settings drawer should not hide controls that need to stay visible |
| Fitness Gradient | Strong score ring and compact lap tiles | Gradient/glass styling is more expressive than utilitarian and should be optional |

Primary implementation recommendation: start with a Tactical/Connect hybrid. Keep the Tactical information density and visible controls, but use the quieter Connect Light card language as the default visual finish.

## Production Mapping

| Mock Concept | Production Meaning | Implementation Direction |
|---|---|---|
| Score header | Current total score and category | Render from `updateScoreMinMaxText` for legacy and `renderPfraMainScore`/PFRA result for PFRA |
| Status badge | Excellent/Satisfactory/Unsatisfactory/pass/fail state | Derive from real score/category, not mock `status` |
| Sex selector | Current `#sex-sel` | Move visually into header while keeping state wiring |
| Age selector | Current `#age-sel` | Move visually into header while keeping age mapping |
| Standard selector | Current `#standards-mode` | Keep Legacy/PFRA switch visible |
| Component cards | Current strength/core/cardio/body sections | Wrap existing controls into body, strength, core, and cardio cards |
| Slider + field controls | Existing range and text inputs | Preserve synchronization and min tick behavior |
| Run timing/lap display | `#run-lap-times` legacy 6-lap and PFRA 8-lap renderers | Place in cardio card details area |
| Score chart drawer | Current chart modal and mock `ChartDrawer` | Build a vanilla drawer; initially reuse existing chart image assets |
| Settings button | Mock header gear | Open a vanilla settings drawer/modal for install, audio, updates, dev build, and future theme |
| Theme selector | Mock `ThemeSwitcher` | Optional first-class setting after parity; use CSS variables only and keep the same layout |
| Legacy/PFRA switching | Current standards selector | Keep as production mode control, not a theme |
| PWA/offline support | Current service worker and manifest | Leave runtime behavior unchanged; restyle prompts only after tests pass |

## What To Borrow Carefully

### Theme Tokens

The mock's `THEMES` object is a good source of names and color relationships:

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

Production should translate these into CSS variables in `style.css`, with a default theme first. Do not ship remote Google Fonts as a hard dependency for the offline app unless they are bundled or replaced by system fonts.

### Score Chart Drawer

The mock drawer is useful as an interaction model, but its rows are generated from demo data. Production options:

1. First parity: drawer opens the same chart image currently shown in `#modal-img`.
2. Later upgrade: drawer renders structured PFRA table rows from `standards/extracted/tables/*.json`.
3. Legacy charts remain image-based until legacy tables move to versioned data.

### Component Cards

Cards should be functional containers, not decorative wrappers around disconnected demo values. Each card should show:

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
- Theme dots that swap entire layouts. Production theme dots should change appearance only.
- Mock settings rows that are placeholders rather than real app behavior.

## Suggested Production DOM Strategy

Prefer one of these low-risk approaches:

1. Keep existing element IDs and move/reshape markup carefully so current event bindings survive.
2. If markup must change, update `src/pfra/dom.mjs`, `main2.js`, and `tools/browser-regression.mjs` together in the same phase.
3. Add new wrapper elements/classes around existing inputs before deleting old sections.
4. Remove old markup only when the parity matrix row for that feature is implemented and tested.

## Mock-Specific Decisions

- Frame toggle: mock-only.
- Layout-per-theme: mock-only.
- Settings gear: planned production feature.
- Theme dots: optional production feature after parity.
- Visible demographics row: planned production feature.
- Score chart drawer: planned production feature.
- Five theme palettes: optional source for future themes; start with one default production layout.
- Default layout direction: Tactical/Connect hybrid.
