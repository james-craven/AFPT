# AFPTCalc Agent Instructions

## Project Purpose

AFPTCalc is a static, mobile-first GitHub Pages PWA for USAF fitness scoring. The current modernization target is to make PFRA 2026 scoring data-driven and easier to update while keeping the app installable, offline-capable, and free to host.

## Autonomy Policy

The user prefers fewer approval interruptions. When there are multiple reasonable implementation options, choose the option that best satisfies:

1. Static GitHub Pages compatibility
2. Vanilla JavaScript / ES module simplicity
3. PFRA 2026 scoring correctness
4. Maintainability
5. Minimal dependency growth

Do not ask for approval for routine refactors, file moves, naming improvements, module extraction, test additions, documentation updates, or cleanup.

Ask only when:

- A scoring rule is ambiguous
- Two source documents conflict
- A change would remove a major user-facing feature
- A dependency/framework migration is being considered
- A destructive action cannot be safely reversed

## Technical Guardrails

- Do not introduce a framework.
- Do not introduce TypeScript.
- Keep the app static-hostable on GitHub Pages.
- Prefer vanilla ES modules for new browser code.
- Preserve or repair PWA/offline behavior.
- Preserve the legacy calculator path unless a later migration explicitly removes it.
- Treat `standards/af-pfra-2026.json` as the long-term PFRA source of truth.
- Keep DOM/UI code out of pure scoring functions.
- Update documentation as architecture changes.

## Verification

Run `npm test` after each major implementation phase. The test suite should validate PFRA scoring examples, rebuild the service worker, validate required offline assets, and run browser regressions.

If tests fail, fix them before moving on unless the failure is clearly pre-existing and documented in `docs/SESSION_LOG.md` and `docs/TODO.md`.

