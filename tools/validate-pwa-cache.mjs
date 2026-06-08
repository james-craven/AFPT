import assert from 'node:assert/strict';
import fs from 'node:fs';

const serviceWorker = fs.readFileSync('sw.js', 'utf8');

const requiredAssets = [
  'index.html',
  'style.css',
  'src/pfra/app.mjs',
  'src/pfra/pacer-audio.mjs',
  'src/pfra/scoring.mjs',
  'src/pfra/standards.mjs',
  'src/pfra/state.mjs',
  'src/ui/layout-variants.mjs',
  'src/ui/guided-tour.mjs',
  'src/ui/settings-hub.mjs',
  'src/ui/theme-controller.mjs',
  'pwa-loader.js',
  'pwa.js',
  'sw-audio-cache.js',
  'manifest.webmanifest',
  'dev-build-info.json',
  'arrow.webp',
  'pushups.webp',
  'running.webp',
  'situps.webp',
  'standards/af-pfra-2026.json',
  'standards/extracted/tables/push-up.json',
  'standards/extracted/tables/two-mile-run.json',
  'standards/extracted/tables/hamr-20-meter.json',
  'standards/sources/pfra-score-pages/pfra-scoring-page-02.webp',
  'standards/sources/pfra-score-pages/pfra-scoring-page-03.webp',
  'standards/sources/pfra-score-pages/pfra-scoring-page-04.webp',
  'standards/sources/pfra-score-pages/pfra-scoring-page-05.webp',
  'standards/sources/pfra-score-pages/pfra-scoring-page-06.webp',
  'standards/sources/pfra-score-pages/pfra-scoring-page-07.webp',
  'standards/sources/pfra-score-pages/pfra-scoring-page-08.webp',
  'standards/sources/pfra-score-pages/pfra-scoring-page-10.webp',
  'standards/sources/ShuttleLevels.webp',
  'standards/sources/a31-crops/dafman-36-2905-2-page1-full.webp',
  'standards/sources/a31-crops/dafman-36-2905-2-page2-full.webp',
];

const excludedAssets = [
  'node_modules/',
  'package-lock.json',
  'standards/sources/PFRA-Scoring-Charts.pdf',
  'standards/sources/Pages from DAFMAN 36-2905.pdf',
  'standards/sources/Pages from DAFMAN 36-2905-2.pdf',
  'standards/sources/extracted-text/',
  'standards/sources/a31-crops/a31-rows',
  'standards/extracted/PFRA-Scoring-Charts.txt',
  'shuttle.mp3',
  'shuttle.m4a',
  'shuttle.ogg',
  'standards/sources/pfra-score-pages/pfra-scoring-page-02.jpg',
  'standards/sources/pfra-score-pages/pfra-scoring-page-03.jpg',
  'standards/sources/pfra-score-pages/pfra-scoring-page-04.jpg',
  'standards/sources/pfra-score-pages/pfra-scoring-page-05.jpg',
  'standards/sources/pfra-score-pages/pfra-scoring-page-06.jpg',
  'standards/sources/pfra-score-pages/pfra-scoring-page-07.jpg',
  'standards/sources/pfra-score-pages/pfra-scoring-page-08.jpg',
  'standards/sources/pfra-score-pages/pfra-scoring-page-10.jpg',
  'standards/sources/ShuttleLevels.jpeg',
  'standards/sources/a31-crops/dafman-36-2905-2-page1-full.png',
  'standards/sources/a31-crops/dafman-36-2905-2-page2-full.png',
];

for (const asset of requiredAssets) {
  assert(
    serviceWorker.includes(asset),
    `Expected sw.js to precache ${asset}`,
  );
}

for (const asset of excludedAssets) {
  assert(
    !serviceWorker.includes(asset),
    `Expected sw.js not to precache ${asset}`,
  );
}

console.log(`Validated ${requiredAssets.length} required offline assets`);
