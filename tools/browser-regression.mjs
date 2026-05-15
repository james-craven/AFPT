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
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
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

async function setThemePreset(page, preset) {
  await page.evaluate((themePreset) => {
    const select = document.getElementById('theme-preset-select');
    if (!select) return;
    select.value = themePreset;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }, preset);
  await page.waitForFunction(
    (themePreset) => document.documentElement.dataset.themePreset === themePreset,
    preset,
  );
}

async function assertControlsStayInsideApp(page, label) {
  const result = await page.evaluate(() => {
    const shell = document.querySelector('.app-shell')?.getBoundingClientRect();
    if (!shell) return { offenders: ['missing .app-shell'] };
    const selectors = [
      '.editor-panel:not([hidden])',
      '.editor-panel:not([hidden]) .editor-event-row',
      '.editor-panel:not([hidden]) .value-group',
      '.editor-panel:not([hidden]) .value-input',
      '.editor-panel:not([hidden]) .time-input',
      '.editor-panel:not([hidden]) .minmax-btn',
      '.editor-panel:not([hidden]) .chart-btn',
      '.editor-panel:not([hidden]) .altitude-row',
      '.editor-panel:not([hidden]) .slider-row',
      '.editor-panel:not([hidden]) .body-whtr-row',
      '.editor-panel:not([hidden]) .body-input-stepper',
      '.editor-panel:not([hidden]) .body-measure-input',
      '.component-strip',
      '.score-section',
      '.demographics-row',
      '#theme-preset-select',
      '.settings-hub-toggle',
    ].join(',');
    const offenders = [];

    for (const element of document.querySelectorAll(selectors)) {
      const style = window.getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden') continue;
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      if (rect.left < shell.left - 1 || rect.right > shell.right + 1) {
        offenders.push({
          className: element.className,
          id: element.id,
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          shellLeft: Math.round(shell.left),
          shellRight: Math.round(shell.right),
          tag: element.tagName.toLowerCase(),
        });
      }
    }

    return { offenders };
  });

  assert.deepEqual(result.offenders, [], `${label} controls stay inside app bounds`);
}

async function assertEventRowEdgeAlignment(page, panelId, label) {
  const result = await page.evaluate((id) => {
    const panel = document.getElementById(id);
    const row = panel?.querySelector('.editor-event-row');
    const activeValueRow = panel?.querySelector('.editor-value-row:not([hidden])');
    const valueGroup = activeValueRow?.querySelector('.value-group');
    const input = activeValueRow?.querySelector('input');
    const inputs = Array.from(activeValueRow?.querySelectorAll('input') || []);
    const buttons = Array.from(panel?.querySelectorAll('.editor-event-row .minmax-btn, .editor-event-row .chart-btn') || [])
      .filter((el) => {
        const rect = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
      });
    const minButton = activeValueRow?.querySelector('.minmax-btn');
    const chart = panel?.querySelector('.chart-btn');
    if (!row || !valueGroup || !input || !minButton || !chart || buttons.length < 3) return { missing: true };
    const rowRect = row.getBoundingClientRect();
    const groupRect = valueGroup.getBoundingClientRect();
    const inputRect = input.getBoundingClientRect();
    const minRect = minButton.getBoundingClientRect();
    const chartRect = chart.getBoundingClientRect();
    const columnGap = parseFloat(getComputedStyle(row).columnGap) || 0;
    const cellWidth = (rowRect.width - (columnGap * 3)) / 4;
    const heights = [...inputs.map((el) => el.getBoundingClientRect().height), ...buttons.map((el) => el.getBoundingClientRect().height)];
    const maxHeight = Math.max(...heights);
    const minHeight = Math.min(...heights);
    return {
      leftDelta: Math.abs(inputRect.left - rowRect.left),
      groupWidthDelta: Math.abs(groupRect.width - cellWidth),
      minWidthDelta: Math.abs(minRect.width - cellWidth),
      rightDelta: Math.abs(chartRect.right - rowRect.right),
      heightDelta: maxHeight - minHeight,
    };
  }, panelId);

  assert.equal(result.missing, undefined, `${label} row alignment elements exist`);
  assert.ok(result.leftDelta <= 2, `${label} input aligns with row left edge: ${result.leftDelta}px`);
  assert.ok(result.groupWidthDelta <= 2, `${label} input group uses one even row cell: ${result.groupWidthDelta}px`);
  assert.ok(result.minWidthDelta <= 2, `${label} MIN button uses one even row cell: ${result.minWidthDelta}px`);
  assert.ok(result.rightDelta <= 2, `${label} chart aligns with row right edge: ${result.rightDelta}px`);
  assert.ok(result.heightDelta <= 1, `${label} row controls share height: ${result.heightDelta}px`);
}

async function assertScoreBarLabelsDoNotOverlap(page, preset, label) {
  await setThemePreset(page, preset);
  const result = await page.evaluate(() => {
    const labels = Array.from(document.querySelectorAll('.score-bar-labels span'))
      .filter((element) => {
        const style = getComputedStyle(element);
        return style.display !== 'none' && style.visibility !== 'hidden';
      })
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          left: rect.left,
          right: rect.right,
          text: element.textContent.trim(),
        };
      });
    const overlaps = [];
    for (let index = 1; index < labels.length; index += 1) {
      if (labels[index].left < labels[index - 1].right - 0.5) {
        overlaps.push(`${labels[index - 1].text}/${labels[index].text}`);
      }
    }
    return { labels, overlaps };
  });

  assert.deepEqual(result.overlaps, [], `${label} ${preset} score bar labels do not overlap`);
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
  await page.evaluate(() => {
    const sel = document.getElementById('age-sel');
    sel.value = '40-44';
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.waitForTimeout(100);
  const scoreAfterAge = await page.evaluate(() => document.getElementById('score-txt')?.textContent?.trim());
  assert.ok(scoreAfterAge !== '--', 'score updates after age change');
  assert.equal(
    await page.evaluate(() => window.afptApp?.getState()?.ageGroup),
    '40-44',
    'age change updates app state',
  );

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

  // 6a-body. BODY chip opens body editor
  await page.locator('#summary-body').click();
  await page.waitForFunction(() => !document.getElementById('body-editor')?.hasAttribute('hidden'));
  const bodyVisible = await page.evaluate(() => !document.getElementById('body-editor')?.hasAttribute('hidden'));
  assert.equal(bodyVisible, true, 'body editor visible after clicking BODY chip');
  const strHiddenAfterBody = await page.evaluate(() => document.getElementById('strength-editor')?.hasAttribute('hidden'));
  assert.equal(strHiddenAfterBody, true, 'strength editor hidden after switching to body');
  const whtrSliderExists = await page.evaluate(() => !!document.getElementById('whtr-slider'));
  assert.equal(whtrSliderExists, false, 'WHtR slider is removed from body editor');
  const bodyInputsExist = await page.evaluate(() => (
    ['pfra-whtr', 'height-ft-input', 'height-in-input', 'waist-input']
      .every((id) => !!document.getElementById(id))
  ));
  assert.equal(bodyInputsExist, true, 'body editor exposes ratio, height, and waist inputs');
  await page.locator('#summary-strength').click();
  await page.waitForFunction(() => !document.getElementById('strength-editor')?.hasAttribute('hidden'));

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

  // 6c. Event value preservation across toggle switches
  // Set push-ups to 27, switch to HRPU, switch back — value must persist
  await page.evaluate(() => {
    window.afptApp.dispatch({ type: 'SET_STRENGTH_VALUE', value: '27' });
    const pushTxt = document.getElementById('push-txt');
    if (pushTxt) pushTxt.value = '27';
  });
  await page.evaluate(() => {
    const sel = document.getElementById('push-sel');
    sel.value = 'hand-release-push-up';
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.waitForTimeout(50);
  await page.evaluate(() => {
    const sel = document.getElementById('push-sel');
    sel.value = 'push-up';
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.waitForTimeout(50);
  const strengthAfterRoundTrip = await page.evaluate(() => window.afptApp.getState().strength.value);
  assert.equal(strengthAfterRoundTrip, '27', 'push-up value preserved after HRPU round-trip');

  // Set 2-mile run to 14:00, switch to HAMR, switch back — run time must persist
  await page.locator('#summary-cardio').click();
  await page.waitForFunction(() => !document.getElementById('cardio-editor')?.hasAttribute('hidden'));
  await page.evaluate(() => {
    window.afptApp.dispatch({ type: 'SET_CARDIO_VALUE', value: '14:00' });
    const minEl = document.getElementById('run-mintxt');
    const secEl = document.getElementById('run-sectxt');
    if (minEl) minEl.value = '14';
    if (secEl) secEl.value = '00';
  });
  await page.evaluate(() => {
    const sel = document.getElementById('cardio-sel');
    sel.value = 'hamr-20-meter';
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.waitForTimeout(50);
  const hamrFirstTime = await page.evaluate(() => window.afptApp.getState().cardio.value);
  assert.ok(Number(hamrFirstTime) >= 1, `HAMR initializes in-range on first switch: ${hamrFirstTime}`);

  for (const [shuttles, expectedLevelText] of [
    ['8', 'Level: 2 | Shuttle: 1'],
    ['15', 'Level: 2 | Shuttle: 8'],
    ['16', 'Level: 3 | Shuttle: 1'],
    ['60', 'Level: 7 | Shuttle: 10'],
    ['61', 'Level: 8 | Shuttle: 1'],
    ['87', 'Level: 10 | Shuttle: 6'],
  ]) {
    await page.evaluate((value) => {
      const input = document.getElementById('run-shuttle-txt');
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }, shuttles);
    await page.waitForFunction(
      (expected) => document.getElementById('hamr-level-display')?.textContent === expected,
      expectedLevelText,
    );
  }

  await page.evaluate(() => {
    const sel = document.getElementById('cardio-sel');
    sel.value = 'two-mile-run';
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.waitForTimeout(50);
  const runAfterHamrRoundTrip = await page.evaluate(() => window.afptApp.getState().cardio.value);
  assert.equal(runAfterHamrRoundTrip, '14:00', '2-mile run value preserved after HAMR round-trip');
  await page.locator('#summary-strength').click();
  await page.waitForFunction(() => !document.getElementById('strength-editor')?.hasAttribute('hidden'));

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

  // 8. Theme switch changes data-theme-preset from the demographics row control
  assert.equal(await page.locator('label[for="theme-preset-select"]').innerText(), 'THEME', 'theme control label is THEME');
  assert.equal(await page.locator('#theme-preset-select.demo-select').isVisible(), true, 'theme selector is visible in demographics row');
  assert.deepEqual(
    await page.locator('#theme-preset-select option').evaluateAll((options) => options.map((option) => option.textContent.trim())),
    ['Tactical', 'Stencil', 'Dress Blues', 'Contrast', 'Gradiant'],
    'theme selector uses compact display names',
  );
  await page.locator('#theme-preset-select').selectOption('blues');
  await page.waitForFunction(() => document.documentElement.dataset.themePreset === 'blues');
  const themeApplied = await page.evaluate(() => document.documentElement.dataset.themePreset);
  assert.equal(themeApplied, 'blues', 'theme preset changed to blues');

  // Restore theme
  await page.locator('#theme-preset-select').selectOption('tactical');
  await page.waitForFunction(() => document.documentElement.dataset.themePreset === 'tactical');

  // 8a. Body/cardio controls stay in bounds across themes and event layouts
  await page.locator('#summary-body').click();
  await page.waitForFunction(() => !document.getElementById('body-editor')?.hasAttribute('hidden'));
  for (const preset of ['tactical', 'stencil', 'blues', 'light', 'fitness']) {
    await setThemePreset(page, preset);
    await assertControlsStayInsideApp(page, `${label} ${preset} body`);
    const minDecimalInputWidth = await page.evaluate(() => Math.min(
      ...['pfra-whtr', 'waist-input']
        .map((id) => document.getElementById(id)?.getBoundingClientRect().width || 0),
    ));
    assert.ok(
      minDecimalInputWidth >= 52,
      `${label} ${preset} decimal body inputs keep enough room: ${minDecimalInputWidth}px`,
    );
    const bodyControlAlignment = await page.evaluate(() => {
      const ratio = document.querySelector('.body-input-stepper--ratio')?.getBoundingClientRect();
      const pair = document.querySelector('.body-whtr-control--pair')?.getBoundingClientRect();
      const waist = document.querySelector('.body-input-stepper--waist')?.getBoundingClientRect();
      if (!ratio || !pair || !waist) return { missing: true };
      return {
        leftDelta: Math.max(Math.abs(ratio.left - pair.left), Math.abs(waist.left - pair.left)),
        rightDelta: Math.max(Math.abs(ratio.right - pair.right), Math.abs(waist.right - pair.right)),
      };
    });
    assert.equal(bodyControlAlignment.missing, undefined, `${label} ${preset} body controls exist`);
    assert.ok(bodyControlAlignment.leftDelta <= 1, `${label} ${preset} body input left edges align`);
    assert.ok(bodyControlAlignment.rightDelta <= 1, `${label} ${preset} body input right edges align`);
  }

  await assertScoreBarLabelsDoNotOverlap(page, 'tactical', label);
  await assertScoreBarLabelsDoNotOverlap(page, 'light', label);

  await page.locator('#summary-cardio').click();
  await page.waitForFunction(() => !document.getElementById('cardio-editor')?.hasAttribute('hidden'));
  for (const preset of ['tactical', 'stencil', 'blues', 'light', 'fitness']) {
    await setThemePreset(page, preset);
    await page.evaluate(() => {
      const sel = document.getElementById('cardio-sel');
      sel.value = 'two-mile-run';
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await page.waitForTimeout(50);
    await assertControlsStayInsideApp(page, `${label} ${preset} run`);

    await page.evaluate(() => {
      const sel = document.getElementById('cardio-sel');
      sel.value = 'hamr-20-meter';
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await page.waitForTimeout(50);
    await assertControlsStayInsideApp(page, `${label} ${preset} HAMR`);
  }

  await setThemePreset(page, 'tactical');
  const tacticalAltitudeStyle = await page.evaluate(() => {
    const row = document.querySelector('.altitude-row');
    if (!row) return { missing: true };
    const style = getComputedStyle(row);
    return {
      background: style.backgroundColor,
      borderTopWidth: style.borderTopWidth,
      paddingLeft: parseFloat(style.paddingLeft),
      radius: parseFloat(style.borderRadius),
    };
  });
  assert.equal(tacticalAltitudeStyle.missing, undefined, `${label} tactical altitude row exists`);
  assert.notEqual(tacticalAltitudeStyle.background, 'rgba(0, 0, 0, 0)', `${label} tactical altitude row has themed container background`);
  assert.equal(tacticalAltitudeStyle.borderTopWidth, '0px', `${label} tactical altitude row removes divider-style top border`);
  assert.ok(tacticalAltitudeStyle.paddingLeft >= 8, `${label} tactical altitude row has container padding`);
  assert.ok(tacticalAltitudeStyle.radius >= 5, `${label} tactical altitude row has rounded container`);

  const scoreLabelTextAlign = await page.locator('.score-label-text:visible').first().evaluate((element) => getComputedStyle(element).textAlign);
  assert.equal(scoreLabelTextAlign, 'center', `${label} score/min/max label text is centered`);

  const componentDividerInset = await page.evaluate(() => {
    const strip = document.querySelector('.component-strip');
    if (!strip) return { missing: true };
    const after = getComputedStyle(strip, '::after');
    return {
      left: parseFloat(after.left),
      right: parseFloat(after.right),
    };
  });
  assert.equal(componentDividerInset.missing, undefined, `${label} component strip divider exists`);
  assert.ok(componentDividerInset.left >= 15, `${label} bottom divider is inset from left`);
  assert.ok(componentDividerInset.right >= 15, `${label} bottom divider is inset from right`);

  await setThemePreset(page, 'light');
  const contrastPacePlanStyle = await page.evaluate(() => {
    const lapDisplay = document.querySelector('.lap-display');
    if (!lapDisplay) return { missing: true };
    const style = getComputedStyle(lapDisplay);
    return {
      background: style.backgroundColor,
      borderWidth: style.borderTopWidth,
      radius: parseFloat(style.borderRadius),
    };
  });
  assert.equal(contrastPacePlanStyle.missing, undefined, `${label} contrast pace plan exists`);
  assert.notEqual(contrastPacePlanStyle.background, 'rgba(0, 0, 0, 0)', `${label} contrast pace plan has card background`);
  assert.notEqual(contrastPacePlanStyle.borderWidth, '0px', `${label} contrast pace plan has card border`);
  assert.ok(contrastPacePlanStyle.radius >= 10, `${label} contrast pace plan card is rounded`);

  await setThemePreset(page, 'fitness');
  const fitnessGlassStyle = await page.evaluate(() => {
    const header = document.querySelector('.app-header');
    const score = document.querySelector('.score-section');
    if (!header || !score) return { missing: true };
    const headerStyle = getComputedStyle(header);
    const scoreStyle = getComputedStyle(score);
    return {
      headerPosition: headerStyle.position,
      headerBackground: headerStyle.backgroundColor,
      headerBackdrop: headerStyle.backdropFilter || headerStyle.webkitBackdropFilter || '',
      scoreBackground: scoreStyle.backgroundColor,
      scoreRadius: parseFloat(scoreStyle.borderRadius),
      scoreBorder: scoreStyle.borderTopWidth,
    };
  });
  assert.equal(fitnessGlassStyle.missing, undefined, `${label} gradiant glass elements exist`);
  assert.equal(fitnessGlassStyle.headerPosition, 'sticky', `${label} gradiant header stays sticky`);
  assert.notEqual(fitnessGlassStyle.headerBackground, 'rgba(0, 0, 0, 0)', `${label} gradiant header has glass background`);
  assert.match(fitnessGlassStyle.headerBackdrop, /blur/i, `${label} gradiant header has blur backdrop`);
  assert.notEqual(fitnessGlassStyle.scoreBackground, 'rgba(0, 0, 0, 0)', `${label} gradiant score section has glass background`);
  assert.notEqual(fitnessGlassStyle.scoreBorder, '0px', `${label} gradiant score section has glass border`);
  assert.ok(fitnessGlassStyle.scoreRadius >= 16, `${label} gradiant score section is rounded`);

  await page.locator('#summary-strength').click();
  await page.waitForFunction(() => !document.getElementById('strength-editor')?.hasAttribute('hidden'));
  await assertEventRowEdgeAlignment(page, 'strength-editor', `${label} strength`);
  await page.locator('#summary-core').click();
  await page.waitForFunction(() => !document.getElementById('core-editor')?.hasAttribute('hidden'));
  await assertEventRowEdgeAlignment(page, 'core-editor', `${label} core`);
  await page.locator('#summary-cardio').click();
  await page.waitForFunction(() => !document.getElementById('cardio-editor')?.hasAttribute('hidden'));
  await assertEventRowEdgeAlignment(page, 'cardio-editor', `${label} cardio run`);
  await page.evaluate(() => {
    const sel = document.getElementById('cardio-sel');
    sel.value = 'hamr-20-meter';
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.waitForTimeout(50);
  await assertEventRowEdgeAlignment(page, 'cardio-editor', `${label} cardio HAMR`);
  assert.equal(await page.locator('.value-unit').count(), 0, 'redundant value-unit labels are removed');

  await setThemePreset(page, 'blues');
  const bluesRingWidth = await page.locator('.score-ring-svg').evaluate((element) => element.getBoundingClientRect().width);
  const bluesScoreOrder = await page.evaluate(() => {
    const label = document.querySelector('.score-comp-label')?.getBoundingClientRect();
    const ring = document.querySelector('.score-ring-wrap')?.getBoundingClientRect();
    const badge = document.querySelector('.score-badge')?.getBoundingClientRect();
    if (!label || !ring || !badge) return false;
    const center = (rect) => rect.left + rect.width / 2;
    return center(label) < center(ring) && center(ring) < center(badge);
  });
  assert.equal(bluesScoreOrder, true, 'blues score row orders label, ring, then status');

  await setThemePreset(page, 'fitness');
  const fitnessRingWidth = await page.locator('.score-ring-svg').evaluate((element) => element.getBoundingClientRect().width);
  assert.ok(Math.abs(bluesRingWidth - fitnessRingWidth) <= 1, 'blues and fitness score rings match size');
  const fitnessScoreOrder = await page.evaluate(() => {
    const label = document.querySelector('.score-comp-label')?.getBoundingClientRect();
    const ring = document.querySelector('.score-ring-wrap')?.getBoundingClientRect();
    const badge = document.querySelector('.score-badge')?.getBoundingClientRect();
    if (!label || !ring || !badge) return false;
    const center = (rect) => rect.left + rect.width / 2;
    return center(label) < center(ring) && center(ring) < center(badge);
  });
  assert.equal(fitnessScoreOrder, true, 'fitness score row orders label, ring, then status');
  const fitnessScoreColumnAlignment = await page.evaluate(() => {
    const section = document.querySelector('.score-section')?.getBoundingClientRect();
    const labelRect = document.querySelector('.score-comp-label')?.getBoundingClientRect();
    const ringRect = document.querySelector('.score-ring-wrap')?.getBoundingClientRect();
    const badgeRect = document.querySelector('.score-badge')?.getBoundingClientRect();
    if (!section || !labelRect || !ringRect || !badgeRect) return { missing: true };
    const center = (rect) => rect.left + rect.width / 2;
    return {
      labelDelta: Math.abs(center(labelRect) - ((section.left + ringRect.left) / 2)),
      badgeDelta: Math.abs(center(badgeRect) - ((ringRect.right + section.right) / 2)),
    };
  });
  assert.equal(fitnessScoreColumnAlignment.missing, undefined, 'fitness score column elements exist');
  assert.ok(fitnessScoreColumnAlignment.labelDelta <= 12, `fitness total label centered in left column: ${fitnessScoreColumnAlignment.labelDelta}px`);
  assert.ok(fitnessScoreColumnAlignment.badgeDelta <= 12, `fitness status centered in right column: ${fitnessScoreColumnAlignment.badgeDelta}px`);
  const fitnessRingTextDelta = await page.evaluate(() => {
    const svg = document.getElementById('score-ring-svg');
    const text = document.getElementById('score-ring-num');
    if (!svg || !text || typeof text.getBBox !== 'function') return null;
    const box = text.getBBox();
    return Math.abs((box.y + box.height / 2) - 100);
  });
  assert.ok(fitnessRingTextDelta !== null && fitnessRingTextDelta <= 4, `fitness score number is centered in ring: ${fitnessRingTextDelta}px`);
  const fitnessRingCategoryHidden = await page.evaluate(() => {
    const cat = document.querySelector('.score-ring-cat');
    return cat ? getComputedStyle(cat).display === 'none' : false;
  });
  assert.equal(fitnessRingCategoryHidden, true, 'fitness hides status text inside ring');
  assert.equal(
    await page.locator('.app-title').evaluate((el) => el.textContent.trim()),
    'AF-PRT',
    'fitness theme header keeps AF-PRT title',
  );
  await setThemePreset(page, 'tactical');
  await page.locator('#summary-strength').click();
  await page.waitForFunction(() => !document.getElementById('strength-editor')?.hasAttribute('hidden'));

  // 9. Chart drawer opens with generated table and closes
  await page.locator('#push-txt').fill('48');
  const appSexBeforeChartDemo = await page.locator('#sex-sel').inputValue();
  const appAgeBeforeChartDemo = await page.locator('#age-sel').inputValue();
  const scoreBeforeChartDemo = await page.evaluate(() => document.getElementById('score-txt')?.textContent?.trim());
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
  await page.waitForFunction(() => document.querySelectorAll('#chart-content .chart-row--you').length === 1);
  assert.equal(
    await page.locator('#chart-content .chart-you').first().innerText(),
    '< YOU',
    'chart drawer marks current app performance',
  );

  await page.locator('#chart-sex-sel').selectOption(appSexBeforeChartDemo === 'female' ? 'male' : 'female');
  await page.locator('#chart-age-sel').selectOption('40-44');
  await page.waitForFunction(() => {
    const meta = document.querySelector('#chart-content .chart-meta')?.textContent || '';
    return meta.includes('40') && document.querySelectorAll('#chart-content .chart-row--you').length === 1;
  });
  assert.equal(
    await page.locator('#sex-sel').inputValue(),
    appSexBeforeChartDemo,
    'chart sex selector does not change main app sex',
  );
  assert.equal(
    await page.locator('#age-sel').inputValue(),
    appAgeBeforeChartDemo,
    'chart age selector does not change main app age',
  );
  assert.equal(
    await page.evaluate(() => document.getElementById('score-txt')?.textContent?.trim()),
    scoreBeforeChartDemo,
    'chart demographic selectors do not change main app score',
  );
  await page.locator('#chart-reference-btn').click();
  await page.waitForFunction(() => {
    const modal = document.getElementById('modal');
    const image = document.querySelector('#chart-content .chart-reference__image');
    return modal?.dataset.chartMode === 'reference'
      && !modal.hasAttribute('hidden')
      && image?.getAttribute('src')?.includes('pfra-scoring-page-02.jpg');
  });
  assert.equal(
    await page.locator('#chart-drawer-title').evaluate((el) => el.textContent.trim()),
    'Push-Up Official Score Chart',
    'chart reference button opens selected event official source page',
  );
  await page.locator('#close-btn').click();
  await page.waitForFunction(() => document.getElementById('modal')?.hasAttribute('hidden'));
  const chartClosed = await page.evaluate(() => document.getElementById('modal')?.hasAttribute('hidden'));
  assert.equal(chartClosed, true, 'chart drawer closes on close-btn click');

  // 9a. Settings reference actions open official source images in the themed drawer
  for (const [selector, expectedSource, expectedTitle] of [
    ['#run-adjust-chart', 'dafman-36-2905-2-page1-full.png', 'Run Altitude Adjustment'],
    ['#walk-adjust-chart', 'dafman-36-2905-2-page2-full.png', 'Walk/Shuttle Altitude Adjustment'],
    ['#shuttle-score-card', 'ShuttleLevels.jpeg', 'HAMR Shuttle Score Card'],
  ]) {
    await page.locator('#settings-hub-toggle').click();
    await page.waitForFunction(() => !document.getElementById('settings-hub-panel')?.hidden);
    await page.locator(selector).click();
    await page.waitForFunction(
      (source) => {
        const modal = document.getElementById('modal');
        const image = document.querySelector('#chart-content .chart-reference__image');
        return modal?.dataset.chartMode === 'reference'
          && !modal.hasAttribute('hidden')
          && image?.getAttribute('src')?.includes(source);
      },
      expectedSource,
    );
    assert.equal(
      await page.locator('#chart-drawer-title').evaluate((el) => el.textContent.trim()),
      expectedTitle,
      `${selector} sets reference drawer title`,
    );
    assert.equal(
      await page.locator('.chart-ctrl-row').isHidden(),
      true,
      `${selector} hides score chart controls`,
    );
    assert.equal(
      await page.locator('.chart-demo-row').isHidden(),
      true,
      `${selector} hides modal demographic controls`,
    );
    await page.locator('#close-btn').click();
    await page.waitForFunction(() => document.getElementById('modal')?.hasAttribute('hidden'));
  }

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
  assert.equal(
    await page.evaluate(() => typeof window.afptPwa?.showInstallHelp),
    'function',
    'PWA install help API is exposed',
  );

  await page.locator('#settings-hub-toggle').click();
  await page.waitForFunction(() => !document.getElementById('settings-hub-panel')?.hidden);
  await page.locator('#install-app-menu').click();
  await page.waitForFunction(() => !document.getElementById('install-modal')?.hasAttribute('hidden'));
  assert.match(
    await page.locator('#install-status').innerText(),
    /install|standalone/i,
    'install action shows install guidance',
  );
  await page.locator('#install-close').click();
  await page.waitForFunction(() => document.getElementById('install-modal')?.hasAttribute('hidden'));

  await page.locator('#settings-hub-toggle').click();
  await page.waitForFunction(() => !document.getElementById('settings-hub-panel')?.hidden);
  await page.locator('#pwa-update-check').click();
  await page.waitForFunction(() => !document.getElementById('pwa-update-modal')?.hasAttribute('hidden'));
  assert.match(
    await page.locator('#pwa-update-title').evaluate((el) => el.textContent.trim()),
    /Update Unavailable|Current Version|Update Ready/i,
    'update action reports update status',
  );
  await page.locator('#pwa-update-later').click();
  await page.waitForFunction(() => document.getElementById('pwa-update-modal')?.hasAttribute('hidden'));

  await page.locator('#settings-hub-toggle').click();
  await page.waitForFunction(() => !document.getElementById('settings-hub-panel')?.hidden);
  await page.locator('#dev-version-menu').click();
  await page.waitForFunction(() => !document.getElementById('dev-version-modal')?.hasAttribute('hidden'));
  assert.match(
    await page.locator('#dev-version-text').innerText(),
    /developmental build/i,
    'build info identifies the app as a developmental build',
  );
  await page.locator('#dev-version-close').click();
  await page.waitForFunction(() => document.getElementById('dev-version-modal')?.hasAttribute('hidden'));

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
