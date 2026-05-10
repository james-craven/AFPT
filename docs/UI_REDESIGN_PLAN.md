# UI Redesign Plan

## Purpose

Replace the current visual design while preserving the working calculator. The existing app is the source of truth for behavior, scoring, standards data, PWA/offline behavior, and deployment. The uploaded Claude mock is a visual reference only.

The redesign is successful only if every row in `docs/FEATURE_PARITY_MATRIX.md` is marked Implemented, Deferred by explicit decision, or Not Applicable, with a verification method.

## Strategic Direction

Do not build five separate calculators or five isolated app pages. Build one calculator with swappable layout variants.

```text
Theme = preset bundle
Layout element = swappable component variant
User customization = override one piece of the preset
```

A theme preset chooses variants. A user customization overrides variants. Neither themes nor variants own scoring logic.

If a feature exists in one variant, equivalent functionality must be reachable in every other variant, even if presented differently.

## Reference Inputs

Current production files:

- `index.html`
- `style.css`
- `main2.js`
- `pfra-calculator.js`
- `src/pfra/*.mjs`
- `pwa.js`
- `manifest.webmanifest`
- `workbox-config.js`
- `tools/browser-regression.mjs`

Uploaded mock files inspected:

- `/Users/jamescraven/Downloads/AFPT Calculator Mocks.html`
- `/Users/jamescraven/Downloads/design-canvas.jsx`
- `/Users/jamescraven/Downloads/ios-frame.jsx`
- `/Users/jamescraven/Downloads/android-frame.jsx`
- `/Users/jamescraven/Downloads/shared.jsx`
- `/Users/jamescraven/Downloads/mock-tactical.jsx`
- `/Users/jamescraven/Downloads/mock-stencil.jsx`
- `/Users/jamescraven/Downloads/mock-blues.jsx`
- `/Users/jamescraven/Downloads/mock-light.jsx`
- `/Users/jamescraven/Downloads/mock-fitness.jsx`

## Non-Negotiables

- Keep the app static-hostable on GitHub Pages.
- Keep vanilla JavaScript and ES modules.
- Do not introduce React, TypeScript, Babel-in-browser, a server, a database, or a framework.
- Do not copy mock seed scoring data into production.
- Do not replace real PFRA scoring with mock values.
- Do not remove legacy calculator access.
- Do not break PWA install, service-worker update prompts, offline reload, shuttle audio, or cached standards.
- Do not duplicate scoring, standards loading, or app-state logic inside themes or variants.
- Do not remove current chart access until the replacement drawer is proven.

## Variant System

The production UI should be organized around layout slots:

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

Each slot can have multiple visual variants. Theme presets choose default variants for the slots, and future user preferences can override individual slots.

Example:

```js
const THEME_PRESETS = {
  tactical: {
    scoreHeader: 'tactical-score-number',
    componentCard: 'tactical-dense',
    lapDisplay: 'tactical-horizontal-bars',
    chartDisplay: 'tactical-drawer',
    settingsPanel: 'tactical-panel',
  },
};

const userLayoutPreferences = {
  baseTheme: 'tactical',
  overrides: {
    scoreHeader: 'blues-ring',
    lapDisplay: 'stencil-vertical-bars',
  },
};
```

The final UI is resolved as:

```text
base theme preset + user overrides = actual UI
```

## Mock Pieces That Are Demo-Only

- React runtime and ReactDOM CDN scripts.
- Babel-in-browser compilation.
- `DesignCanvas`, artboards, post-it notes, zoom/pan canvas, and state sidecar.
- iOS and Android device frames.
- Frame toggle.
- Mock seed data in `AFPT_DATA`.
- Stub chart rows generated inside `ChartDrawer`.
- Five separate full-page layout implementations.
- Remote Google Font dependency unless fonts are bundled or replaced with system fonts.
- Mock-only settings values such as `Units`, `Notifications`, and frame toggles unless separately implemented as real app features.

## Implementation Order

1. Define the shared UI state/action contract.
2. Define the theme preset registry.
3. Define the layout slot registry.
4. Define the variant registry.
5. Build one production app shell that resolves slots from the active theme preset.
6. Implement Tactical and Connect/Light variants first because they best match the current feature set and a practical phone UI.
7. Add Stencil, Blues, and Fitness variants as preset bundles after core parity is stable.
8. Add a hidden/dev settings variant picker for internal testing.
9. Add persistent user layout preferences later.
10. Add the public customization UI only after all theme presets pass parity tests.

## Phase Gates

Each major phase must:

- Update `docs/FEATURE_PARITY_MATRIX.md`.
- Update `docs/THEME_PARITY_MATRIX.md`.
- Update `docs/UI_TEST_PLAN.md` if test coverage changes.
- Run `npm test`.
- Fix any new regression before continuing.

## Stop Conditions

Stop and ask before implementation if:

- A UI change would remove a major current feature.
- A current feature has no clear place in the slot/variant model.
- A framework, TypeScript, remote runtime dependency, or build-system change seems necessary.
- A scoring behavior conflict is discovered.
- A variant cannot expose equivalent functionality to other variants.
