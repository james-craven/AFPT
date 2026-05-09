import assert from 'node:assert/strict';
import fs from 'node:fs';

const serviceWorker = fs.readFileSync('sw.js', 'utf8');

const requiredAssets = [
  'index.html',
  'style.css',
  'main2.js',
  'pfra-calculator.js',
  'pwa.js',
  'manifest.webmanifest',
  'dev-build-info.json',
  'shuttle.mp3',
  'pushups.png',
  'running.png',
  'situps.png',
  'standards/af-pfra-2026.json',
  'standards/extracted/tables/push-up.json',
  'standards/extracted/tables/two-mile-run.json',
  'standards/extracted/tables/hamr-20-meter.json',
  'web formatted jpgs/shuttleScores.webp',
  'web formatted jpgs/runAltitudeAdjust.webp',
];

const excludedAssets = [
  'node_modules/',
  'package-lock.json',
  'standards/sources/',
  'standards/sources/PFRA-Scoring-Charts.pdf',
  'standards/extracted/PFRA-Scoring-Charts.txt',
  'shuttle.m4a',
  'shuttle.ogg',
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
