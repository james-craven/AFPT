# UI Redesign Plan

## Purpose

Replace the current visual design while preserving the working calculator. The existing app is the source of truth for behavior, scoring, standards data, PWA/offline behavior, and deployment. The uploaded Claude mock is a visual reference only.

The redesign is successful only if every row in docs/FEATURE_PARITY_MATRIX.md is marked Implemented, Deferred by explicit decision, or Not Applicable, with a verification method.

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
- Do not remove current chart access until the replacement drawer is proven.

## Visual Direction To Borrow

- Compact mobile-first app shell.
- Large score-first header with clear status badge.
- Always-visible sex, age, and standards controls.
- Component-card layout for body composition, strength, core, and cardio.
- Dense score/details rows inside cards rather than separate scattered sections.
- Drawer-style score charts instead of the current full-screen image modal.
- Theme tokens expressed as CSS variables.
- Settings entry point for development/version/offline/theme controls.

## Recommended Production Direction

Use the Tactical and Light mocks as the main implementation references:

- Tactical has the strongest feature-fit for this app because demographics, standard, altitude, component cards, chart access, and detailed lap rows stay visible and dense.
- Light has the cleanest production feel for repeated real use on phones.
- Blues offers a useful score-ring idea, but a ring gauge should be optional because it consumes vertical space.
- Stencil and Fitness are useful theme inspiration, but their stronger visual styling should come after parity, not in the first production redesign.

The first implementation should ship one stable layout with themeable CSS variables, not five layout-swapping versions.

## Mock Pieces That Are Demo-Only

- React runtime and ReactDOM CDN scripts.
- Babel-in-browser compilation.
- `DesignCanvas`, artboards, post-it notes, zoom/pan canvas, and state sidecar.
- iOS and Android device frames.
- Frame toggle.
- Mock seed data in `AFPT_DATA`.
- Stub chart rows generated inside `ChartDrawer`.
- Layout switching where theme dots swap the entire app layout.
- Remote Google Font dependency unless fonts are bundled or replaced with system fonts.
- Mock-only settings values such as `Units`, `Notifications`, and frame toggles unless separately implemented as real app features.

## Implementation Order

1. Add design tokens and CSS variables without changing behavior.
2. Add a new app shell/header around the existing controls and score output.
3. Move sex, age, standards, and settings controls into the new shell while keeping existing IDs and event bindings working.
4. Convert PFRA body/strength/core/cardio sections into component cards one at a time.
5. Preserve and restyle sliders, text inputs, min ticks, exemptions, and event selectors within those cards.
6. Replace the run/lap section with a card-based run details area that still uses real PFRA/legacy lap calculations.
7. Replace chart modal access with a drawer that initially reuses the current chart image sources.
8. Add one theme selector that changes CSS variables only after core calculator behavior passes browser tests.
9. Verify legacy mode, PFRA mode, charts, audio, install/update prompts, and offline behavior.
10. Remove old unused UI markup and CSS only after the feature parity matrix is complete.

## Phase Gates

Each major phase must:

- Update `docs/FEATURE_PARITY_MATRIX.md`.
- Update `docs/UI_TEST_PLAN.md` if test coverage changes.
- Run `npm test`.
- Fix any new regression before continuing.

## Stop Conditions

Stop and ask before implementation if:

- A UI change would remove a major current feature.
- A current feature has no clear place in the new UI.
- A framework, TypeScript, remote runtime dependency, or build-system change seems necessary.
- A scoring behavior conflict is discovered.
