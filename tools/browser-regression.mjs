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

async function assertHamburgerHitArea(page) {
  const buttonBox = await page.locator('.menu-btn-container').boundingBox();
  assert.ok(buttonBox, 'hamburger button has a click target');

  const x = buttonBox.x + (buttonBox.width / 2);
  const y = buttonBox.y + buttonBox.height - 4;
  await page.mouse.click(x, y);
  assert.equal(await page.locator('#menu-toggle').isChecked(), true, 'hamburger lower hit area opens the menu');

  await page.mouse.click(x, y);
  assert.equal(await page.locator('#menu-toggle').isChecked(), false, 'hamburger lower hit area closes the menu');
}

async function runLegacyRegression(browser, baseUrl, label, contextOptions = {}) {
  const { context, failures, page } = await newPage(browser, baseUrl, `?no-sw=1&qa=legacy-regression-${label}`, contextOptions);

  await assertHamburgerHitArea(page);

  assert.equal(await inputValue(page, '#run-slider'), '1136');
  assert.equal(await text(page, '#run-txt-p'), 'Run Score: 35 | Min: 18:56 | Max: 10:23');

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
