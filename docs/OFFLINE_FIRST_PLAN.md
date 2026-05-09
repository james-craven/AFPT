# Offline-First Modernization Plan

The production goal is a static, installable PWA that works indefinitely after the first successful load and checks for updates whenever a user reconnects.

## 1. Keep The Deployment Simple

- Keep the app static-hostable on GitHub Pages and the custom domain.
- Avoid a native iOS/Android app unless app-store distribution becomes a hard requirement.
- Keep local development service-worker-free by default to avoid stale cache confusion.

## 2. Cache The Full App Shell

- Precache `index.html`, CSS, JavaScript, manifest, icons, scoring images, PFRA standards JSON, and shuttle audio.
- Exclude development dependencies, source PDFs, extraction notes, package metadata, and unused alternate audio formats from the production cache.
- Ignore `v`, `ts`, and QA query strings so cache-busted local URLs still resolve offline.

## 3. Update When Online

- Register the service worker on HTTPS production pages.
- Check for an update on load, when the app comes back online, and when the tab becomes visible.
- Show a small update prompt when a newer offline bundle is ready.
- Reload only after the user accepts the update, so score entry is not interrupted unexpectedly.

## 4. Preserve Local Development Ergonomics

- On localhost, unregister stale service workers by default.
- Allow local service-worker testing with `?sw=1`.
- Allow the temporary build timestamp modal only on localhost or with `?dev-build=1`.

## 5. Verify The Offline Contract

- Keep PFRA scoring data tests.
- Regenerate `sw.js` during tests.
- Validate that the service worker precaches required offline assets and does not precache dependency/source-only files.

## 6. Later Modernization Passes

- Move legacy scoring tables out of `main2.js` into versioned JSON data.
- Split calculation, DOM binding, and UI state into separate ES modules.
- Add browser-level regression tests for slider behavior, standard switching, and offline reloads.
- Add PDF/OCR standards import with PDF.js and Tesseract.js only behind a review/confirm workflow.
