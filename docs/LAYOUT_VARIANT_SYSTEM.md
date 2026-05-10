# Layout Variant System

## Core Idea

The app has one calculator engine and many visual variants.

A theme is a preset that selects variants for each layout slot.

A user customization can later override individual slots without changing the base theme.

```text
standards data
-> pure scoring functions
-> app state
-> normalized UI model
-> slot variant renderers
-> event/action bindings
```

## Key Rules

- A theme preset chooses variants.
- A user customization overrides variants.
- Neither themes nor variants own scoring logic.
- If a feature exists in one variant, equivalent functionality must be reachable in every other variant, even if presented differently.

## Layout Slots

- `appShell`
- `scoreHeader`
- `demographicsControls`
- `standardsSwitcher`
- `settingsPanel`
- `bodyCompositionCard`
- `strengthCard`
- `coreCard`
- `cardioCard`
- `lapDisplay`
- `chartDisplay`
- `inputControls`
- `componentScoreDisplay`
- `navigationPattern`

## Variant Rules

Each variant:

- Receives normalized app state.
- Renders the same functional controls required by its slot.
- Dispatches actions through shared handlers.
- Does not compute scores directly.
- Does not fetch standards directly.
- Does not mutate global calculator state directly.
- Does not own persistent state except UI-only open/closed state.
- Must be usable in mobile viewports.
- Must expose accessible labels or text for required controls.

## Shared Render Contract

Every renderer should receive state in a stable shape and actions in a stable shape.

Example score header state:

```js
renderScoreHeader({
  total: 92.5,
  category: 'Excellent',
  mode: 'PFRA 2026',
  componentScores: {
    body: 20,
    strength: 15,
    core: 15,
    cardio: 42.5,
  },
  selectedVariant: 'blues-ring',
});
```

Example lap display state:

```js
renderLapDisplay({
  mode: 'pfra-2-mile',
  laps: [
    { number: 1, time: '2:00', cumulative: '2:00', pace: '8:00/mi' },
    { number: 2, time: '2:00', cumulative: '4:00', pace: '8:00/mi' },
  ],
  selectedVariant: 'stencil-vertical-bars',
});
```

## Variant Examples

### `scoreHeader`

- `tactical-score-number`
- `stencil-score-block`
- `blues-ring`
- `light-card`
- `fitness-gradient-ring`

### `lapDisplay`

- `tactical-horizontal-bars`
- `stencil-vertical-bars`
- `blues-table`
- `light-rows`
- `fitness-tiles`

### `componentCard`

- `tactical-dense`
- `stencil-clipped`
- `blues-polished`
- `light-clean`
- `fitness-gradient-card`

## Theme Presets

Theme presets choose a default variant for each slot.

```js
const THEME_PRESETS = {
  tactical: {
    appShell: 'tactical-shell',
    scoreHeader: 'tactical-score-number',
    componentCard: 'tactical-dense',
    lapDisplay: 'tactical-horizontal-bars',
    chartDisplay: 'tactical-drawer',
    settingsPanel: 'tactical-panel',
    inputControls: 'slider-plus-field',
  },
  light: {
    appShell: 'light-shell',
    scoreHeader: 'light-card',
    componentCard: 'light-clean',
    lapDisplay: 'light-rows',
    chartDisplay: 'light-drawer',
    settingsPanel: 'light-drawer',
    inputControls: 'numeric-field-plus-slider',
  },
};
```

## User Overrides

Future customization can override individual slots without changing the base theme.

```js
const userLayoutPreferences = {
  baseTheme: 'tactical',
  overrides: {
    scoreHeader: 'blues-ring',
    lapDisplay: 'stencil-vertical-bars',
    componentCard: 'light-clean',
  },
};
```

Resolve order:

```text
default preset
-> selected base theme preset
-> user slot overrides
-> actual renderer choices
```

## Persistence

User layout preferences should be persisted only after:

- Theme presets are implemented and tested.
- Variant switching proves it does not alter scoring behavior.
- A reset-to-default option exists.

Use browser-local persistence only for customization. Do not require a server or account.

## Implementation Guardrails

- Start with read-only render contracts and static registries.
- Keep old controls wired until replacement slot variants pass browser tests.
- Add dev-only variant switching before public customization.
- Never let a variant directly import standards or scoring tables.
- Keep variant files small and slot-scoped.
