# UI Implementation Phases

## Principle

Do not implement five complete UI copies. Implement one shared calculator state/action contract, then render it through theme presets and slot variants.

## Phase 1: Shared UI State And Action Contract

Define the normalized state shape that renderers receive:

- Current mode: Legacy or PFRA.
- Sex and age group.
- Selected events.
- Performance values.
- Exemption state.
- Component scores.
- Total score and category.
- Min/max values.
- Lap data.
- Chart targets.
- Standards load status.
- PWA/install/update/dev status.

Define shared actions:

- Set sex.
- Set age.
- Set standards mode.
- Set event selection.
- Set performance value.
- Set exemption.
- Open/close chart.
- Open/close settings.
- Select theme preset.
- Select slot override later.

Done when browser tests can still drive current controls through the shared action layer.

## Phase 2: Registries

Create static registries for:

- Theme presets.
- Layout slots.
- Slot variants.

Done when a selected theme resolves to a complete map of slot variants without rendering duplicate calculator logic.

Foundation status: `src/ui/layout-variants.mjs` now defines the initial layout slots, theme presets, and placeholder variant registry. `src/ui/theme-controller.mjs` applies the active preset through `data-theme` and `data-theme-preset` attributes while the existing UI remains intact.

## Phase 3: Base Shell

Create one production shell that:

- Reads the resolved preset.
- Renders each slot.
- Keeps current IDs or compatibility hooks until old direct DOM bindings are replaced.
- Preserves PWA and static asset paths.

Done when the shell loads and existing browser regressions still pass.

Settings/control hub foundation status: the old hamburger checkbox pattern has been replaced by a shared settings drawer while preserving current reference, install, update, build-info, audio, and theme controls. Theme-specific settings panel variants still come later.

Score header foundation status: the first visual slot renderer now mirrors the existing `#score-txt` source through the active `scoreHeader` variant. This keeps score calculation in the legacy/PFRA renderers while allowing visual variants to change independently.

Demographics controls foundation status: the real sex, age, and standards controls now live in the score/header area with existing IDs and event handlers preserved. Theme-specific control variants still come later.

## Phase 4: First Presets

Implement the Tactical and Connect Light presets first:

- Tactical proves high-density feature coverage.
- Connect Light proves a calmer daily-use visual style.

Done when both presets expose all matrix-required features and theme switching does not change scores.

## Phase 5: Remaining Presets

Implement Stencil Ops, AF Dress Blues, and Fitness Gradient through the same slot/variant system.

Done when each preset passes the theme parity matrix and mobile checks.

## Phase 6: Dev Variant Picker

Add a hidden/dev settings variant picker for testing individual slot overrides.

Done when each slot can be swapped independently without changing score results.

## Phase 7: Persistence

Persist user customization after variant switching is stable.

Requirements:

- Store locally only.
- Include reset-to-preset.
- Do not require account, server, or API.
- Do not affect offline behavior.

## Phase 8: Public Customization UI

Expose user customization only after:

- All theme presets pass parity.
- Slot overrides pass scoring invariance tests.
- Reset behavior is tested.
- Text and touch targets are verified on mobile.
