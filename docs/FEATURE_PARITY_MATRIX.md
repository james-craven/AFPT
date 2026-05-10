# Feature Parity Matrix

The redesign is successful only if every row in docs/FEATURE_PARITY_MATRIX.md is marked Implemented, Deferred by explicit decision, or Not Applicable, with a verification method.

Status values during planning:

- `Planned`: must be preserved or implemented during redesign.
- `Implemented`: completed in the current codebase.
- `Optional`: desirable, but not required for first parity.
- `Mock-only`: visual exploration scaffolding that should not ship.
- `Later`: planned after theme preset parity.

| Existing Feature | Current File/Function | New UI Location | Status | Verification |
|---|---|---|---|---|
| Static GitHub Pages app shell | `index.html` | New app shell | Planned | `npm test`, local load |
| Mobile-first layout | `style.css`, browser tests | New responsive shell/cards | Planned | Browser regression desktop/mobile screenshots/checks |
| Legacy calculator access | `standards-mode`, `main2.js`, `window.afptLegacy` | Header standards selector | Implemented | Browser test switches PFRA -> legacy |
| PFRA calculator access | `standards-mode`, `pfra-calculator.js` | Header standards selector | Implemented | Browser test switches legacy -> PFRA |
| Sex selector | `#sex-sel`, `main2.js`, `src/pfra/dom.mjs` | Header demographic controls | Implemented | Browser test changes sex and score labels/ranges update |
| Age selector | `#age-sel`, `main2.js`, `src/pfra/state.mjs` | Header demographic controls | Implemented | Browser test changes age and preserves edited values where expected |
| Standard selector | `#standards-mode` | Header demographic controls | Implemented | Browser test validates option text and behavior |
| Score total | `#score-txt`, `updateScoreMinMaxText`, `renderPfraMainScore`, `src/ui/score-header.mjs` | Score-first header | Implemented | Browser test validates legacy/PFRA score header mirrors real score source |
| Status text/badge | `#score-txt`, category logic, `src/ui/score-header.mjs` | Header badge near score | Implemented | Browser test checks status comes from real score source |
| Development build timestamp modal | `#dev-version-modal`, `main2.js` | Settings/debug panel | Implemented | Browser test verifies control exists; local/dev modal still loads |
| PWA update modal | `#pwa-update-modal`, `pwa.js`, `window.afptPwa` | Settings update check plus existing modal | Implemented | Browser test verifies update control/API; offline regression still passes |
| Install prompt modal | `#install-modal`, `beforeinstallprompt`, `installApp` | Settings install affordance | Implemented | Browser test verifies install control exists; manual install prompt check |
| Hamburger/menu access | `#settings-hub-toggle`, `#settings-hub-panel`, `.settings-menu`, `main2.js` | Settings button/drawer | Implemented | Browser test for touch target, open/close, and menu controls |
| Run altitude adjustment chart | `#run-adjust-chart`, chart drawer image | Settings reference link and chart drawer | Implemented | Browser test opens drawer/image |
| Walk/shuttle altitude adjustment chart | `#walk-adjust-chart`, chart drawer image | Settings reference link and chart drawer | Implemented | Browser test opens drawer/image |
| Shuttle score card | `#shuttle-score-card`, chart drawer image | Settings reference link and chart drawer | Implemented | Browser test opens drawer/image |
| Shuttle audio player | `#shuttle-audio-menu`, `#shuttle-audio-control`, `shuttle.mp3` | Settings/audio section | Implemented | Browser test verifies audio element exists and asset is cached |
| Component chart modal | `#modal`, `#modal-img`, `#push-btn`, `#sit-btn`, `#run-btn`, `src/ui/chart-drawer.mjs` | Component score chart drawer | Implemented | Browser test opens chart drawer for strength/core/cardio |
| Strength event selection | `#push-sel`, `#pfra-strength-event` | Strength component card | Planned | Browser test switches Push-up/Hand-release/Exempt |
| Strength input | `#push-txt`, `#push-slider`, min tick | Strength component card controls | Planned | Browser test for text, slider, min tick, score updates |
| Core event selection | `#sit-sel`, `#pfra-core-event` | Core component card | Planned | Browser test switches Sit-up/Reverse Crunch/Plank/Exempt |
| Core input | `#sit-txt`, `#plankmintxt`, `#sit-slider`, min tick | Core component card controls | Planned | Browser test for reps, plank time, slider, score updates |
| Cardio event selection | `#cardio-sel`, `#pfra-cardio-event` | Cardio component card | Planned | Browser test switches run/HAMR/walk/exempt |
| Cardio time input | `#run-mintxt`, `#run-sectxt`, `#run-slider` | Cardio component card controls | Planned | Browser test for text entry and slider synchronization |
| HAMR shuttle input | `#shuttle-txt`, `#run-sectxt`, `#run-slider` | Cardio component card controls | Planned | Browser test for shuttle scoring and min tick |
| Walk input | `#walk-txt`, `#run-mintxt`, `#run-sectxt` | Cardio component card controls | Planned | Browser test for walk pass/fail |
| Exemptions | Existing `Exempt` options, legacy total normalization, PFRA exemptions | Component card event menus | Planned | Browser tests for strength/core/cardio exemption totals |
| Altitude adjustment selector | `#alt-select`, altitude helpers in `main2.js` | Cardio details/settings row | Planned | Browser test for legacy altitude score changes |
| Slider pass/fail color | `slider-green`, `slider-red`, PFRA UI helpers | Component card slider state | Planned | Browser test or visual assertion for class changes |
| Minimum threshold ticks | `#push-tick`, `#sit-tick`, `#run-tick` | Component card slider threshold marker | Planned | Existing browser tick-click tests |
| PFRA WHtR input | `#pfra-whtr`, `scoreWhtr` | Body composition card | Implemented | Browser test: WHtR visible in PFRA, changes update body/total score, hidden in legacy |
| PFRA component score grid | `#pfra-body-score`, `#pfra-strength-score`, `#pfra-core-score`, `#pfra-cardio-score` | Component card score chips | Planned | Browser test validates component scores |
| PFRA standards loading status | `#pfra-status`, `loadPfraStandards` | Settings/status row | Planned | Browser test waits for standards loaded |
| PFRA 2-mile labels | `renderCardioModeText`, `#cardio-sel` option text | Cardio card event labels | Planned | Existing browser test validates `2 Mile 20m HAMR 2 km Walk Exempt` |
| PFRA 8-lap timing | `renderPfraLapTimes`, `#run-lap-times`, `src/ui/lap-display.mjs` | Cardio run details through `lapDisplay` variant | Implemented | Browser test validates source rows and mirrored variant output |
| Legacy 6-lap timing | `changeLapTime`, `#run-lap-times`, `src/ui/lap-display.mjs` | Cardio run details through `lapDisplay` variant | Implemented | Browser test validates source rows and mirrored variant output |
| PWA manifest/icons | `manifest.webmanifest`, icon files | Unchanged app metadata | Planned | PWA cache validation |
| Offline precache | `workbox-config.js`, `sw.js` | Unchanged runtime | Planned | `npm test`, offline browser regression |
| Service-worker update flow | `pwa.js`, `sw.js` | Unchanged behavior, restyled prompt | Planned | PWA smoke test |
| Real PFRA scoring data | `standards/af-pfra-2026.json`, `standards/extracted/tables/*.json` | Data layer unchanged | Planned | `tools/validate-pfra-tables.mjs` |
| Browser regression suite | `tools/browser-regression.mjs` | Updated selectors as UI changes | Planned | `npm test` |
| Shared render/action contract | Current direct DOM wiring, PFRA modules | UI contract feeding all variants | Planned | Browser tests drive same actions through redesigned UI |
| Layout slot registry | `src/ui/layout-variants.mjs` | `appShell`, `scoreHeader`, cards, lap, chart, settings slots | Implemented | Registry validation and browser tests |
| Variant registry | `src/ui/layout-variants.mjs` | Slot-scoped renderer registry | Implemented | Registered variants resolve for all presets |
| Theme preset registry | `src/ui/layout-variants.mjs` | Presets choose slot variants | Implemented | Switching presets preserves score/state |
| Theme selector | `src/ui/theme-controller.mjs`, `#theme-preset-select` | Settings/control hub preset selector | Implemented | Browser test after implementation |
| Theme presets expose required features | Full mock layout set | Tactical, Stencil, Blues, Light, Fitness presets | Planned | `docs/THEME_PARITY_MATRIX.md` plus browser tests |
| Variant behavior parity | New variant system | All variants for a slot | Planned | Variant swap does not alter scoring or hide required controls |
| User layout overrides | Future customization | Settings customization panel | Later | Dev variant picker first, then persistence tests |
| Settings button | `src/ui/settings-hub.mjs`, mock header settings concept | Header settings drawer | Implemented | Browser test opens/closes settings |
| Donation/support link | Not currently implemented | Settings/about section | Optional | Manual link check if added |
| iOS/Android frame toggle | Mock `FrameToggle`, device frames | None in production | Mock-only | Not Applicable |
| Design canvas/artboards | `design-canvas.jsx` | None in production | Mock-only | Not Applicable |
| Mock seed data | `AFPT_DATA` | None in production | Mock-only | Not Applicable |
| React/Babel/CDN runtime | Mock HTML scripts | None in production | Mock-only | Not Applicable |
| Duplicated layout-per-theme calculators | Mock `UnifiedArtboard`, full mock pages | None in production | Mock-only | Not Applicable |
