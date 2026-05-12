import assert from 'node:assert/strict';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright-core';

const rootDir = process.cwd();
const chromePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.png': 'image/png',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.webp': 'image/webp',
};

function contentTypeFor(filePath) {
  return contentTypes[path.extname(filePath)] || 'application/octet-stream';
}

async function fileExists(filePath) {
  try {
    await fsp.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function createStaticServer() {
  const server = http.createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url, 'http://127.0.0.1');
      const decodedPath = decodeURIComponent(requestUrl.pathname);
      const relativePath = decodedPath === '/' ? 'index.html' : decodedPath.replace(/^\/+/, '');
      const filePath = path.resolve(rootDir, relativePath);

      if (!filePath.startsWith(rootDir)) {
        response.writeHead(403);
        response.end('Forbidden');
        return;
      }

      const stat = await fsp.stat(filePath);
      if (!stat.isFile()) {
        response.writeHead(404);
        response.end('Not found');
        return;
      }

      const headers = {
        'Accept-Ranges': 'bytes',
        'Content-Type': contentTypeFor(filePath),
      };

      const range = request.headers.range;
      if (range) {
        const match = range.match(/^bytes=(\d*)-(\d*)$/);
        if (!match) {
          response.writeHead(416);
          response.end();
          return;
        }
        const start = match[1] ? Number(match[1]) : 0;
        const end = match[2] ? Number(match[2]) : stat.size - 1;
        const chunkSize = end - start + 1;
        response.writeHead(206, {
          ...headers,
          'Content-Length': chunkSize,
          'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        });
        if (request.method === 'HEAD') { response.end(); return; }
        fs.createReadStream(filePath, { start, end }).pipe(response);
        return;
      }

      response.writeHead(200, { ...headers, 'Content-Length': stat.size });
      if (request.method === 'HEAD') { response.end(); return; }
      fs.createReadStream(filePath).pipe(response);
    } catch {
      response.writeHead(404);
      response.end('Not found');
    }
  });

  return new Promise((resolve) => {
    server.listen(0, () => {
      const address = server.address();
      resolve({
        baseUrl: `http://127.0.0.1:${address.port}`,
        close: () => new Promise((closeResolve) => server.close(closeResolve)),
      });
    });
  });
}

async function newPage(browser, baseUrl, query, contextOptions = {}) {
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  const failures = [];

  page.on('console', (message) => {
    if (message.type() === 'error') failures.push(`console error: ${message.text()}`);
  });
  page.on('pageerror', (error) => {
    failures.push(`page error: ${error.message}`);
  });

  await page.goto(`${baseUrl}/${query}`, { waitUntil: 'load' });
  await page.waitForFunction(
    () => document.querySelector('#pfra-status')?.textContent.includes('Standards loaded'),
    undefined,
    { timeout: 10000 },
  );

  // Dismiss any startup modals
  await page.evaluate(() => {
    const devModal = document.getElementById('dev-version-modal');
    const installModal = document.getElementById('install-modal');
    if (devModal) devModal.hidden = true;
    if (installModal) installModal.hidden = true;
  });

  return { context, failures, page };
}

async function assertNoBrowserFailures(failures, label) {
  assert.deepEqual(failures, [], `${label} browser errors`);
}

async function runSmokeTests(browser, baseUrl, label, contextOptions = {}) {
  const { context, failures, page } = await newPage(
    browser, baseUrl, `?no-sw=1&qa=smoke-${label}`, contextOptions,
  );

  // 1. App loaded and standards ready
  const isReady = await page.evaluate(() => window.afptApp?.isReady());
  assert.equal(isReady, true, 'standards loaded and app is ready');
  assert.equal(await page.evaluate(() => window.afptApp?.getLoadError()), null, 'no standards load error');

  // 2. Score computes from initial state
  const initialResult = await page.evaluate(() => window.afptApp?.getScoreResult());
  assert.ok(initialResult !== null, 'getScoreResult returns a result');
  assert.ok(typeof initialResult?.total === 'number', 'score result has a numeric total');

  // 3. Score header shows a value
  const scoreTxt = await page.evaluate(() => document.getElementById('score-txt')?.textContent?.trim());
  assert.ok(scoreTxt && scoreTxt !== '--', `score-txt shows a value: ${scoreTxt}`);

  // 4. Sex change triggers score update
  const scoreBefore = await page.evaluate(() => document.getElementById('score-txt')?.textContent?.trim());
  await page.evaluate(() => {
    const sel = document.getElementById('sex-sel');
    sel.value = 'male';
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.waitForTimeout(100);
  const scoreAfterMale = await page.evaluate(() => document.getElementById('score-txt')?.textContent?.trim());
  assert.ok(scoreAfterMale !== '--', 'score updates after sex change');

  // Restore
  await page.evaluate(() => {
    const sel = document.getElementById('sex-sel');
    sel.value = 'female';
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.waitForTimeout(50);

  // 5. Age change triggers score update
  const scoreBeforeAge = await page.evaluate(() => document.getElementById('score-txt')?.textContent?.trim());
  await page.evaluate(() => {
    const sel = document.getElementById('age-sel');
    sel.value = '40-44';
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.waitForTimeout(100);
  const scoreAfterAge = await page.evaluate(() => document.getElementById('score-txt')?.textContent?.trim());
  assert.ok(scoreAfterAge !== '--', 'score updates after age change');
  assert.notEqual(scoreAfterAge, scoreBeforeAge, 'age change affects score');

  // Restore
  await page.evaluate(() => {
    const sel = document.getElementById('age-sel');
    sel.value = 'under-25';
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.waitForTimeout(50);

  // 6. Component tabs switch panels
  const strengthVisible = await page.evaluate(() => !document.getElementById('strength-editor')?.hasAttribute('hidden'));
  assert.equal(strengthVisible, true, 'strength editor visible by default');

  await page.locator('#summary-core').click();
  await page.waitForFunction(() => !document.getElementById('core-editor')?.hasAttribute('hidden'));
  const coreVisible = await page.evaluate(() => !document.getElementById('core-editor')?.hasAttribute('hidden'));
  assert.equal(coreVisible, true, 'core editor visible after clicking CORE chip');
  const strHidden = await page.evaluate(() => document.getElementById('strength-editor')?.hasAttribute('hidden'));
  assert.equal(strHidden, true, 'strength editor hidden after switching to core');

  await page.locator('#summary-cardio').click();
  await page.waitForFunction(() => !document.getElementById('cardio-editor')?.hasAttribute('hidden'));
  const cardioVisible = await page.evaluate(() => !document.getElementById('cardio-editor')?.hasAttribute('hidden'));
  assert.equal(cardioVisible, true, 'cardio editor visible after clicking RUN chip');

  await page.locator('#summary-strength').click();
  await page.waitForFunction(() => !document.getElementById('strength-editor')?.hasAttribute('hidden'));

  // 6b. Pace plan section is always present in DOM (not hidden when switching editors)
  const pacePlanSection = await page.evaluate(() => !!document.querySelector('.pace-plan-section'));
  assert.equal(pacePlanSection, true, 'pace-plan-section exists in DOM');
  const lapDisplayExists = await page.evaluate(() => !!document.getElementById('run-lap-times'));
  assert.equal(lapDisplayExists, true, 'run-lap-times exists outside editors-container');
  const lapDisplayInsideEditors = await page.evaluate(
    () => !!document.querySelector('.editors-container #run-lap-times'),
  );
  assert.equal(lapDisplayInsideEditors, false, 'run-lap-times is NOT inside editors-container');

  // 7. Altitude via dispatch changes cardio score
  const { cardioSeaLevel, cardioAlt4 } = await page.evaluate(() => {
    window.afptApp.dispatch({ type: 'SET_CARDIO_EVENT', event: 'two-mile-run' });
    window.afptApp.dispatch({ type: 'SET_CARDIO_VALUE', value: '25:23' });
    window.afptApp.dispatch({ type: 'SET_ALTITUDE_GROUP', group: 0 });
    const seaLevel = window.afptApp.getScoreResult()?.scores?.cardio ?? null;
    window.afptApp.dispatch({ type: 'SET_ALTITUDE_GROUP', group: 4 });
    const alt4 = window.afptApp.getScoreResult()?.scores?.cardio ?? null;
    window.afptApp.refreshStateFromDom();
    return { cardioSeaLevel: seaLevel, cardioAlt4: alt4 };
  });
  assert.ok(cardioSeaLevel !== null, 'sea-level cardio score computes');
  assert.ok(cardioAlt4 !== null, 'altitude cardio score computes');
  assert.notEqual(cardioAlt4, cardioSeaLevel, 'altitude Group 4 changes cardio score for two-mile-run');

  // 8. Theme switch changes data-theme-preset
  const settingsBtn = page.locator('#settings-hub-toggle');
  await settingsBtn.click();
  await page.waitForFunction(() => !document.getElementById('settings-hub-panel')?.hidden);
  await page.locator('#theme-preset-select').selectOption('blues');
  await page.waitForFunction(() => document.documentElement.dataset.themePreset === 'blues');
  const themeApplied = await page.evaluate(() => document.documentElement.dataset.themePreset);
  assert.equal(themeApplied, 'blues', 'theme preset changed to blues');

  // Restore theme
  await page.locator('#theme-preset-select').selectOption('tactical');
  await page.waitForFunction(() => document.documentElement.dataset.themePreset === 'tactical');
  await page.locator('#settings-hub-close').click();
  await page.waitForFunction(() => document.getElementById('settings-hub-panel')?.hidden);

  // 9. Chart drawer opens with generated table and closes
  const pushBtn = page.locator('#push-btn');
  await pushBtn.click();
  await page.waitForFunction(() => !document.getElementById('modal')?.hasAttribute('hidden'));
  const chartOpen = await page.evaluate(() => document.getElementById('modal')?.dataset.chartOpen);
  assert.equal(chartOpen, 'true', 'chart drawer opens on push-btn click');
  const hasChartTable = await page.evaluate(() => !!document.querySelector('#chart-content .chart-table'));
  assert.equal(hasChartTable, true, 'chart drawer contains generated score table');
  const chartHasNaN = await page.evaluate(
    () => document.getElementById('chart-content')?.textContent?.includes('NaN'),
  );
  assert.equal(chartHasNaN, false, 'chart content does not contain NaN');
  await page.locator('#close-btn').click();
  await page.waitForFunction(() => document.getElementById('modal')?.hasAttribute('hidden'));
  const chartClosed = await page.evaluate(() => document.getElementById('modal')?.hasAttribute('hidden'));
  assert.equal(chartClosed, true, 'chart drawer closes on close-btn click');

  // 9b. Cardio chart does not contain NaN:NaN
  await page.locator('#summary-cardio').click();
  await page.waitForFunction(() => !document.getElementById('cardio-editor')?.hasAttribute('hidden'));
  const runBtn = page.locator('#run-btn');
  await runBtn.click();
  await page.waitForFunction(() => !document.getElementById('modal')?.hasAttribute('hidden'));
  const cardioChartHasNaN = await page.evaluate(
    () => document.getElementById('chart-content')?.textContent?.includes('NaN'),
  );
  assert.equal(cardioChartHasNaN, false, 'cardio chart does not contain NaN');
  await page.locator('#close-btn').click();
  await page.waitForFunction(() => document.getElementById('modal')?.hasAttribute('hidden'));
  await page.locator('#summary-strength').click();
  await page.waitForFunction(() => !document.getElementById('strength-editor')?.hasAttribute('hidden'));

  // 10. PWA API accessible
  assert.equal(
    await page.evaluate(() => typeof window.afptPwa?.checkForUpdates),
    'function',
    'PWA update API is exposed',
  );

  await assertNoBrowserFailures(failures, `${label} smoke`);
  await context.close();
}

async function runOfflineSmoke(browser, baseUrl) {
  const { context, failures, page } = await newPage(browser, baseUrl, '?sw=1&qa=offline-smoke');

  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload({ waitUntil: 'load' });
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });

  await context.setOffline(true);
  await page.goto(`${baseUrl}/?sw=1&qa=offline-reload`, { waitUntil: 'load' });
  await page.waitForFunction(
    () => document.querySelector('#pfra-status')?.textContent.includes('Standards loaded'),
    undefined,
    { timeout: 10000 },
  );

  const result = await page.evaluate(() => window.afptApp?.getScoreResult());
  assert.ok(result !== null, 'app scores while offline');

  await context.setOffline(false);
  await assertNoBrowserFailures(failures, 'offline smoke');
  await context.close();
}

if (!(await fileExists(chromePath))) {
  throw new Error(`Chrome executable not found at ${chromePath}. Set CHROME_PATH to run browser regressions.`);
}

const server = await createStaticServer();
const browser = await chromium.launch({ executablePath: chromePath, headless: true });

try {
  await runSmokeTests(browser, server.baseUrl, 'desktop');
  await runSmokeTests(browser, server.baseUrl, 'mobile', {
    deviceScaleFactor: 3,
    hasTouch: true,
    isMobile: true,
    viewport: { width: 390, height: 844 },
  });
  await runOfflineSmoke(browser, server.baseUrl);
  console.log('Browser smoke tests passed');
} finally {
  await browser.close();
  await server.close();
}
