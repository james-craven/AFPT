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

function normalize(text) {
  return text.replace(/≤/g, '<=').replace(/\s+/g, ' ').trim();
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

        if (request.method === 'HEAD') {
          response.end();
          return;
        }

        fs.createReadStream(filePath, { start, end }).pipe(response);
        return;
      }

      response.writeHead(200, {
        ...headers,
        'Content-Length': stat.size,
      });

      if (request.method === 'HEAD') {
        response.end();
        return;
      }

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
    if (message.type() === 'error') {
      failures.push(`console error: ${message.text()}`);
    }
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

  async function closeIfVisible(selector) {
    const target = page.locator(selector);
    if (await target.count() === 1 && await target.isVisible()) {
      await target.evaluate((element) => element.click());
    }
  }

  await closeIfVisible('#dev-version-close');
  await closeIfVisible('#install-close');
  await page.evaluate(() => {
    const devModal = document.getElementById('dev-version-modal');
    const installModal = document.getElementById('install-modal');
    if (devModal) devModal.hidden = true;
    if (installModal) installModal.style.display = 'none';
  });

  return { context, failures, page };
}

async function text(page, selector) {
  return normalize(await page.locator(selector).innerText());
}

async function inputValue(page, selector) {
  return page.locator(selector).inputValue();
}

async function setControlValue(page, selector, value, eventName = 'input') {
  await page.locator(selector).evaluate(
    (element, { eventName: name, value: nextValue }) => {
      element.value = String(nextValue);
      element.dispatchEvent(new Event(name, { bubbles: true }));
    },
    { eventName, value },
  );
}

async function assertNoBrowserFailures(failures, label) {
  assert.deepEqual(failures, [], `${label} browser errors`);
}

async function openSettingsHub(page) {
  const panel = page.locator('#settings-hub-panel');
  if (await panel.isHidden()) {
    await page.locator('#settings-hub-toggle').click();
  }
  await page.waitForFunction(() => !document.getElementById('settings-hub-panel')?.hidden);
}

async function closeSettingsHub(page) {
  const panel = page.locator('#settings-hub-panel');
  if (await panel.isVisible()) {
    await page.locator('#settings-hub-close').click();
  }
  await page.waitForFunction(() => document.getElementById('settings-hub-panel')?.hidden);
}

async function assertSettingsHubParity(page) {
  const buttonBox = await page.locator('#settings-hub-toggle').boundingBox();
  assert.ok(buttonBox, 'settings hub button has a click target');
  assert.ok(buttonBox.width >= 44, 'settings hub button is at least 44px wide');
  assert.ok(buttonBox.height >= 44, 'settings hub button is at least 44px tall');

  const scoreBefore = await text(page, '#run-txt-p');
  const sliderBefore = await inputValue(page, '#run-slider');
  const x = buttonBox.x + (buttonBox.width / 2);
  const y = buttonBox.y + buttonBox.height - 4;

  await page.mouse.click(x, y);
  await page.waitForFunction(() => !document.getElementById('settings-hub-panel')?.hidden);
  assert.equal(await page.locator('#settings-hub-toggle').getAttribute('aria-expanded'), 'true');
  assert.equal(await text(page, '#run-txt-p'), scoreBefore, 'opening settings preserves score text');
  assert.equal(await inputValue(page, '#run-slider'), sliderBefore, 'opening settings preserves slider value');

  await page.locator('#run-adjust-chart').click();
  await page.waitForFunction(() => {
    const modal = document.getElementById('modal');
    const image = document.getElementById('modal-img');
    return modal && !modal.hasAttribute('hidden') && image?.src.includes('runAltitudeAdjust.webp');
  });
  await page.locator('#close-btn').click();

  await openSettingsHub(page);
  await page.locator('#shuttle-audio-menu').click();
  await page.waitForFunction(() => getComputedStyle(document.getElementById('shuttle-audio-player')).display !== 'none');
  assert.match(
    await page.locator('#shuttle-audio-control').getAttribute('src'),
    /shuttle\.mp3$/,
    'shuttle audio remains reachable from settings',
  );

  assert.equal(await page.locator('#install-app-menu').count(), 1, 'install control is present');
  assert.equal(await page.locator('#pwa-update-check').count(), 1, 'PWA update check is present');
  assert.equal(await page.evaluate(() => typeof window.afptPwa?.checkForUpdates), 'function', 'PWA update API is exposed');
  assert.equal(await page.locator('#dev-version-menu').count(), 1, 'build info control is present');

  await closeSettingsHub(page);
  assert.equal(await page.locator('#settings-hub-toggle').getAttribute('aria-expanded'), 'false');
  assert.equal(await text(page, '#run-txt-p'), scoreBefore, 'closing settings preserves score text');
  assert.equal(await inputValue(page, '#run-slider'), sliderBefore, 'closing settings preserves slider value');
}

async function setThemePreset(page, preset) {
  await page.waitForFunction(() => window.afptTheme && document.getElementById('theme-preset-select'));
  await openSettingsHub(page);

  await page.locator('#theme-preset-select').selectOption(preset);
  await page.waitForFunction(
    (expectedPreset) => document.documentElement.dataset.themePreset === expectedPreset,
    preset,
  );
  await closeSettingsHub(page);
}

async function assertThemeFoundation(page, nextPreset) {
  await page.waitForFunction(() => window.afptTheme && document.documentElement.dataset.themePreset);

  assert.equal(
    await page.locator('html').getAttribute('data-theme-preset'),
    'tactical',
    'default theme preset is applied',
  );
  assert.equal(
    await page.locator('body').getAttribute('data-theme-preset'),
    'tactical',
    'default body theme preset is applied',
  );

  const registryStatus = await page.evaluate(() => Object.fromEntries(
    Object.keys(window.afptTheme.THEME_PRESETS).map((presetId) => {
      const resolved = window.afptTheme.resolveThemePreset(presetId);
      return [presetId, resolved.validation];
    }),
  ));

  for (const [presetId, validation] of Object.entries(registryStatus)) {
    assert.equal(validation.isValid, true, `${presetId} preset resolves to registered variants`);
    assert.deepEqual(validation.incompatibleVariants, [], `${presetId} preset variants match their slots`);
    assert.deepEqual(validation.missingSlots, [], `${presetId} preset has all slots`);
    assert.deepEqual(validation.unknownVariants, [], `${presetId} preset has known variants`);
  }

  const scoreBefore = await text(page, '#run-txt-p');
  const sliderBefore = await inputValue(page, '#run-slider');
  await setThemePreset(page, nextPreset);

  assert.equal(await page.locator('html').getAttribute('data-theme-preset'), nextPreset);
  assert.equal(await page.locator('body').getAttribute('data-theme-preset'), nextPreset);
  assert.equal(
    await page.evaluate(() => localStorage.getItem(window.afptTheme.THEME_STORAGE_KEY)),
    nextPreset,
    'theme preset persists locally',
  );
  assert.equal(await text(page, '#run-txt-p'), scoreBefore, 'theme switch preserves score text');
  assert.equal(await inputValue(page, '#run-slider'), sliderBefore, 'theme switch preserves slider value');
}

async function runLegacyRegression(browser, baseUrl, label, contextOptions = {}) {
  const { context, failures, page } = await newPage(browser, baseUrl, `?no-sw=1&qa=legacy-regression-${label}`, contextOptions);

  await assertSettingsHubParity(page);

  assert.equal(await inputValue(page, '#run-slider'), '1136');
  assert.equal(await text(page, '#run-txt-p'), 'Run Score: 35 | Min: 18:56 | Max: 10:23');
  await assertThemeFoundation(page, 'stencil');

  await page.locator('#push-txt').fill('47');
  await page.locator('#push-tick').click();
  if (await inputValue(page, '#push-txt') !== '15') {
    const debug = await page.locator('#push-tick').evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const hit = document.elementFromPoint(centerX, centerY);
      return {
        rect: {
          height: rect.height,
          left: rect.left,
          top: rect.top,
          width: rect.width,
        },
        hitId: hit?.id,
        hitTag: hit?.tagName,
        hitText: hit?.textContent,
      };
    });
    throw new Error(`Push minimum tick did not fire: ${JSON.stringify(debug)}`);
  }
  assert.equal(await inputValue(page, '#push-txt'), '15');
  assert.equal(await inputValue(page, '#push-slider'), '15');

  await page.locator('#sit-txt').fill('54');
  await page.locator('#sit-tick').click();
  assert.equal(await inputValue(page, '#sit-txt'), '35');
  assert.equal(await inputValue(page, '#sit-slider'), '35');

  await page.locator('#cardio-sel').selectOption('Shuttle Run');
  await setControlValue(page, '#run-slider', 83);
  await page.locator('#run-tick').click();
  assert.equal(await inputValue(page, '#run-slider'), '22');
  assert.equal(await text(page, '#run-txt-p'), 'Run Score: 35 | Min: 22 | Max: 83');

  await page.locator('#cardio-sel').selectOption('1.5 Mile');
  assert.equal(await text(page, '#run-lap-times'), "Req'd 6 Lap Time: ~3:09 Lap 1: <= 3:09 Lap 2: <= 6:18 Lap 3: <= 9:27 Lap 4: <= 12:36 Lap 5: <= 15:45 Lap 6: <= 18:54");

  await assertNoBrowserFailures(failures, `${label} legacy regression`);
  await context.close();
}

async function runPfraRegression(browser, baseUrl, label, contextOptions = {}) {
  const { context, failures, page } = await newPage(browser, baseUrl, `?no-sw=1&qa=pfra-regression-${label}`, contextOptions);

  await page.locator('#standards-mode').selectOption('pfra');
  assert.equal(
    await page.locator('#cardio-sel').evaluate((select) => Array.from(select.options).map((option) => option.text).join(' ')),
    '2 Mile 20m HAMR 2 km Walk Exempt',
  );

  assert.equal(await text(page, '#push-txt-p'), 'Strength Score: 0 | Min: 15 | Max: 50');
  assert.equal(await text(page, '#sit-txt-p'), 'Core Score: 0 | Min: 29 | Max: 54');
  assert.equal(await text(page, '#run-txt-p'), 'Cardio Score: 35 | Min: 25:23 | Max: 15:30');
  assert.equal(await inputValue(page, '#run-slider'), '1523');
  assert.equal(await inputValue(page, '#run-mintxt'), '25');
  assert.equal(await inputValue(page, '#run-sectxt'), '23');
  assert.equal(await text(page, '#run-lap-times'), "Req'd 8 Lap Time: ~3:10 Lap 1: <= 3:10 Lap 2: <= 6:20 Lap 3: <= 9:31 Lap 4: <= 12:41 Lap 5: <= 15:51 Lap 6: <= 19:02 Lap 7: <= 22:12 Lap 8: <= 25:23");
  await assertThemeFoundation(page, 'fitness');

  await page.locator('#push-txt').fill('50');
  await page.locator('#push-tick').click();
  assert.equal(await inputValue(page, '#push-txt'), '15');
  assert.equal(await inputValue(page, '#push-slider'), '15');

  await page.locator('#sit-txt').fill('54');
  await page.locator('#sit-tick').click();
  assert.equal(await inputValue(page, '#sit-txt'), '29');
  assert.equal(await inputValue(page, '#sit-slider'), '29');

  await page.locator('#cardio-sel').selectOption('Shuttle Run');
  assert.equal(await text(page, '#run-txt-p'), 'Cardio Score: 35 | Min: 21 | Max: 68');
  assert.equal(await inputValue(page, '#run-slider'), '21');
  await setControlValue(page, '#run-slider', 68);
  await page.locator('#run-tick').click();
  assert.equal(await inputValue(page, '#run-slider'), '21');
  assert.equal(await inputValue(page, '#run-sectxt'), '21');

  await page.locator('#cardio-sel').selectOption('1.5 Mile');
  await page.locator('#run-mintxt').fill('20');
  await page.locator('#run-sectxt').fill('00');
  if (await inputValue(page, '#run-slider') !== '1200') {
    const debug = await page.evaluate(() => ({
      cardio: document.getElementById('cardio-sel')?.value,
      max: document.getElementById('run-slider')?.max,
      min: document.getElementById('run-slider')?.min,
      minute: document.getElementById('run-mintxt')?.value,
      second: document.getElementById('run-sectxt')?.value,
      slider: document.getElementById('run-slider')?.value,
      text: document.getElementById('run-txt-p')?.innerText,
    }));
    throw new Error(`PFRA run text entry did not update slider: ${JSON.stringify(debug)}`);
  }
  assert.equal(await inputValue(page, '#run-slider'), '1200');
  await page.locator('#age-sel').selectOption('30-34');
  assert.equal(await inputValue(page, '#run-slider'), '1200');
  assert.equal(await inputValue(page, '#run-mintxt'), '20');
  assert.equal(await inputValue(page, '#run-sectxt'), '00');

  await page.locator('#standards-mode').selectOption('legacy');
  assert.equal(
    await page.locator('#cardio-sel').evaluate((select) => Array.from(select.options).map((option) => option.text).join(' ')),
    '1.5 Mile Shuttle Run Walk Exempt',
  );
  assert.match(await text(page, '#run-lap-times'), /Req'd 6 Lap Time/);

  await assertNoBrowserFailures(failures, `${label} PFRA regression`);
  await context.close();
}

async function runOfflineRegression(browser, baseUrl) {
  const { context, failures, page } = await newPage(browser, baseUrl, '?sw=1&qa=offline-prime');

  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });

  await page.reload({ waitUntil: 'load' });
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });

  await context.setOffline(true);
  await page.goto(`${baseUrl}/?sw=1&qa=offline-reload`, { waitUntil: 'load' });
  await page.waitForFunction(
    () => document.querySelector('#pfra-status')?.textContent.includes('Standards loaded'),
    undefined,
    { timeout: 10000 },
  );

  assert.match(await text(page, '.logo'), /AFPTCalc/);
  await page.locator('#standards-mode').selectOption('pfra');
  assert.equal(await text(page, '#run-txt-p'), 'Cardio Score: 35 | Min: 25:23 | Max: 15:30');

  await context.setOffline(false);
  await assertNoBrowserFailures(failures, 'Offline regression');
  await context.close();
}

if (!(await fileExists(chromePath))) {
  throw new Error(`Chrome executable not found at ${chromePath}. Set CHROME_PATH to run browser regressions.`);
}

const server = await createStaticServer();
const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
});

try {
  await runLegacyRegression(browser, server.baseUrl, 'desktop');
  await runPfraRegression(browser, server.baseUrl, 'desktop');
  await runLegacyRegression(browser, server.baseUrl, 'mobile', {
    deviceScaleFactor: 3,
    hasTouch: true,
    isMobile: true,
    viewport: { width: 390, height: 844 },
  });
  await runPfraRegression(browser, server.baseUrl, 'mobile', {
    deviceScaleFactor: 3,
    hasTouch: true,
    isMobile: true,
    viewport: { width: 390, height: 844 },
  });
  await runOfflineRegression(browser, server.baseUrl);
  console.log('Browser regressions passed');
} finally {
  await browser.close();
  await server.close();
}
