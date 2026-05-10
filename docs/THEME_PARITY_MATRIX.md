# Theme Parity Matrix

Themes are presets over layout variants, not isolated calculator implementations.

Every theme preset must expose the same calculator capabilities, even when the presentation differs.

## Preset Slot Matrix

| Slot | Tactical HUD | Stencil Ops | AF Dress Blues | Connect Light | Fitness Gradient | Required Parity |
|---|---|---|---|---|---|---|
| `appShell` | `tactical-shell` | `stencil-shell` | `blues-shell` | `light-shell` | `fitness-shell` | Loads on mobile and desktop |
| `scoreHeader` | `tactical-score-number` | `stencil-score-block` | `blues-ring` | `light-card` | `fitness-gradient-ring` | Shows total, category, mode, pass/fail state |
| `demographicsControls` | `visible-compact-selects` | `visible-shared-row` | `visible-shared-row` | `visible-shared-row` | `visible-glass-selects` | Sex, age, standards are reachable |
| `settingsPanel` | `tactical-panel` | `stencil-compact-panel` | `blues-drawer` | `light-drawer` | `fitness-glass-drawer` | Install, audio, update, dev/status controls reachable or intentionally deferred |
| `bodyCompositionCard` | `tactical-dense` | `stencil-clipped` | `blues-polished` | `light-clean` | `fitness-gradient-card` | WHtR input and body score reachable in PFRA |
| `strengthCard` | `tactical-dense` | `stencil-clipped` | `blues-polished` | `light-clean` | `fitness-gradient-card` | Event, exemption, input, slider, score, chart reachable |
| `coreCard` | `tactical-dense` | `stencil-clipped` | `blues-polished` | `light-clean` | `fitness-gradient-card` | Event, exemption, reps/plank input, slider, score, chart reachable |
| `cardioCard` | `tactical-dense` | `stencil-clipped` | `blues-polished` | `light-clean` | `fitness-gradient-card` | Run/HAMR/walk/exempt, altitude, inputs, slider, score, chart reachable |
| `lapDisplay` | `tactical-horizontal-bars` | `stencil-vertical-bars` | `blues-table` | `light-rows` | `fitness-tiles` | Legacy 6-lap and PFRA 8-lap information preserved |
| `chartDisplay` | `tactical-drawer` | `stencil-drawer` | `blues-chart-drawer` | `light-chart-drawer` | `fitness-glass-chart` | Current chart content reachable |
| `inputControls` | `slider-plus-field` | `tap-edit-plus-slider` | `stepper-plus-slider` | `numeric-field-plus-slider` | `tap-edit-plus-slider` | Text/slider sync and min ticks preserved |
| `componentScoreDisplay` | `hud-chip` | `stencil-points` | `progress-strip` | `clean-chip` | `gradient-chip` | Component score and exempt state visible |

## Preset Status

| Theme Preset | Status | First Implementation Goal |
|---|---|---|
| Tactical HUD | Planned | First dense reference preset |
| Connect Light | Planned | First practical default-style preset |
| Stencil Ops | Planned | Add after shared slot contract is stable |
| AF Dress Blues | Planned | Add after score-ring accessibility is tested |
| Fitness Gradient | Planned | Add after contrast/readability checks |

Settings foundation status: the shared `settingsPanel` foundation is implemented through `src/ui/settings-hub.mjs` and is currently shared across all presets. Theme-specific settings panel variants are still planned.

Score header foundation status: `src/ui/score-header.mjs` renders the active preset's `scoreHeader` variant by mirroring the existing `#score-txt` output. It does not calculate scores. The current implementation includes foundation styles for all five registered score header variants, with deeper theme polish still planned.

Demographics controls status: the real `#sex-sel`, `#age-sel`, and `#standards-mode` controls now live in the score/header area. They are moved, not mirrored, so existing event bindings remain authoritative. Theme-specific demographics variants are still planned.

Lap display foundation status: `src/ui/lap-display.mjs` mirrors the already-rendered `#run-lap-times` text through the active `lapDisplay` variant. It does not calculate lap times. Foundation renderers exist for all five registered lap display variants.

Chart drawer foundation status: `src/ui/chart-drawer.mjs` wraps the existing `#modal` and `#modal-img` chart image flow with drawer presentation and active `chartDisplay` variants. Chart image sources remain owned by the existing legacy handlers.

Strength card foundation status: `src/ui/strength-card.mjs` wraps the real legacy strength sections (`#push-sel`, `#push-txt`, `#push-slider`, `#push-tick`, `#push-btn`) in a `#strength-card` slot element. The PFRA strength score (`#pfra-strength-score`) has been moved into the card header and is hidden in legacy mode via CSS. Scoring and event-binding logic in `main2.js` and `pfra-calculator.js` remain unchanged. Foundation styles exist for all five registered variants. Theme switching preserves strength event, input value, and score.

Body composition card foundation status: `src/ui/body-composition-card.mjs` wraps the real `#pfra-whtr` input and `#pfra-body-score` output in a `#body-composition-card` slot element. The card applies the active `bodyCompositionCard` variant class from the theme preset. Scoring is unchanged — `pfra-calculator.js` and `src/pfra/scoring.mjs` remain authoritative. Foundation styles exist for all five registered variants: `light-clean`, `tactical-dense`, `stencil-clipped`, `blues-polished`, and `fitness-gradient-card`. The card is visible only in PFRA mode (inherited from `.pfra-panel` display rules).

## Required Cross-Theme Tests

- Switching themes does not change selected sex, age, standard, events, performance values, exemptions, or score results.
- Switching themes changes the score header variant without changing the mirrored score value or status.
- Switching themes changes the lap display variant without changing the mirrored lap values.
- Each theme exposes Legacy and PFRA access.
- Each theme exposes chart access for strength, core, and cardio.
- Chart drawer switching changes presentation without changing chart image source.
- Each theme exposes settings access for install/update/audio/dev status or records an explicit deferral.
- Each theme exposes lap information with equivalent meaning.
- Each theme passes mobile viewport checks.

## Future User Overrides

User overrides should be tested separately from theme preset switching:

- Base theme remains selected.
- One slot override changes only that slot renderer.
- Score and component values remain unchanged.
- Reset returns to the preset default.
