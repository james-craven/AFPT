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

async function assertStickyHeaderAndSettingsLayer(page, preset, label) {
  await setThemePreset(page, preset);
  await page.evaluate(() => window.scrollTo(0, 420));
  await page.waitForTimeout(100);

  const stickyResult = await page.evaluate(() => {
    const header = document.querySelector('.app-header');
    if (!header) return { missing: true };
    const rect = header.getBoundingClientRect();
    const style = getComputedStyle(header);
    return {
      position: style.position,
      top: rect.top,
      zIndex: Number.parseInt(style.zIndex, 10),
    };
  });

  assert.equal(stickyResult.missing, undefined, `${label} ${preset} header exists`);
  assert.equal(stickyResult.position, 'sticky', `${label} ${preset} header is sticky`);
  assert.ok(Math.abs(stickyResult.top) <= 1, `${label} ${preset} header stays at viewport top: ${stickyResult.top}px`);
  assert.ok(stickyResult.zIndex >= 100, `${label} ${preset} header has overlay-safe z-index`);

  await page.locator('#settings-hub-toggle').click();
  await page.waitForFunction(() => !document.getElementById('settings-hub-panel')?.hidden);

  const layerResult = await page.evaluate(() => {
    const panel = document.getElementById('settings-hub-panel');
    const scrim = document.getElementById('settings-hub-scrim');
    const shell = document.querySelector('.app-shell');
    if (!panel || !scrim) return { missing: true };
    const panelRect = panel.getBoundingClientRect();
    const shellRect = shell?.getBoundingClientRect();
    const panelStyle = getComputedStyle(panel);
    const scrimStyle = getComputedStyle(scrim);
    const hit = document.elementFromPoint(
      Math.min(panelRect.left + 24, window.innerWidth - 8),
      Math.min(panelRect.top + 24, window.innerHeight - 8),
    );
    return {
      panelParent: panel.parentElement?.tagName,
      panelPosition: panelStyle.position,
      panelZ: Number.parseInt(panelStyle.zIndex, 10),
      scrimParent: scrim.parentElement?.tagName,
      scrimZ: Number.parseInt(scrimStyle.zIndex, 10),
      topHitInsidePanel: panel.contains(hit),
      panelTop: panelRect.top,
      panelRight: panelRect.right,
      expectedRight: shellRect?.right ?? window.innerWidth,
    };
  });

  assert.equal(layerResult.missing, undefined, `${label} ${preset} settings layer exists`);
  assert.equal(layerResult.panelParent, 'BODY', `${label} ${preset} settings panel is portaled to body`);
  assert.equal(layerResult.scrimParent, 'BODY', `${label} ${preset} settings scrim is portaled to body`);
  assert.equal(layerResult.panelPosition, 'fixed', `${label} ${preset} settings panel is fixed`);
  assert.ok(layerResult.panelZ > stickyResult.zIndex, `${label} ${preset} settings panel renders above header`);
  assert.ok(layerResult.scrimZ > stickyResult.zIndex, `${label} ${preset} settings scrim renders above app`);
  assert.equal(layerResult.topHitInsidePanel, true, `${label} ${preset} settings panel is topmost at its visible edge`);
  assert.ok(Math.abs(layerResult.panelTop) <= 1, `${label} ${preset} settings panel starts at viewport top`);
  assert.ok(Math.abs(layerResult.panelRight - layerResult.expectedRight) <= 1, `${label} ${preset} settings panel reaches app right edge`);

  await page.locator('#settings-hub-close').click();
  await page.waitForFunction(() => document.getElementById('settings-hub-panel')?.hidden);
  await page.evaluate(() => window.scrollTo(0, 0));
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
    const maxButton = activeValueRow?.querySelectorAll('.minmax-btn')?.[1];
    const maxRect = maxButton?.getBoundingClientRect();
    const chartRect = chart.getBoundingClientRect();
    const columnGap = parseFloat(getComputedStyle(row).columnGap) || 0;
    const heights = [...inputs.map((el) => el.getBoundingClientRect().height), ...buttons.map((el) => el.getBoundingClientRect().height)];
    const maxHeight = Math.max(...heights);
    const minHeight = Math.min(...heights);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const clippedInputs = inputs
      .map((el) => {
        const style = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        const text = el.value || el.placeholder || '';
        if (!ctx || !text) return null;
        ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        const required = ctx.measureText(text).width
          + (parseFloat(style.paddingLeft) || 0)
          + (parseFloat(style.paddingRight) || 0)
          + 6;
        return {
          id: el.id,
          width: rect.width,
          required,
        };
      })
      .filter(Boolean)
      .filter(({ width, required }) => width + 0.5 < required)
      .map(({ id, width, required }) => `${id}:${Math.round(width)}<${Math.round(required)}`);
    const actionWidths = buttons.map((el) => el.getBoundingClientRect().width);
    const maxActionWidth = Math.max(...actionWidths);
    const gaps = maxRect
      ? [
        minRect.left - groupRect.right,
        maxRect.left - minRect.right,
        chartRect.left - maxRect.right,
      ]
      : [];
    const gapDelta = gaps.length ? Math.max(...gaps.map((gap) => Math.abs(gap - columnGap))) : 0;
    return {
      leftDelta: Math.abs(groupRect.left - rowRect.left),
      firstInputLeftDelta: Math.abs(inputRect.left - rowRect.left),
      rightDelta: Math.abs(chartRect.right - rowRect.right),
      heightDelta: maxHeight - minHeight,
      inputPriorityDelta: groupRect.width - maxActionWidth,
      gapDelta,
      clippedInputs,
    };
  }, panelId);

  assert.equal(result.missing, undefined, `${label} row alignment elements exist`);
  assert.ok(result.leftDelta <= 2, `${label} input group aligns with row left edge: ${result.leftDelta}px`);
  assert.ok(result.firstInputLeftDelta <= 2, `${label} input aligns with row left edge: ${result.firstInputLeftDelta}px`);
  assert.ok(result.rightDelta <= 2, `${label} chart aligns with row right edge: ${result.rightDelta}px`);
  assert.ok(result.heightDelta <= 1, `${label} row controls share height: ${result.heightDelta}px`);
  assert.ok(result.inputPriorityDelta >= 12, `${label} input group has priority over action buttons: ${result.inputPriorityDelta}px`);
  assert.ok(result.gapDelta <= 2, `${label} row control gaps are even: ${result.gapDelta}px`);
  assert.deepEqual(result.clippedInputs, [], `${label} input text fits without clipping`);
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

  const pacerAudioDefaults = await page.evaluate(() => ({
    controlsVisible: Boolean(document.querySelector('[data-pacer-audio-panel]')),
    enabled: document.querySelector('[data-pacer-audio-field="enabled"]')?.checked,
    settings: window.afptApp.getPacerAudioSettings(),
  }));
  assert.equal(pacerAudioDefaults.controlsVisible, true, 'pacer audio controls render inside pace plan');
  assert.equal(pacerAudioDefaults.enabled, false, 'pacer audio is off by default');
  assert.equal(pacerAudioDefaults.settings.courseMode, 'track', 'pacer audio defaults to track mode');
  assert.equal(pacerAudioDefaults.settings.cueFrequency, '100m', 'pacer audio defaults to 100m cues');
  assert.equal(pacerAudioDefaults.settings.vibration, false, 'pacer audio vibration is off by default');
  assert.equal(await page.locator('[data-pacer-audio-field="cueStyle"]').count(), 0, 'pacer audio no longer exposes beep style choices');
  assert.equal(await page.locator('[data-pacer-audio-field="cueIntensity"]').count(), 0, 'pacer audio no longer exposes intensity choices');
  assert.equal(await page.locator('[data-pacer-audio-field="outBackSegmentMeters"]').count(), 0, 'pacer audio no longer exposes repeated turn presets');
  assert.equal(await page.locator('[data-pacer-audio-field="courseMode"] option[value="percent"]').count(), 0, 'pacer audio no longer exposes percent course mode');
  assert.match(
    await page.locator('.pace-audio-note').innerText(),
    /voice cues.*ducking/i,
    'pacer audio explains simplified voice cue behavior',
  );

  await page.locator('[data-pacer-audio-field="courseMode"]').selectOption('route');
  await page.waitForFunction(() => document.querySelector('.lap-fitness')?.dataset.course === 'route');
  const routeCourseVisual = await page.evaluate(() => ({
    hasRouteLine: Boolean(document.querySelector('.pace-route-line')),
    hasMorphTrack: Boolean(document.querySelector('.pace-morph-track--to-route')),
    morphTrackAnimation: getComputedStyle(document.querySelector('.pace-morph-track--to-route')).animationName,
    goalTimeY: Number(document.querySelector('.pace-time-text')?.getAttribute('y') ?? 0),
    buttonCy: Number(document.querySelector('.pace-pacer-start .pace-pacer-hit')?.getAttribute('cy') ?? 0),
    buttonBottom: Number(document.querySelector('.pace-pacer-start .pace-pacer-hit')?.getAttribute('cy') ?? 0)
      + Number(document.querySelector('.pace-pacer-start .pace-pacer-hit')?.getAttribute('r') ?? 0),
    hasPlayIcon: Boolean(document.querySelector('.pace-pacer-start .pace-icon--play')),
    secondaryHidden: document.querySelector('.pace-pacer-secondary')?.getAttribute('aria-hidden'),
    lineY: Number(document.querySelector('.pace-route-line')?.getAttribute('y1') ?? 0),
    markerCount: document.querySelectorAll('[data-pace-lap]').length,
    startLabelCount: document.querySelectorAll('.pace-start-label').length,
    startText: document.querySelector('.pace-start-text')?.textContent,
    startX: Number(document.querySelector('.pace-endpoint--start .pace-dot--start')?.getAttribute('cx') ?? 0),
    finishX: Number(document.querySelector('.pace-marker--finish .pace-dot--finish')?.getAttribute('cx') ?? 0),
    finishLabelX: Number(document.querySelector('.pace-marker--finish .pace-fin-label')?.getAttribute('x') ?? 0),
    finishLabelAnchor: document.querySelector('.pace-marker--finish .pace-fin-label')?.getAttribute('text-anchor'),
    l7LabelY: Number(document.querySelector('[data-pace-lap="7"] .pace-label')?.getAttribute('y') ?? 0),
    finishLabelY: Number(document.querySelector('.pace-marker--finish .pace-fin-label')?.getAttribute('y') ?? 0),
    finishSplitY: Number(document.querySelector('.pace-marker--finish .pace-fin-split')?.getAttribute('y') ?? 0),
    runnerLeg: document.querySelector('[data-pacer-runner]')?.dataset.courseLeg,
  }));
  assert.equal(routeCourseVisual.hasRouteLine, true, 'route mode renders a straight course line');
  assert.equal(routeCourseVisual.hasMorphTrack, true, 'route mode animates from a visible morphing track shape');
  assert.match(routeCourseVisual.morphTrackAnimation, /pace-track-to-route/, 'route mode shrinks the track shape into the route line');
  assert.ok(Math.abs(routeCourseVisual.buttonCy - routeCourseVisual.goalTimeY) <= 2, 'route mode places the play button beside the goal time');
  assert.equal(routeCourseVisual.hasPlayIcon, true, 'route mode uses a play icon instead of START text');
  assert.equal(routeCourseVisual.secondaryHidden, 'true', 'route mode hides pause/reset before the pacer starts');
  assert.ok(routeCourseVisual.buttonBottom < routeCourseVisual.lineY - 30, 'route mode keeps goal/start controls well clear of the route line');
  assert.equal(routeCourseVisual.markerCount, 8, 'route mode keeps 8 track-equivalent lap markers');
  assert.equal(routeCourseVisual.startLabelCount, 0, 'route mode removes the floating START label');
  assert.equal(routeCourseVisual.startText, 'ST', 'route mode uses an inline start marker matching the finish marker');
  assert.ok(routeCourseVisual.startX < 30, 'route mode places start at the far left end');
  assert.ok(routeCourseVisual.finishX > 300, 'route mode places finish at the far right end');
  assert.equal(routeCourseVisual.finishLabelAnchor, 'middle', 'route finish label is centered on the finish marker');
  assert.ok(Math.abs(routeCourseVisual.finishLabelX - routeCourseVisual.finishX) <= 1, 'route finish label x-position matches the finish marker');
  assert.ok(routeCourseVisual.l7LabelY < routeCourseVisual.lineY, 'route mode staggers late lap labels above the line');
  assert.ok(routeCourseVisual.finishLabelY > routeCourseVisual.lineY, 'route mode staggers the finish label below the line');
  assert.ok(routeCourseVisual.finishLabelY - routeCourseVisual.lineY <= 24, 'route mode keeps bottom labels visually close to the line');
  assert.equal(routeCourseVisual.runnerLeg, 'route', 'route mode starts runner on route line');

  await page.evaluate(() => {
    const minEl = document.getElementById('run-mintxt');
    const secEl = document.getElementById('run-sectxt');
    if (minEl) minEl.value = '13';
    if (secEl) {
      secEl.value = '25';
      secEl.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  await page.waitForFunction(() => document.querySelector('.lap-fitness')?.dataset.courseTransition === 'false');
  const routeGoalChangeVisual = await page.evaluate(() => {
    const line = document.querySelector('.pace-route-line');
    const marker = document.querySelector('[data-pace-lap="1"]');
    const toggle = document.querySelector('[data-pacer-start]');
    return {
      course: document.querySelector('.lap-fitness')?.dataset.course,
      courseTransition: document.querySelector('.lap-fitness')?.dataset.courseTransition,
      morphChildCount: document.querySelector('.pace-course-morph')?.children.length ?? -1,
      lineAnimation: line ? getComputedStyle(line).animationName : '',
      markerAnimation: marker ? getComputedStyle(marker).animationName : '',
      toggleAnimation: toggle ? getComputedStyle(toggle).animationName : '',
      goalTime: document.querySelector('.pace-time-text')?.textContent,
      finishSplit: document.querySelector('.pace-marker--finish .pace-fin-split')?.textContent,
    };
  });
  assert.equal(routeGoalChangeVisual.course, 'route', 'changing run time keeps route mode selected');
  assert.equal(routeGoalChangeVisual.courseTransition, 'false', 'changing run time is not treated as a course transition');
  assert.equal(routeGoalChangeVisual.morphChildCount, 0, 'changing run time does not render a morph layer');
  assert.equal(routeGoalChangeVisual.lineAnimation, 'none', 'changing run time does not redraw the route line');
  assert.equal(routeGoalChangeVisual.markerAnimation, 'none', 'changing run time does not reanimate route markers');
  assert.equal(routeGoalChangeVisual.toggleAnimation, 'none', 'changing run time does not reanimate pacer controls');
  assert.equal(routeGoalChangeVisual.goalTime, '13:25', 'route goal time reflects the selected run value');
  assert.equal(routeGoalChangeVisual.finishSplit, '13:25', 'route finish split uses exact goal time without rounded-lap drift');

  await page.locator('[data-pacer-audio-field="courseMode"]').selectOption('out-back');
  await page.waitForFunction(() => document.querySelector('.lap-fitness')?.dataset.course === 'out-back');
  const outBackCourseVisual = await page.evaluate(() => ({
    lineCount: document.querySelectorAll('.pace-outback-line').length,
    splitMorphCount: document.querySelectorAll('.pace-morph-line--route-to-out, .pace-morph-line--route-to-back').length,
    turnConnectorVisible: Boolean(document.querySelector('.pace-outback-turn')),
    gap: Math.abs(
      Number(document.querySelector('.pace-outback-line--back')?.getAttribute('y1') ?? 0)
      - Number(document.querySelector('.pace-outback-line--out')?.getAttribute('y1') ?? 0),
    ),
    goal: {
      y: Number(document.querySelector('.pace-pacer-start .pace-pacer-hit')?.getAttribute('cy') ?? 0)
        - Number(document.querySelector('.pace-pacer-start .pace-pacer-hit')?.getAttribute('r') ?? 0),
      bottom: Number(document.querySelector('.pace-pacer-start .pace-pacer-hit')?.getAttribute('cy') ?? 0)
        + Number(document.querySelector('.pace-pacer-start .pace-pacer-hit')?.getAttribute('r') ?? 0),
      timeY: Number(document.querySelector('.pace-time-text')?.getAttribute('y') ?? 0),
      hasPlayIcon: Boolean(document.querySelector('.pace-pacer-start .pace-icon--play')),
      secondaryHidden: document.querySelector('.pace-pacer-secondary')?.getAttribute('aria-hidden'),
      center: (
        Number(document.querySelector('.pace-goal-text')?.getAttribute('y') ?? 0)
        + Number(document.querySelector('.pace-pacer-start .pace-pacer-hit')?.getAttribute('cy') ?? 0)
        + Number(document.querySelector('.pace-pacer-start .pace-pacer-hit')?.getAttribute('r') ?? 0)
      ) / 2,
    },
    markerCount: document.querySelectorAll('[data-pace-lap]').length,
    returnDot: {
      x: Number(document.querySelector('.pace-endpoint--return-start .pace-return-dot')?.getAttribute('cx') ?? 0),
      y: Number(document.querySelector('.pace-endpoint--return-start .pace-return-dot')?.getAttribute('cy') ?? 0),
      complete: document.querySelector('.pace-endpoint--return-start')?.classList.contains('pace-marker--complete') ?? false,
    },
    startLabelCount: document.querySelectorAll('.pace-start-label').length,
    startText: document.querySelector('.pace-start-text')?.textContent,
    turnLabelCount: document.querySelectorAll('.pace-turn-label').length,
    topOffsets: {
      near: Number(document.querySelector('.pace-outback-line--out')?.getAttribute('y1') ?? 0)
        - Number(document.querySelector('[data-pace-lap="1"] .pace-split')?.getAttribute('y') ?? 0),
      far: Number(document.querySelector('.pace-outback-line--out')?.getAttribute('y1') ?? 0)
        - Number(document.querySelector('[data-pace-lap="1"] .pace-label')?.getAttribute('y') ?? 0),
    },
    bottomOffsets: {
      near: Number(document.querySelector('[data-pace-lap="5"] .pace-label')?.getAttribute('y') ?? 0)
        - Number(document.querySelector('.pace-outback-line--back')?.getAttribute('y1') ?? 0),
      far: Number(document.querySelector('[data-pace-lap="5"] .pace-split')?.getAttribute('y') ?? 0)
        - Number(document.querySelector('.pace-outback-line--back')?.getAttribute('y1') ?? 0),
    },
    finish: {
      x: Number(document.querySelector('.pace-marker--finish .pace-dot--finish')?.getAttribute('cx') ?? 0),
      y: Number(document.querySelector('.pace-marker--finish .pace-dot--finish')?.getAttribute('cy') ?? 0),
    },
    runnerLeg: document.querySelector('[data-pacer-runner]')?.dataset.courseLeg,
  }));
  assert.equal(outBackCourseVisual.lineCount, 2, 'out/back mode renders outbound and return lines');
  assert.equal(outBackCourseVisual.splitMorphCount, 2, 'out/back mode animates the previous route line splitting into two lanes');
  assert.equal(outBackCourseVisual.turnConnectorVisible, false, 'out/back mode does not render a connector line');
  assert.ok(outBackCourseVisual.gap >= 75, 'out/back lanes have enough vertical separation for the goal time');
  assert.ok(Math.abs(outBackCourseVisual.goal.timeY - 97) <= 8, 'out/back goal time sits near the center between the lanes');
  assert.equal(outBackCourseVisual.goal.hasPlayIcon, true, 'out/back mode uses a play icon instead of START text');
  assert.equal(outBackCourseVisual.goal.secondaryHidden, 'true', 'out/back mode hides pause/reset before the pacer starts');
  assert.ok(outBackCourseVisual.goal.y > 60 && outBackCourseVisual.goal.bottom < 140, 'out/back goal/start controls sit between the lanes');
  assert.equal(outBackCourseVisual.markerCount, 8, 'out/back mode keeps 8 track-equivalent lap markers');
  assert.ok(outBackCourseVisual.returnDot.x > 300, 'out/back mode adds a visual return-lane dot at the right end');
  assert.ok(Math.abs(outBackCourseVisual.returnDot.y - outBackCourseVisual.finish.y) <= 1, 'out/back return-lane dot aligns with the finish lane');
  assert.equal(outBackCourseVisual.returnDot.complete, false, 'out/back return-lane dot starts incomplete');
  assert.equal(outBackCourseVisual.startLabelCount, 0, 'out/back removes the floating START label');
  assert.equal(outBackCourseVisual.startText, 'ST', 'out/back uses an inline start marker matching the finish marker');
  assert.equal(outBackCourseVisual.turnLabelCount, 0, 'out/back avoids an extra turn label competing with lap labels');
  assert.ok(Math.abs(outBackCourseVisual.topOffsets.near - outBackCourseVisual.bottomOffsets.near) <= 1, 'out/back near label lines sit equally from each lane');
  assert.ok(Math.abs(outBackCourseVisual.topOffsets.far - outBackCourseVisual.bottomOffsets.far) <= 1, 'out/back far label lines sit equally from each lane');
  assert.ok(outBackCourseVisual.finish.x < 40 && outBackCourseVisual.finish.y > 120, 'out/back mode places finish on the return lane at the left');
  assert.equal(outBackCourseVisual.runnerLeg, 'outbound', 'out/back mode starts runner on outbound line');

  await page.locator('[data-pacer-audio-field="courseMode"]').selectOption('track');
  await page.waitForFunction(() => document.querySelector('.lap-fitness')?.dataset.course === 'track');
  const trackReturnVisual = await page.evaluate(() => {
    const ring = document.querySelector('.pace-track-ring');
    const finishDot = document.querySelector('.pace-marker--finish .pace-dot--finish');
    const finishLabel = document.querySelector('.pace-marker--finish .pace-fin-label');
    const button = document.querySelector('.pace-pacer-start .pace-pacer-hit');
    const goalTime = document.querySelector('.pace-time-text');
    return {
      hasRouteLine: Boolean(document.querySelector('.pace-route-line')),
      joinMorphCount: document.querySelectorAll('.pace-morph-line--out-to-track, .pace-morph-line--back-to-track').length,
      previousCourse: document.querySelector('.lap-fitness')?.dataset.prevCourse,
      ringAnimation: ring ? getComputedStyle(ring).animationName : '',
      goalTimeY: Number(goalTime?.getAttribute('y') ?? 0),
      buttonCy: Number(button?.getAttribute('cy') ?? 0),
      trackCenterY: 95,
      buttonBottom: Number(button?.getAttribute('cy') ?? 0) + Number(button?.getAttribute('r') ?? 0),
      trackBottomY: Number(ring?.getAttribute('y') ?? 0) + Number(ring?.getAttribute('height') ?? 0),
      finishLabelX: Number(finishLabel?.getAttribute('x') ?? 0),
      finishDotX: Number(finishDot?.getAttribute('cx') ?? 0),
      finishLabelAnchor: finishLabel?.getAttribute('text-anchor'),
    };
  });
  assert.equal(trackReturnVisual.hasRouteLine, false, 'track mode removes route/out-back line geometry');
  assert.equal(trackReturnVisual.joinMorphCount, 2, 'track mode animates out/back lanes reconnecting toward the oval');
  assert.equal(trackReturnVisual.previousCourse, 'out-back', 'track mode remembers prior course for return transition');
  assert.match(trackReturnVisual.ringAnimation, /pace-track-expand-from-lines/, 'track mode animates back from line courses');
  assert.ok(Math.abs(trackReturnVisual.goalTimeY - trackReturnVisual.trackCenterY) <= 8, 'track goal time sits near the oval center');
  assert.ok(Math.abs(trackReturnVisual.buttonCy - trackReturnVisual.trackCenterY) <= 8, 'track play/pause controls sit near the oval center');
  assert.ok(trackReturnVisual.buttonBottom < trackReturnVisual.trackBottomY - 10, 'track START button clears the bottom of the oval');
  assert.equal(trackReturnVisual.finishLabelAnchor, 'middle', 'track finish label is centered on the finish marker');
  assert.ok(Math.abs(trackReturnVisual.finishLabelX - trackReturnVisual.finishDotX) <= 1, 'track finish label x-position matches the finish marker');

  const scoreBeforeAudioSettings = await page.evaluate(() => window.afptApp.getScoreResult()?.total);
  await page.locator('[data-pacer-audio-field="enabled"]').check();
  await page.locator('[data-pacer-audio-field="courseMode"]').selectOption('out-back');
  await page.locator('[data-pacer-audio-field="cueFrequency"]').selectOption('200m');
  await page.locator('[data-pacer-audio-field="vibration"]').check();
  await page.waitForFunction(() => window.afptApp.getPacerAudioSettings().courseMode === 'out-back');
  assert.equal(
    await page.evaluate(() => window.afptApp.getScoreResult()?.total),
    scoreBeforeAudioSettings,
    'changing pacer audio settings does not change score',
  );

  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(
    () => document.querySelector('#pfra-status')?.textContent.includes('Standards loaded'),
    undefined,
    { timeout: 10000 },
  );
  const persistedPacerAudio = await page.evaluate(() => ({
    enabled: document.querySelector('[data-pacer-audio-field="enabled"]')?.checked,
    courseMode: document.querySelector('[data-pacer-audio-field="courseMode"]')?.value,
    cueFrequency: document.querySelector('[data-pacer-audio-field="cueFrequency"]')?.value,
    vibration: document.querySelector('[data-pacer-audio-field="vibration"]')?.checked,
    settings: window.afptApp.getPacerAudioSettings(),
  }));
  assert.equal(persistedPacerAudio.enabled, true, 'pacer audio enabled setting persists after reload');
  assert.equal(persistedPacerAudio.courseMode, 'out-back', 'pacer audio course mode persists after reload');
  assert.equal(persistedPacerAudio.cueFrequency, '200m', 'pacer audio cue frequency persists after reload');
  assert.equal(persistedPacerAudio.vibration, true, 'pacer audio vibration setting persists after reload');
  assert.equal(persistedPacerAudio.settings.enabled, true, 'pacer audio API reflects persisted enabled setting');
  assert.deepEqual(
    Object.keys(persistedPacerAudio.settings).sort(),
    ['courseMode', 'cueFrequency', 'enabled', 'vibration'],
    'pacer audio settings are collapsed to the simplified voice pacer fields',
  );

  await page.evaluate(() => {
    window.__afptPacerAudioTestHooks = {
      events: [],
      unlockAudio() { this.events.push({ type: 'unlock' }); return Promise.resolve(true); },
      speak(text, cue) { this.events.push({ type: 'speak', kind: cue.kind, text }); },
      vibrate(pattern, cue) { this.events.push({ type: 'vibrate', kind: cue.kind, pattern }); },
      cancelSpeech() { this.events.push({ type: 'cancel' }); },
      setAudioSessionType(type) { this.events.push({ type: 'audio-session', audioSessionType: type }); },
      requestWakeLock() {
        this.events.push({ type: 'wake' });
        return Promise.resolve({
          release: () => window.__afptPacerAudioTestHooks.events.push({ type: 'release' }),
        });
      },
    };
  });
  await page.locator('[data-pacer-audio-test]').click();
  await page.waitForFunction(() => window.__afptPacerAudioTestHooks?.events?.some(
    (event) => event.type === 'speak' && /meters|Lap|Target|Finish|Turn/i.test(event.text),
  ));
  await page.waitForFunction(() => window.__afptPacerAudioTestHooks?.events?.some((event) => event.type === 'vibrate'));
  assert.match(
    await page.locator('[data-pacer-audio-status]').innerText(),
    /Test cue/i,
    'pacer audio test cue reports status',
  );

  // 6d. Pace plan personal pacer loops once per lap and marks completed laps.
  await page.evaluate(() => {
    const minEl = document.getElementById('run-mintxt');
    const secEl = document.getElementById('run-sectxt');
    if (minEl) minEl.value = '0';
    if (secEl) {
      secEl.value = '04';
      secEl.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  await page.waitForFunction(() => document.querySelector('[data-pacer-start]') && document.querySelector('[data-pacer-runner]'));
  const pacerInitial = await page.locator('[data-pacer-runner]').evaluate((element) => element.getAttribute('transform'));
  await page.locator('[data-pacer-start]').click();
  await page.waitForFunction(() => document.querySelector('.lap-fitness')?.dataset.pacerState === 'running');
  await page.waitForTimeout(2300);
  const pacerStarted = await page.evaluate((initialTransform) => {
    const runner = document.querySelector('[data-pacer-runner]');
    const status = document.querySelector('[data-pacer-status]');
    const plan = document.querySelector('.lap-fitness');
    const distanceText = document.querySelector('[data-pacer-distance-value]')?.textContent ?? '';
    const secondary = document.querySelector('[data-pacer-secondary]');
    return {
      transformChanged: runner?.getAttribute('transform') !== initialTransform,
      completedLapCount: document.querySelectorAll('.pace-marker--complete').length,
      returnDotComplete: document.querySelector('.pace-endpoint--return-start')?.classList.contains('pace-marker--complete') ?? false,
      runnerLeg: runner?.dataset.courseLeg ?? '',
      runnerTransform: runner?.getAttribute('transform') ?? '',
      statusText: status?.textContent ?? '',
      stateName: plan?.dataset.pacerState ?? '',
      cardioValue: window.afptApp.getState().cardio.value,
      distanceText,
      secondaryAction: secondary?.dataset.pacerAction,
      secondaryHidden: secondary?.getAttribute('aria-hidden'),
      pauseIconVisible: getComputedStyle(document.querySelector('.pace-pacer-secondary .pace-icon--pause')).display !== 'none',
      resetIconVisible: getComputedStyle(document.querySelector('.pace-pacer-secondary .pace-icon--reset')).display !== 'none',
    };
  }, pacerInitial);
  assert.equal(pacerStarted.stateName, 'running', 'pace plan personal pacer enters running state');
  assert.equal(pacerStarted.transformChanged, true, 'pace plan runner moves after start');
  assert.ok(pacerStarted.completedLapCount >= 1, 'pace plan marks completed laps');
  assert.equal(pacerStarted.returnDotComplete, true, 'pace plan marks the out/back return-lane dot complete after halfway');
  assert.equal(pacerStarted.runnerLeg, 'return', 'out/back pacer drops to the return line after halfway');
  assert.match(pacerStarted.runnerTransform, /rotate\(0(?:\.0)?\)/, 'pace plan runner stays upright while moving');
  assert.equal(pacerStarted.secondaryAction, 'pause', 'pace plan shows pause action after start');
  assert.equal(pacerStarted.secondaryHidden, 'false', 'pace plan reveals pause/reset control after start');
  assert.equal(pacerStarted.pauseIconVisible, true, 'pace plan shows pause icon while running');
  assert.equal(pacerStarted.resetIconVisible, false, 'pace plan hides reset icon while running');
  assert.match(pacerStarted.statusText, /Pacer.*Lap/i, 'pace plan status reports elapsed pacer time and current lap');
  assert.equal(pacerStarted.cardioValue, '0:04', 'starting pacer does not change cardio value');
  assert.match(pacerStarted.distanceText, /^\d+\.\d{2}$/, 'pace plan displays distance traveled in miles');
  assert.ok(Number(pacerStarted.distanceText) > 0.5, 'pace plan distance readout advances while pacer runs');
  const pacerAudioRunning = await page.evaluate(() => ({
    debug: window.afptApp.getPacerAudioDebug(),
    events: window.__afptPacerAudioTestHooks.events,
  }));
  assert.equal(pacerAudioRunning.debug.running, true, 'pacer audio controller runs while pacer is active');
  assert.ok(pacerAudioRunning.debug.lastCueIndex >= 0, 'pacer audio controller advances cues while running');
  assert.ok(
    pacerAudioRunning.events.some((event) => event.type === 'speak' && event.kind === 'start' && /Pacer started/i.test(event.text)),
    'pacer start tap plays a spoken arming cue',
  );
  assert.ok(
    pacerAudioRunning.events.some((event) => event.type === 'audio-session' && event.audioSessionType === 'transient'),
    'test cue and pacer start request transient audio session behavior when available',
  );
  assert.ok(
    pacerAudioRunning.events.some((event) => event.type === 'wake'),
    'pacer start requests wake lock through audio controller',
  );
  await page.locator('[data-pacer-secondary]').click();
  await page.waitForFunction(() => document.querySelector('.lap-fitness')?.dataset.pacerState === 'paused');
  const pacerPaused = await page.evaluate(() => ({
    secondaryAction: document.querySelector('[data-pacer-secondary]')?.dataset.pacerAction,
    pauseIconVisible: getComputedStyle(document.querySelector('.pace-pacer-secondary .pace-icon--pause')).display !== 'none',
    resetIconVisible: getComputedStyle(document.querySelector('.pace-pacer-secondary .pace-icon--reset')).display !== 'none',
  }));
  assert.equal(pacerPaused.secondaryAction, 'reset', 'pace plan changes pause control to reset after pausing');
  assert.equal(pacerPaused.pauseIconVisible, false, 'pace plan hides pause icon after pausing');
  assert.equal(pacerPaused.resetIconVisible, true, 'pace plan shows reset icon after pausing');
  await page.waitForFunction(() => window.afptApp.getPacerAudioDebug().running === false);
  assert.ok(
    await page.evaluate(() => window.__afptPacerAudioTestHooks.events.some(
      (event) => event.type === 'audio-session' && event.audioSessionType === 'auto',
    )),
    'pacer pause releases custom audio session behavior',
  );
  await page.locator('[data-pacer-secondary]').click();
  await page.waitForFunction(() => document.querySelector('.lap-fitness')?.dataset.pacerState === 'idle');
  assert.equal(await page.locator('[data-pacer-distance-value]').innerText(), '0.00', 'pace plan reset returns distance to zero');
  await page.evaluate(() => {
    const minEl = document.getElementById('run-mintxt');
    const secEl = document.getElementById('run-sectxt');
    if (minEl) minEl.value = '14';
    if (secEl) {
      secEl.value = '00';
      secEl.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  await page.waitForFunction(() => window.afptApp.getState().cardio.value === '14:00');
  await page.waitForFunction(() => window.afptApp.getPacerAudioDebug().lastCueIndex === -1);

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

  for (const preset of ['tactical', 'stencil', 'blues', 'light', 'fitness']) {
    await assertStickyHeaderAndSettingsLayer(page, preset, label);
  }

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
    await assertEventRowEdgeAlignment(page, 'cardio-editor', `${label} ${preset} cardio run`);

    await page.evaluate(() => {
      const sel = document.getElementById('cardio-sel');
      sel.value = 'hamr-20-meter';
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await page.waitForTimeout(50);
    await assertControlsStayInsideApp(page, `${label} ${preset} HAMR`);
    await assertEventRowEdgeAlignment(page, 'cardio-editor', `${label} ${preset} cardio HAMR`);
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
  const visibleScoreLabelInHeader = await page.locator('.editor-panel:not([hidden]) .editor-header .score-label-text:visible').count();
  assert.equal(visibleScoreLabelInHeader, 1, `${label} active editor score/min/max label sits under the editor title`);

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
  assert.equal(componentDividerInset.left, 0, `${label} bottom divider is flush to left`);
  assert.equal(componentDividerInset.right, 0, `${label} bottom divider is flush to right`);

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
  assert.ok(bluesRingWidth <= 172, `blues score ring is tightened: ${bluesRingWidth}px`);
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
  assert.ok(fitnessRingWidth <= 172, `fitness score ring is tightened: ${fitnessRingWidth}px`);
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
  await setThemePreset(page, 'light');
  const contrastScoreColumnAlignment = await page.evaluate(() => {
    const section = document.querySelector('.score-section')?.getBoundingClientRect();
    const labelRect = document.querySelector('.score-comp-label')?.getBoundingClientRect();
    const numberRect = document.querySelector('.score-number')?.getBoundingClientRect();
    const badgeRect = document.querySelector('.score-badge')?.getBoundingClientRect();
    if (!section || !labelRect || !numberRect || !badgeRect) return { missing: true };
    const center = (rect) => rect.left + rect.width / 2;
    const colWidth = section.width / 3;
    return {
      labelDelta: Math.abs(center(labelRect) - (section.left + colWidth / 2)),
      numberDelta: Math.abs(center(numberRect) - (section.left + colWidth * 1.5)),
      badgeDelta: Math.abs(center(badgeRect) - (section.left + colWidth * 2.5)),
    };
  });
  assert.equal(contrastScoreColumnAlignment.missing, undefined, 'contrast score column elements exist');
  assert.ok(contrastScoreColumnAlignment.labelDelta <= 12, `contrast total label centered in left column: ${contrastScoreColumnAlignment.labelDelta}px`);
  assert.ok(contrastScoreColumnAlignment.numberDelta <= 12, `contrast score number centered in middle column: ${contrastScoreColumnAlignment.numberDelta}px`);
  assert.ok(contrastScoreColumnAlignment.badgeDelta <= 12, `contrast status centered in right column: ${contrastScoreColumnAlignment.badgeDelta}px`);
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
  const chartControlOrderAndBorders = await page.evaluate(() => {
    const panel = document.querySelector('.chart-drawer__panel');
    if (panel) panel.scrollTop = 0;
    const referenceRow = document.querySelector('.chart-reference-row')?.getBoundingClientRect();
    const demoRow = document.querySelector('.chart-demo-row')?.getBoundingClientRect();
    const ctrlRow = document.querySelector('.chart-ctrl-row')?.getBoundingClientRect();
    const strong = getComputedStyle(document.documentElement).getPropertyValue('--afpt-border-strong').trim();
    const dropdowns = Array.from(document.querySelectorAll('.chart-demo-sel, .chart-ctrl-sel'));
    return {
      ordered: !!referenceRow && !!demoRow && !!ctrlRow
        && referenceRow.top < demoRow.top
        && demoRow.top < ctrlRow.top,
      borders: dropdowns.map((el) => getComputedStyle(el).borderTopColor),
      strong,
    };
  });
  assert.equal(chartControlOrderAndBorders.ordered, true, 'chart controls order reference, demographics, category/component');
  assert.ok(chartControlOrderAndBorders.borders.every((border) => border === chartControlOrderAndBorders.strong), 'chart dropdowns use strong border color');
  const chartScrollBehavior = await page.evaluate(() => {
    const panel = document.querySelector('.chart-drawer__panel');
    const header = document.querySelector('.chart-drawer__header');
    const referenceRow = document.querySelector('.chart-reference-row');
    const imageFrame = document.querySelector('.chart-drawer__image-frame');
    if (!panel || !header || !referenceRow || !imageFrame) return { missing: true };
    panel.scrollTop = 0;
    const beforeRefTop = referenceRow.getBoundingClientRect().top;
    panel.scrollTop = Math.min(180, panel.scrollHeight - panel.clientHeight);
    const afterRefTop = referenceRow.getBoundingClientRect().top;
    const panelRect = panel.getBoundingClientRect();
    const headerRect = header.getBoundingClientRect();
    const imageStyle = getComputedStyle(imageFrame);
    const result = {
      canScroll: panel.scrollHeight > panel.clientHeight,
      controlsMoved: afterRefTop < beforeRefTop - 20,
      headerPinned: Math.abs(headerRect.top - panelRect.top) <= 1,
      imageOverflowY: imageStyle.overflowY,
      panelOverflowY: getComputedStyle(panel).overflowY,
    };
    panel.scrollTop = 0;
    return result;
  });
  assert.equal(chartScrollBehavior.missing, undefined, 'chart drawer scroll elements exist');
  assert.equal(chartScrollBehavior.canScroll, true, 'chart drawer panel can scroll');
  assert.equal(chartScrollBehavior.controlsMoved, true, 'chart controls scroll with chart content');
  assert.equal(chartScrollBehavior.headerPinned, true, 'chart title/close row stays pinned while drawer scrolls');
  assert.equal(chartScrollBehavior.imageOverflowY, 'visible', 'chart image frame does not create a nested sticky-control scroll area');
  assert.match(chartScrollBehavior.panelOverflowY, /auto|scroll/i, 'chart drawer panel owns vertical scrolling');
  const segmentedBorderUsesStrong = await page.evaluate(() => {
    const strong = getComputedStyle(document.documentElement).getPropertyValue('--afpt-border-strong').trim();
    return ['body-seg-ctrl', 'push-seg-ctrl', 'sit-seg-ctrl', 'run-seg-ctrl']
      .map((id) => getComputedStyle(document.getElementById(id)).borderTopColor)
      .every((border) => border === strong);
  });
  assert.equal(segmentedBorderUsesStrong, true, 'component segmented toggles use strong border color');
  const hasChartTable = await page.evaluate(() => !!document.querySelector('#chart-content .chart-table'));
  assert.equal(hasChartTable, true, 'chart drawer contains generated score table');
  const chartDeltaColumn = await page.evaluate(() => {
    const headers = Array.from(document.querySelectorAll('#chart-content .chart-th'))
      .map((header) => header.textContent.trim());
    const deltaCells = Array.from(document.querySelectorAll('#chart-content .chart-cell--delta'))
      .map((cell) => cell.textContent.trim());
    return {
      headers,
      hasCurrent: deltaCells.includes('You'),
      hasNeed: deltaCells.some((text) => /^[+-]/.test(text)),
      hasMet: deltaCells.some((text) => text.startsWith('✓')),
      tierCells: document.querySelectorAll('#chart-content .chart-cell--tier').length,
    };
  });
  assert.deepEqual(chartDeltaColumn.headers, ['Reps', 'Pts', 'Your Gap'], 'chart table uses performance, points, gap columns');
  assert.equal(chartDeltaColumn.hasCurrent, true, 'chart delta column marks current row');
  assert.equal(chartDeltaColumn.hasNeed, true, 'chart delta column shows distance to unmet targets');
  assert.equal(chartDeltaColumn.hasMet, true, 'chart delta column shows already-met targets');
  assert.equal(chartDeltaColumn.tierCells, 0, 'chart no longer renders tier cells');
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
  await page.waitForFunction(() => {
    const modal = document.getElementById('modal');
    return modal?.dataset.chartMode === 'score'
      && !modal.hasAttribute('hidden')
      && !!document.querySelector('#chart-content .chart-table');
  });
  assert.equal(
    await page.locator('#chart-drawer-title').evaluate((el) => el.textContent.trim()),
    'Score Chart',
    'closing chart reference returns to score chart data',
  );
  await page.locator('#close-btn').click();
  await page.waitForFunction(() => document.getElementById('modal')?.hasAttribute('hidden'));
  const chartClosed = await page.evaluate(() => document.getElementById('modal')?.hasAttribute('hidden'));
  assert.equal(chartClosed, true, 'chart drawer closes on close-btn click');

  await page.locator('#summary-cardio').click();
  await page.waitForFunction(() => !document.getElementById('cardio-editor')?.hasAttribute('hidden'));
  await page.evaluate(() => {
    const sel = document.getElementById('cardio-sel');
    sel.value = 'hamr-20-meter';
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.waitForTimeout(50);
  await page.locator('#run-btn').click();
  await page.waitForFunction(() => !document.getElementById('modal')?.hasAttribute('hidden'));
  const hamrChartLevelLabels = await page.evaluate(() => {
    const headers = Array.from(document.querySelectorAll('#chart-content .chart-th'))
      .map((header) => header.textContent.trim());
    const levelLabels = Array.from(document.querySelectorAll('#chart-content .chart-hamr-level'))
      .map((label) => label.textContent.trim());
    const currentRowText = document.querySelector('#chart-content .chart-row--you .chart-cell--perf')?.textContent || '';
    const firstLabel = document.querySelector('#chart-content .chart-hamr-level');
    const firstLabelStyle = firstLabel ? getComputedStyle(firstLabel) : null;
    return {
      headers,
      hasLevelLabels: levelLabels.length > 0,
      sampleMatches: levelLabels.some((text) => /^\(L:\d+ \| S:\d+\)$/.test(text)),
      currentRowIncludesLevel: /\(L:\d+ \| S:\d+\)/.test(currentRowText),
      firstLabelDisplay: firstLabelStyle?.display,
      firstLabelColor: firstLabelStyle?.color,
      firstCellColor: firstLabel ? getComputedStyle(firstLabel.closest('.chart-cell')).color : null,
    };
  });
  assert.deepEqual(hamrChartLevelLabels.headers, ['Shuttles', 'Pts', 'Your Gap'], 'HAMR chart uses shuttles, points, gap columns');
  assert.equal(hamrChartLevelLabels.hasLevelLabels, true, 'HAMR chart adds level/shuttle labels in shuttles column');
  assert.equal(hamrChartLevelLabels.sampleMatches, true, 'HAMR level/shuttle labels use L/S format');
  assert.equal(hamrChartLevelLabels.currentRowIncludesLevel, true, 'HAMR current row includes level/shuttle position');
  assert.equal(hamrChartLevelLabels.firstLabelDisplay, 'inline', 'HAMR level/shuttle label stays inline with shuttle count');
  assert.equal(hamrChartLevelLabels.firstLabelColor, hamrChartLevelLabels.firstCellColor, 'HAMR level/shuttle label matches shuttle count styling');
  await page.locator('#chart-reference-btn').click();
  await page.waitForFunction(() => {
    const sources = Array.from(document.querySelectorAll('#chart-content .chart-reference__image'))
      .map((image) => image.getAttribute('src') || '');
    return sources.some((source) => source.includes('pfra-scoring-page-08.jpg'))
      && sources.some((source) => source.includes('ShuttleLevels.jpeg'));
  });
  assert.equal(
    await page.locator('#chart-drawer-title').evaluate((el) => el.textContent.trim()),
    '20m HAMR Official References',
    'HAMR reference button opens score chart plus shuttle card',
  );
  assert.equal(
    await page.locator('#chart-content .chart-reference__image').count(),
    2,
    'HAMR reference view shows both official images',
  );
  await page.locator('#close-btn').click();
  await page.waitForFunction(() => {
    const modal = document.getElementById('modal');
    return modal?.dataset.chartMode === 'score'
      && !modal.hasAttribute('hidden')
      && !!document.querySelector('#chart-content .chart-table');
  });
  assert.equal(
    await page.locator('#chart-drawer-title').evaluate((el) => el.textContent.trim()),
    'Score Chart',
    'closing HAMR reference returns to chart data',
  );
  await page.locator('#close-btn').click();
  await page.waitForFunction(() => document.getElementById('modal')?.hasAttribute('hidden'));
  await page.locator('#summary-strength').click();
  await page.waitForFunction(() => !document.getElementById('strength-editor')?.hasAttribute('hidden'));

  // 9a. Settings reference actions open official source images in the themed drawer
  for (const [selector, expectedSource, expectedTitle] of [
    ['#run-adjust-chart', 'dafman-36-2905-2-page1-full.png', 'Run Altitude Adjustment'],
    ['#walk-adjust-chart', 'dafman-36-2905-2-page2-full.png', 'Walk/Shuttle Altitude Adjustment'],
    ['#shuttle-score-card', 'ShuttleLevels.jpeg', 'HAMR Shuttle Score Card'],
  ]) {
    if (await page.locator('#settings-hub-panel').isHidden()) {
      await page.locator('#settings-hub-toggle').click();
    }
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
      await page.locator('.chart-reference-row').isHidden(),
      true,
      `${selector} hides score chart reference control`,
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
    assert.equal(
      await page.locator('#settings-hub-panel').isVisible(),
      true,
      `${selector} returns to still-open settings hub after closing reference`,
    );
  }
  await page.locator('#settings-hub-close').click();
  await page.waitForFunction(() => document.getElementById('settings-hub-panel')?.hidden);

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
