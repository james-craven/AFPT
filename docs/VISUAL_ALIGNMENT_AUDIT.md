# Visual Alignment Audit

Status: Phase 7 visual realignment complete. CSS token system added; card CSS refactored. Desktop layout geometry fixed.

Mock source files live in `design-reference/`. Read them before any visual implementation work.

---

## Root Cause of Current Visual Gap

The mocks (in `design-reference/shared.jsx`) define a CSS custom property token system:

```
--bg          background
--panel       card/surface background
--panel-2     secondary surface / input background
--border      subtle border
--border-strong  prominent border
--ink         primary text color
--ink-dim     secondary/muted text
--accent      primary interactive color (cyan / gold / silver / blue / pink)
--accent-2    secondary/achievement color (green / olive / brass / green / amber)
--warn        warning/caution
--bad         fail/error
--font        body font stack
--font-display  display/title font stack
```

The current production CSS does not implement these tokens. Card CSS uses hardcoded `rgba()` values that do not respond to theme preset switching — only the `data-theme-preset` attribute changes, but no CSS reads it to alter card colors or typography.

**This is the primary reason Phase 7A/7B cards look like "old UI in new boxes".**

---

## Slot-by-Slot Audit

### `scoreHeader`

**Current:** `src/ui/score-header.mjs` mirrors `#score-txt`. Foundation styles exist for all five variants. Mode label and status badge render correctly.

**Mock intent (Tactical):** Large monospace number, `▲ EXC` badge with border, threshold bar showing UNSAT/SAT/EXC/MAX positions, dim secondary line showing +N above pass.

**Mock intent (Light):** White card with rounded corners, 48px score, pill badge reading `● Excellent`, gradient threshold bar with circle thumb, labeled breakpoints below.

**Mock intent (Blues):** SVG ring/dial gauge, score centered inside ring, status label below, supporting text at right (+N above pass, +N to max).

**Alignment:** Structurally aligned. Visually under-specified — foundation styles exist but do not implement the threshold bar, status badge border style, or ring gauge. Token system missing.

**What needs to change:** Add CSS custom property tokens per preset. Add threshold bar markup to score header. Implement the ring gauge for blues preset.

---

### `bodyCompositionCard`

**Current:** `#body-composition-card` wraps `#pfra-whtr` input and `#pfra-body-score`. Simple card header with title and score. Five variant CSS classes.

**Mock intent:** The body composition component is shown as part of the component selector tab row (not a standalone card). When "PUSH" tab is active, the active editor panel shows the push controls — not a separate WHtR section.

The mocks do not show a dedicated WHtR card because WHtR is a PFRA-specific input that the mocks treat as part of the user's demographic context (like sex/age), not a performance component. The component cards in the mocks are: **PUSH · CORE · RUN**.

**Alignment:** Partially aligned — the wrapper and functional controls are correct. Visual language is flat/placeholder. Token system missing. Input styling does not match mock (no `--panel-2` background, no `--border-strong` border on input).

**What needs to change:**
1. Add CSS token system — card should read `--panel`, `--border`, `--ink`, `--accent` etc.
2. Input should use `--panel-2` background and `--border-strong` border.
3. Score display should use `--accent-2` color for value text.
4. Title label should use `--ink-dim` with uppercase letter-spacing.

---

### `strengthCard`

**Current:** `#strength-card` wraps existing legacy strength sections. Card header with title and PFRA score (hidden in legacy mode). Five variant CSS classes but they only add a slight background — the inner content is unchanged legacy sections.

**Mock intent (all themes):** The active editor panel for the selected component shows:
- Component name + score in a header row
- Event/exercise type as a styled selector (pill tabs for core alt events, or a select for different exercise types)
- Large display of current value (reps or time)
- Inline edit input next to the large value
- `[CHART]` / `See chart` / `CHART ▸` button in the header row
- Slider with min/max labels below

The chart button is part of the editor header, not a separate section. The `push-btn` is currently inside `.pushsit-see-chart-btn` which sits in a grid with the event selector.

**Alignment:** Structurally misaligned. The wrapper exists but inner sections retain legacy CSS classes and layout (`.push-sel-chart` 3-column grid, `.push-slide`, `.strength-txt`). The visual identity is inherited from legacy CSS, not from the mock-inspired card language.

**What needs to change:**
1. Add CSS token system.
2. Replace the legacy 3-column `.push-sel-chart` grid inside the card with a card-scoped layout using `--panel`, `--border`, `--ink` tokens.
3. Style `#push-btn` as a right-justified chart action button using `--accent` color and `--border-strong` border (matches mock "See chart" button pattern).
4. Style `#push-txt-p` (score text) using `--ink-dim` for secondary info.
5. Style the slider section to use the mock pattern: track with `--panel-2` background, filled portion using `--accent` color, min/max labels using `--ink-dim`.

---

### `lapDisplay`

**Current:** `src/ui/lap-display.mjs` mirrors `#run-lap-times`. Five variant renderers.

**Mock intent (Tactical):** 4-column grid (number, pace, split, pace bar). Dashed row separators. Glowing pace bars.

**Mock intent (Light):** Lap number + pace in rows, mini pace bar at right, split cumulative at far right. Clean card wrapping.

**Mock intent (Stencil):** Vertical bar chart showing pace, split totals below.

**Mock intent (Blues):** Clean table with LAP / PACE / SPLIT / vs TGT columns. Alternating row background.

**Mock intent (Fitness):** 4×2 tile grid with pace per tile.

**Alignment:** Structurally aligned. Renderers approximate mock patterns. Token system missing — colors are hardcoded.

**What needs to change:** Refactor lap display variant CSS to use `--panel`, `--border`, `--ink`, `--ink-dim`, `--accent` tokens.

---

### `chartDisplay`

**Current:** `src/ui/chart-drawer.mjs` wraps `#modal`/`#modal-img`. Drawer with header, scrim, close button. Five variant CSS classes.

**Mock intent:** Slide-in drawer from right (width ~78%). Header with `SCORE CHART` label and `CLOSE ✕` button using `--border` style. Chart title/subtitle row. Scrollable table of score/value/tier rows.

**Alignment:** Structurally aligned (drawer pattern, scrim, close button). Visual details pending — token system missing, actual chart content is still an image rather than structured rows.

**What needs to change (near term):** Add token-based CSS. The structured row view from the mock is a future upgrade (requires PFRA tables rendered as rows, not as chart images).

---

### `settingsPanel`

**Current:** `src/ui/settings-hub.mjs` provides shared settings drawer. Preserves all real controls.

**Mock intent:** Right-side drawer with settings list rows. Each row: label left, value+arrow right. Section dividers. Close button top-right.

**Alignment:** Good functional foundation. Visual theming pending.

---

## Priority Fix Order

### Priority 0 — Desktop Layout Geometry (DONE)

Added `--afpt-app-max-width: 640px` as the shared app-frame width. `--afpt-card-max-width` references it so changing the frame changes everything.

All three conflicting width anchors unified:
- Generic `section` rule: was `400px`, now `var(--afpt-app-max-width)`
- `.info-section-wrapper`: was `400px`, now `var(--afpt-app-max-width)`
- `.info-section` (fixed top bar): was `400px` left-aligned, now `var(--afpt-app-max-width)` with `left: 50%; transform: translateX(-50%)` centering
- Score header, demographics, strength card, pfra-panel, runlaps-row, legacy sections: all `640px` via the variable chain

Browser regression verifies score header, strength card, and top bar are all within 40px of each other on desktop.

### Priority 1 — CSS Custom Property Token System (DONE)

Add per-preset CSS custom property definitions to `style.css` implementing the five theme palettes from `design-reference/shared.jsx`. Example:

```css
[data-theme-preset="tactical"] {
  --bg: #040b12;
  --panel: #08141d;
  --panel-2: #0d1c27;
  --border: rgba(29,233,255,0.22);
  --border-strong: rgba(29,233,255,0.55);
  --ink: #dff7ff;
  --ink-dim: #7ba9b8;
  --accent: #1de9ff;
  --accent-2: #37ff8b;
  --warn: #ffb547;
  --bad: #ff4d6d;
  --font: "JetBrains Mono", "IBM Plex Mono", ui-monospace, monospace;
}
```

Rules:
- Font stacks must fall back to system fonts (app is offline-first; do not load remote Google Fonts as hard dependencies).
- Tokens applied on `html[data-theme-preset]` so all children inherit.
- After tokens exist, refactor card/slot CSS to use `var(--panel)` etc. instead of hardcoded `rgba()`.

### Priority 2 — Body Composition Card Visual Language

Refactor `.body-composition-card` and variant modifier CSS to use the token system.

### Priority 3 — Strength Card Visual Language

Refactor `.strength-card` and inner legacy section CSS to use the token system. Style chart button and score text to match mock editor-panel pattern.

### Priority 4 — Score Header Threshold Bar

Add threshold bar markup and CSS to the score header using token colors for the gradient and marker.

### Priority 5 — Core / Cardio Card (Phase 7C / 7D)

Implement with token-based CSS from the start — do not repeat the wrapper-only pattern.

---

## What NOT to Fix Now

- The component tab/selector pattern (switching which component is "active" to edit one at a time) is a significant architectural change. The current app renders all components simultaneously. Moving to a single-active-editor model requires a UI state layer that does not exist yet. This is planned in `docs/UI_IMPLEMENTATION_PHASES.md` as the shared render/action contract phase.
- The ring/dial gauge for blues preset score header (requires SVG + animation).
- Structured chart table rows (requires rendering PFRA table data in the drawer; current approach is image-based).
- Remote font loading (`JetBrains Mono`, `Stardos Stencil`, etc.) — system font fallbacks are fine for the offline-first app.

---

## Before/After Status

| Slot | Before 7A/7B | After 7A/7B | After token realignment | Target |
|---|---|---|---|---|
| `bodyCompositionCard` | No wrapper | Wrapper + controls, hardcoded rgba | Token-based visual language | + Score ring |
| `strengthCard` | No wrapper | Wrapper + controls, hardcoded rgba | Token-based, chart button accent-styled | + Editor panel layout |
| `scoreHeader` | Mirrors score-txt | Mirrors score-txt + variants | Unchanged | + Threshold bar |
| `lapDisplay` | Mirrors lap text | Mirrors lap text + 5 variant renderers | Unchanged (tokens next) | Token-based colors |
| `chartDisplay` | Full-screen modal | Drawer shell + variants | Unchanged (tokens next) | Token-based colors |
| `settingsPanel` | Hamburger | Settings hub drawer | Unchanged (tokens next) | Token-based colors |
| CSS token system | Absent | Absent | `[data-theme="tactical"]` added; body bg tokenized | Complete |
