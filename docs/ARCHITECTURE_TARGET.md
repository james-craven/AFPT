# Architecture Target

The long-term architecture should flow in one direction:

```text
standards data
-> pure scoring functions
-> app state
-> UI rendering
-> event bindings
```

## Layer Responsibilities

### Standards Data

- Own official source metadata, age groups, sexes, component definitions, event IDs, and table file references.
- Keep PFRA 2026 standards rooted in `standards/af-pfra-2026.json`.
- Keep generated table JSON under `standards/extracted/tables/`.

### Pure Scoring Functions

- Accept plain data and return plain results.
- Avoid DOM reads, DOM writes, globals, alerts, local storage, fetch, or event listeners.
- Cover WHtR, event tables, walk pass/fail scoring, exemptions, available-point normalization, and category labels.

### App State

- Store selected standards mode, sex, age group, event choices, performances, exemptions, and current loaded standards.
- Translate between legacy UI names and PFRA data IDs.
- Avoid computing scores directly in event handlers.

### UI Rendering

- Render labels, score text, slider ranges, tick positions, lap times, and total score from state and score results.
- Keep the existing visual appearance unless a functionality repair requires a small adjustment.

### Event Bindings

- Convert user actions into state updates.
- Keep event handlers thin.
- Avoid duplicating scoring logic in handlers.

## Migration Constraints

- No framework.
- No TypeScript.
- Static GitHub Pages compatible.
- PWA/offline behavior preserved.
- Legacy calculator remains available while PFRA is being modernized.

