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

## Required Cross-Theme Tests

- Switching themes does not change selected sex, age, standard, events, performance values, exemptions, or score results.
- Each theme exposes Legacy and PFRA access.
- Each theme exposes chart access for strength, core, and cardio.
- Each theme exposes settings access for install/update/audio/dev status or records an explicit deferral.
- Each theme exposes lap information with equivalent meaning.
- Each theme passes mobile viewport checks.

## Future User Overrides

User overrides should be tested separately from theme preset switching:

- Base theme remains selected.
- One slot override changes only that slot renderer.
- Score and component values remain unchanged.
- Reset returns to the preset default.
