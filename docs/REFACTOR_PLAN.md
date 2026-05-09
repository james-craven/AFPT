# Refactor Plan

## Phase 0: Repo Orientation And Control Docs

- Capture autonomy policy in `AGENTS.md`.
- Document current structure, risks, target architecture, test plan, and session continuity docs.
- Commit a known-good baseline after tests pass.

## Phase 1: Standards And Scoring Isolation

- Add a browser-friendly standards module.
- Add pure PFRA scoring functions.
- Move PFRA table access and scoring rules out of `pfra-calculator.js`.
- Point tests at the same scoring implementation used by the browser app.

## Phase 2: UI Separation

- Separate PFRA DOM selectors, state sync, rendering, and event wiring inside browser modules where practical.
- Keep the current HTML/CSS appearance.
- Leave legacy UI shape intact while reducing PFRA dependence on legacy score helpers.

## Phase 3: Legacy Containment

- Identify legacy-only scoring and global update functions.
- Keep legacy behavior available.
- Document which embedded legacy tables can later move into versioned data.

## Phase 4: PWA And Static Hosting Verification

- Rebuild `sw.js` after file moves or new modules.
- Confirm GitHub Pages relative paths still work.
- Confirm required offline assets remain cached.
- Confirm local development still unregisters stale service workers unless `?sw=1` is used.

## Phase 5: Cleanup And Handoff

- Remove clearly dead code.
- Improve names where it reduces confusion.
- Update docs and TODO.
- Run `npm test`, `npm audit`, syntax checks, and diff checks.
- Commit a final migration checkpoint.

