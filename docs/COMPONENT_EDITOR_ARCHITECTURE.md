# Component Editor Architecture

## The Universal Mock Pattern

Every mock — Tactical, Stencil, Blues, Light, Fitness — uses the same structural layout:

```
top app bar
score / composite display
sex / age / standard row
─────────────────────────
[ PUSH ]  [ CORE ]  [ RUN ]   ← componentSummaryStrip
─────────────────────────
┌──────────────────────┐
│  Active Editor       │   ← activeComponentEditor (one at a time)
│  event selector      │
│  large value display │
│  input / slider      │
│  chart button        │
└──────────────────────┘
─────────────────────────
lap display
settings drawer (off-canvas)
```

The component summary strip has three compact cards. Clicking one card changes the active editor. Only the active component's editor is shown at a time. This is implemented as `const [active, setActive] = React.useState('run')` in every mock.

The themes differ only in HOW these zones are rendered:
- Tactical: monospace dense cards, slider + field, 8-row lap bars
- Stencil: clipped cards, tap-to-edit, bar chart lap strip
- Blues: polished cards with score bar, stepper + slider, table lap rows
- Light: rounded card + pill tabs, slider + field, clean lap rows
- Fitness: glass pill cards, tap-to-edit, tile grid laps

The structural pattern is invariant. Only the visual renderer changes.

---

## Why the Current 7A/7B Approach Is Structurally Wrong

The Phase 7A/7B implementation wrapped existing legacy sections in card-shaped divs:

```html
<div id="strength-card">
  <!-- Section 4: push score text -->
  <!-- Section 5: push selector + chart button -->
  <!-- Section 6: push slider -->
</div>
<!-- then separately: -->
<!-- Section 7: sit score text -->
<!-- Section 8: sit selector + chart button -->
<!-- Section 9: sit slider -->
<!-- Section 10: run score text -->
<!-- Section 11: run selector + chart button -->
<!-- Section 12: run slider -->
```

This is wrong for three reasons:

1. **Strength/core/cardio are always visible simultaneously.** The mock shows exactly ONE component editor at a time. The user selects which component to edit. The others are hidden.

2. **Strength became a full vertical card section; core/cardio are still raw legacy sections.** The mock has three equal-weight summary cards — none of them is a full vertical section.

3. **There is no component selection state.** The mock's active editor is driven by a `selectedComponent` state variable. The current app has no such concept — all sections render unconditionally.

The result is old stacked calculator layout with wrappers and width fixes, not a component summary strip + active editor.

---

## What to Preserve

The following are implemented and correct — do not regress them:

| Element | Status | Notes |
|---|---|---|
| CSS token system (`--afpt-*`) | Keep | All card/section CSS now uses tokens |
| App-frame width (`--afpt-app-max-width: 640px`) | Keep | All sections share the same width |
| Settings hub (`src/ui/settings-hub.mjs`) | Keep | Drawer with real controls |
| Score header (`src/ui/score-header.mjs`) | Keep | Mirrors `#score-txt`, five variants |
| Header demographics (`.sex-age-sel-section`) | Keep | Real `#sex-sel`, `#age-sel`, `#standards-mode` |
| Lap display (`src/ui/lap-display.mjs`) | Keep | Mirrors `#run-lap-times`, five variants |
| Chart drawer (`src/ui/chart-drawer.mjs`) | Keep | Wraps `#modal`/`#modal-img` |
| Body composition card (`#body-composition-card`) | Keep | PFRA-only, separate from component strip |
| Theme controller (`src/ui/theme-controller.mjs`) | Keep | Applies preset, dispatches event |
| Layout variant registry (`src/ui/layout-variants.mjs`) | Keep | Preset definitions, variant registry |
| `window.afptLegacy` boundary | Keep | Legacy scoring, `main2.js` owns |
| PWA / service worker | Keep | Do not touch |

---

## What to Change

### Remove the stacked-card pattern

`#strength-card` should not remain a full-height vertical section. It should become a compact summary card in a 3-column strip.

Core and cardio must NOT be implemented as full stacked cards. The Phase 7C/7D "core card" and "cardio card" work is stopped.

### Create: `componentSummaryStrip`

A horizontal row of three compact summary cards:

```html
<div id="component-summary-strip" class="component-summary-strip">
  <button id="summary-strength" class="component-summary-card" data-component="strength" aria-pressed="true">
    <!-- short name, current value, score -->
  </button>
  <button id="summary-core" class="component-summary-card" data-component="core">
    <!-- short name, current value, score -->
  </button>
  <button id="summary-cardio" class="component-summary-card" data-component="cardio">
    <!-- short name, current value, score -->
  </button>
</div>
```

Summary cards show:
- Component short name (PUSH / CORE / RUN)
- Current value (reps or time) — mirrored from real input
- Component score (PFRA score when in PFRA mode, empty in legacy)
- Active state (highlighted when selected)

### Create: `activeComponentEditor`

A single container that shows the controls for the selected component:

```html
<div id="active-component-editor" class="active-component-editor" data-active-component="strength">
  <div id="strength-editor" class="component-editor" data-component="strength">
    <!-- existing #push-sel, #push-txt, #push-slider, #push-tick, #push-btn preserved here -->
  </div>
  <div id="core-editor" class="component-editor" data-component="core" hidden>
    <!-- existing #sit-sel, #sit-txt, #plankmintxt, #sit-slider, #sit-tick, #sit-btn preserved here -->
  </div>
  <div id="cardio-editor" class="component-editor" data-component="cardio" hidden>
    <!-- existing #cardio-sel, #run-mintxt, #run-sectxt, #run-slider, #run-tick, #run-btn preserved here -->
  </div>
</div>
```

Only the active editor's `hidden` attribute is removed. JS wires the summary cards to set `data-active-component` and toggle `hidden` on editor panels.

---

## ID Preservation Contract

All existing IDs must remain in the DOM and keep their existing event bindings. New wrappers can be added around them; existing IDs must not be renamed, removed, or re-bound.

### Strength editor IDs
| ID | Purpose |
|---|---|
| `#push-sel` | Event type selector (Pushups / Hand-Release / Exempt) |
| `#push-txt` | Rep count text input |
| `#push-slider` | Range slider |
| `#push-tick` | Minimum tick button |
| `#push-btn` | See chart button |
| `#push-txt-p` | Score text paragraph (legacy) |
| `#pfra-strength-score` | PFRA strength score display |

### Core editor IDs
| ID | Purpose |
|---|---|
| `#sit-sel` | Event type selector (Sit-ups / Reverse Crunch / Plank / Exempt) |
| `#sit-txt` | Rep count text input |
| `#plankmintxt` | Plank minutes text input |
| `#sit-slider` | Range slider |
| `#sit-tick` | Minimum tick button |
| `#sit-btn` | See chart button |
| `#sit-txt-p` | Score text paragraph (legacy) |
| `#pfra-core-score` | PFRA core score display (to be added) |

### Cardio editor IDs
| ID | Purpose |
|---|---|
| `#cardio-sel` | Event type selector (2 Mile / Shuttle / Walk / Exempt) |
| `#run-mintxt` | Run minutes text input |
| `#run-sectxt` | Run seconds text input |
| `#shuttle-txt` | Shuttle count input |
| `#walk-txt` | Walk time input |
| `#run-slider` | Range slider |
| `#run-tick` | Minimum tick button |
| `#run-btn` | See chart button |
| `#run-txt-p` | Score text paragraph (legacy) |
| `#colon` | Colon separator paragraph |
| `#pfra-cardio-score` | PFRA cardio score display (to be added) |

The `#alt-select` altitude selector currently lives in `.runlaps-row`. It may remain there or move into the cardio editor as the mock shows — do not break its event binding.

---

## Legacy Control Visibility Rules

`main2.js` uses `body.pfra-mode` class to show/hide PFRA-specific content. This mechanism must not be broken.

The `hidden` attribute on editor panels is a separate, UI-layer concern. The JS component selection must:
1. Only toggle `hidden` on the editor panels, never on individual legacy inputs
2. Let `main2.js` continue to drive `body.pfra-mode` and its associated show/hide rules

The component editor JS must not interfere with `window.afptLegacy` or any existing event listeners.

---

## `selectedComponent` State

A lightweight, UI-only state variable. It is NOT part of the scoring system.

```javascript
// src/ui/component-editor.mjs
let selectedComponent = 'strength'; // 'strength' | 'core' | 'cardio'

function selectComponent(component) {
  selectedComponent = component;
  // update summary card aria-pressed attributes
  // update active-component-editor data attribute
  // show/hide editor panels via hidden attribute
  // dispatch afpt:componentchange custom event for future subscribers
}
```

This is the only new state the UI layer owns. It does not affect scores.

---

## Implementation Phases

### Phase A — componentSummaryStrip (HTML + CSS + read-only JS)

- Add `#component-summary-strip` and three `#summary-*` buttons to `index.html`.
- Wire summary button clicks to `selectComponent()`.
- Summary cards display static labels initially; live value mirroring comes in Phase C–E.
- Add CSS for the strip and summary card variants.
- Add browser regression: three cards visible, clicking each changes aria-pressed, active state changes.

### Phase B — activeComponentEditor container (HTML + CSS)

- Add `#active-component-editor` wrapper to `index.html`.
- Strength editor visible by default. Core and cardio editors hidden.
- No controls moved yet — legacy sections still in their current positions.
- Add browser regression: active component editor visible, correct editor shown for default selection.

### Phase C — Move strength controls into strength editor

- Move `.strength-txt`, `.push-sel-chart`, `.push-slide` into `#strength-editor`.
- All existing IDs preserved. Existing `main2.js` event bindings continue to work.
- Remove `#strength-card` wrapper (or repurpose it as `#strength-editor`).
- Verify: push selector, slider, tick, chart button all function.

### Phase D — Move core controls into core editor

- Move `.situp-txt`, `.sit-sel-chart`, `.sit-slide` into `#core-editor`.
- All existing IDs preserved.
- Verify: sit selector, plank inputs, slider, tick, chart button all function.

### Phase E — Move cardio controls into cardio editor

- Move `.run-txt`, `.cardio-sel-chart`, `.run-slider-section` into `#cardio-editor`.
- Keep `.runlaps-row` (lap display + altitude) outside the editor — it appears regardless of selected component.
- All existing IDs preserved.
- Verify: run selector, all input variants (run/shuttle/walk), slider, tick, chart button all function.

### Phase F — Component switching hides non-selected editors

- Implement `hidden` toggle on editor panels in `selectComponent()`.
- Only one editor visible at a time.
- Switching components preserves all input values (inputs are in the DOM, just hidden).
- Verify: all three switch paths work, values survive switching, scores still update.

### Phase G — Summary card live value mirroring

- Read current values from `#push-txt`, `#sit-txt`/`#plankmintxt`, `#run-mintxt`/`#run-sectxt` to populate summary card displays.
- Mirror on input events (same pattern as `src/ui/lap-display.mjs` and `src/ui/score-header.mjs`).
- In PFRA mode, show component scores. In Legacy mode, hide score spans.
- Add `#pfra-core-score` and `#pfra-cardio-score` output elements.

### Phase H — Update browser regression tests

See required assertions below.

---

## Slot Mapping Change

The current `LAYOUT_VARIANT_SYSTEM.md` defines separate `strengthCard`, `coreCard`, `cardioCard` slots. This needs to be updated to:

| New slot | Replaces |
|---|---|
| `componentSummaryStrip` | `strengthCard` + `coreCard` + `cardioCard` summary role |
| `componentSummaryCard` | Per-card variant within the strip |
| `activeComponentEditor` | The editor panel (shared by all three components) |

The `inputControls` slot already exists and maps to the input variant inside the active editor. The `componentScoreDisplay` slot maps to the score chip inside each summary card.

Old `strengthCard` / `coreCard` / `cardioCard` slot names in `layout-variants.mjs` should remain temporarily during the transition to avoid breaking existing theme preset definitions. They will be superseded once the new slots are registered and tested.

---

## Required Browser Tests

After all phases:

- Three component summary cards are visible in the DOM.
- Strength is selected by default (`[aria-pressed="true"]` on `#summary-strength`).
- After clicking `#summary-core`, core editor is visible and strength/cardio editors are hidden.
- After clicking `#summary-cardio`, cardio editor is visible and strength/core editors are hidden.
- Switching from strength → core and back to strength preserves the push input value.
- Entering a value in `#push-txt` and switching to core and back: value unchanged.
- Selecting `Plank` in `#sit-sel` and switching to cardio and back: plank selector still chosen.
- Score header still updates when any input changes regardless of which editor is active.
- Chart drawer opens from each editor's chart button (`#push-btn`, `#sit-btn`, `#run-btn`).
- Theme switch does not reset selected component or input values.
- In Legacy mode: PFRA score displays hidden, legacy score text still appears.
- In PFRA mode: PFRA score spans appear in summary cards.
- `body.pfra-mode` class still shows/hides PFRA-specific sections correctly.
- Mobile viewport: all three summary cards fit in one row without overflow.
