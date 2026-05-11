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

async function chartDrawerState(page) {
  return page.evaluate(() => {
    const drawer = document.getElementById('modal');
    const image = document.getElementById('modal-img');
    return {
      hidden: drawer?.hasAttribute('hidden'),
      imageAlt: image?.getAttribute('alt'),
      imageSrc: image?.getAttribute('src') || '',
      open: drawer?.dataset.chartOpen,
      title: document.getElementById('chart-drawer-title')?.innerText.trim(),
      variant: drawer?.dataset.chartVariant,
    };
  });
}

async function openChartAndAssert(page, selector, expectedSource, { viaSettings = false } = {}) {
  if (viaSettings) await openSettingsHub(page);
  await page.locator(selector).click();
  await page.waitForFunction(
    (expected) => {
      const drawer = document.getElementById('modal');
      const image = document.getElementById('modal-img');
      return drawer && !drawer.hasAttribute('hidden') && image?.getAttribute('src')?.includes(expected);
    },
    expectedSource,
  );

  const state = await chartDrawerState(page);
  assert.equal(state.hidden, false, `${selector} opens chart drawer`);
  assert.equal(state.open, 'true', `${selector} marks drawer open`);
  assert.ok(state.imageSrc.includes(expectedSource), `${selector} displays expected chart source`);
  assert.ok(state.imageAlt && state.imageAlt !== 'Score chart', `${selector} sets chart alt text`);
  assert.ok(state.title && state.title !== 'Score Chart', `${selector} sets chart title`);
  assert.equal(
    state.variant,
    await page.evaluate(() => window.afptTheme.getActiveThemePreset().variants.chartDisplay),
    `${selector} uses active chart variant`,
  );

  return state;
}

async function closeChartByButton(page) {
  await page.locator('#close-btn').click();
  await page.waitForFunction(() => document.getElementById('modal')?.hasAttribute('hidden'));
}

async function closeChartByEscape(page) {
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => document.getElementById('modal')?.hasAttribute('hidden'));
}

async function closeChartByScrim(page) {
  await page.locator('#chart-drawer-scrim').click({ position: { x: 10, y: 10 } });
  await page.waitForFunction(() => document.getElementById('modal')?.hasAttribute('hidden'));
}

async function assertChartDrawerShortcuts(page) {
  await openChartAndAssert(page, '#walk-adjust-chart', 'walkAltitudeAdjust.webp', { viaSettings: true });
  await closeChartByEscape(page);

  await openChartAndAssert(page, '#shuttle-score-card', 'shuttleScores.webp', { viaSettings: true });
  await closeChartByScrim(page);

  await openChartAndAssert(page, '#push-btn', 'Strength_Abs.webp');
  await closeChartByButton(page);

  await page.evaluate(() => window.afptComponentEditor.selectComponent('core'));
  await page.waitForFunction(() => !document.getElementById('core-editor')?.hasAttribute('hidden'));
  await openChartAndAssert(page, '#sit-btn', 'Strength_Abs.webp');
  await closeChartByEscape(page);
  await page.evaluate(() => window.afptComponentEditor.selectComponent('strength'));

  await openChartAndAssert(page, '#run-btn', 'cardio.webp');
  await closeChartByButton(page);
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

  await openChartAndAssert(page, '#run-adjust-chart', 'runAltitudeAdjust.webp');
  await closeChartByButton(page);

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

async function scoreHeaderState(page) {
  return page.evaluate(() => {
    const header = document.getElementById('score-header');
    const source = document.getElementById('score-txt');
    return {
      aria: header?.getAttribute('aria-label'),
      className: header?.className,
      mode: document.getElementById('score-header-mode')?.textContent.trim(),
      raw: header?.dataset.scoreRaw,
      source: source?.innerText.replace(/\s+/g, ' ').trim(),
      status: document.getElementById('score-header-status')?.textContent.trim(),
      value: document.getElementById('score-header-value')?.textContent.trim(),
      variant: header?.dataset.scoreVariant,
    };
  });
}

async function lapDisplayState(page) {
  return page.evaluate(() => {
    const normalizeLapText = (text = '') => text.replace(/≤/g, '<=').replace(/\s+/g, ' ').trim();
    const display = document.getElementById('lap-display');
    const source = document.getElementById('run-lap-times');
    return {
      className: display?.className,
      count: Number(display?.dataset.lapCount || 0),
      display: normalizeLapText(display?.innerText),
      raw: display?.dataset.lapRaw,
      source: normalizeLapText(source?.innerText),
      variant: display?.dataset.lapVariant,
      visible: display ? !display.hidden : false,
    };
  });
}

async function componentEditorState(page) {
  return page.evaluate(() => {
    const strip = document.getElementById('component-summary-strip');
    const strengthBtn = document.getElementById('summary-strength');
    const coreBtn = document.getElementById('summary-core');
    const cardioBtn = document.getElementById('summary-cardio');
    const editorVisible = (id) => {
      const el = document.getElementById(id);
      return el ? !el.hasAttribute('hidden') : null;
    };
    return {
      cardioEditorVisible: editorVisible('cardio-editor'),
      cardioPressed: cardioBtn?.getAttribute('aria-pressed'),
      coreEditorVisible: editorVisible('core-editor'),
      corePressed: coreBtn?.getAttribute('aria-pressed'),
      selectedComponent: window.afptComponentEditor?.getSelectedComponent(),
      strengthEditorVisible: editorVisible('strength-editor'),
      strengthPressed: strengthBtn?.getAttribute('aria-pressed'),
      stripVariant: strip?.dataset.stripVariant,
      stripVisible: strip ? getComputedStyle(strip).display !== 'none' : false,
    };
  });
}

async function assertActiveComponentEditor(page) {
  await page.waitForFunction(() => document.getElementById('active-component-editor'));

  const initial = await componentEditorState(page);
  assert.ok(initial.strengthEditorVisible === true, 'strength editor visible by default');
  assert.ok(initial.coreEditorVisible === false, 'core editor hidden by default');
  assert.ok(initial.cardioEditorVisible === false, 'cardio editor hidden by default');

  await page.locator('#summary-core').click();
  await page.waitForFunction(() => document.getElementById('summary-core')?.getAttribute('aria-pressed') === 'true');
  const afterCore = await componentEditorState(page);
  assert.equal(afterCore.strengthEditorVisible, false, 'strength editor hidden after selecting core');
  assert.equal(afterCore.coreEditorVisible, true, 'core editor visible after selecting core');
  assert.equal(afterCore.cardioEditorVisible, false, 'cardio editor hidden after selecting core');

  await page.locator('#summary-cardio').click();
  await page.waitForFunction(() => document.getElementById('summary-cardio')?.getAttribute('aria-pressed') === 'true');
  const afterCardio = await componentEditorState(page);
  assert.equal(afterCardio.strengthEditorVisible, false, 'strength editor hidden after selecting cardio');
  assert.equal(afterCardio.coreEditorVisible, false, 'core editor hidden after selecting cardio');
  assert.equal(afterCardio.cardioEditorVisible, true, 'cardio editor visible after selecting cardio');

  await page.locator('#summary-strength').click();
  await page.waitForFunction(() => document.getElementById('summary-strength')?.getAttribute('aria-pressed') === 'true');
  const afterStrength = await componentEditorState(page);
  assert.equal(afterStrength.strengthEditorVisible, true, 'strength editor visible after re-selecting strength');
  assert.equal(afterStrength.coreEditorVisible, false, 'core editor hidden after re-selecting strength');
  assert.equal(afterStrength.cardioEditorVisible, false, 'cardio editor hidden after re-selecting strength');

  const overflow = await page.evaluate(() => {
    const container = document.getElementById('active-component-editor');
    return container ? container.scrollWidth > container.clientWidth : false;
  });
  assert.equal(overflow, false, 'active component editor has no horizontal overflow');
}

async function assertComponentSummaryStrip(page) {
  await page.waitForFunction(() => document.getElementById('component-summary-strip'));

  const initial = await componentEditorState(page);
  assert.ok(initial.stripVisible, 'component summary strip is visible');
  assert.ok(initial.stripVariant, 'component summary strip has a variant applied');
  assert.equal(initial.strengthPressed, 'true', 'strength is selected by default');
  assert.equal(initial.corePressed, 'false', 'core is not selected by default');
  assert.equal(initial.cardioPressed, 'false', 'cardio is not selected by default');
  assert.equal(initial.selectedComponent, 'strength', 'selectedComponent is strength by default');

  await page.locator('#summary-core').click();
  await page.waitForFunction(() => document.getElementById('summary-core')?.getAttribute('aria-pressed') === 'true');
  const afterCore = await componentEditorState(page);
  assert.equal(afterCore.strengthPressed, 'false', 'strength deselected after clicking core');
  assert.equal(afterCore.corePressed, 'true', 'core selected after clicking core');
  assert.equal(afterCore.cardioPressed, 'false', 'cardio not selected after clicking core');
  assert.equal(afterCore.selectedComponent, 'core', 'selectedComponent is core after clicking core');

  await page.locator('#summary-cardio').click();
  await page.waitForFunction(() => document.getElementById('summary-cardio')?.getAttribute('aria-pressed') === 'true');
  const afterCardio = await componentEditorState(page);
  assert.equal(afterCardio.strengthPressed, 'false', 'strength not selected after clicking cardio');
  assert.equal(afterCardio.corePressed, 'false', 'core not selected after clicking cardio');
  assert.equal(afterCardio.cardioPressed, 'true', 'cardio selected after clicking cardio');
  assert.equal(afterCardio.selectedComponent, 'cardio', 'selectedComponent is cardio after clicking cardio');

  await page.locator('#summary-strength').click();
  await page.waitForFunction(() => document.getElementById('summary-strength')?.getAttribute('aria-pressed') === 'true');
  const afterStrength = await componentEditorState(page);
  assert.equal(afterStrength.strengthPressed, 'true', 'strength re-selected after clicking strength');
  assert.equal(afterStrength.selectedComponent, 'strength', 'selectedComponent returns to strength');

  const stripLayout = await page.evaluate(() => {
    const cards = document.querySelectorAll('.component-summary-card');
    const strip = document.getElementById('component-summary-strip');
    const stripWidth = strip?.getBoundingClientRect().width ?? 0;
    return {
      cardWidths: Array.from(cards).map((c) => c.getBoundingClientRect().width),
      count: cards.length,
      stripWidth,
    };
  });
  assert.equal(stripLayout.count, 3, 'all 3 summary cards are in the DOM');
  for (const w of stripLayout.cardWidths) {
    assert.ok(w > 0, 'each summary card has positive width');
  }
  const totalCardWidth = stripLayout.cardWidths.reduce((sum, w) => sum + w, 0);
  assert.ok(totalCardWidth <= stripLayout.stripWidth + 12, 'all 3 cards fit within strip width');
}

async function strengthCardState(page) {
  return page.evaluate(() => {
    const editor = document.getElementById('strength-editor');
    const pushSel = document.getElementById('push-sel');
    const pushTxt = document.getElementById('push-txt');
    const strengthScore = document.getElementById('pfra-strength-score');
    return {
      editorPresent: !!editor,
      pushEvent: pushSel?.value,
      pushValue: pushTxt?.value,
      strengthScoreText: strengthScore?.textContent.trim(),
    };
  });
}

async function bodyCompositionCardState(page) {
  return page.evaluate(() => {
    const card = document.getElementById('body-composition-card');
    const whtrInput = document.getElementById('pfra-whtr');
    const bodyScore = document.getElementById('pfra-body-score');
    return {
      cardVariant: card?.dataset.cardVariant,
      className: card?.className,
      visible: card ? getComputedStyle(card.closest('.pfra-panel') || card).display !== 'none' : false,
      whtrValue: whtrInput?.value,
      bodyScoreText: bodyScore?.textContent.trim(),
    };
  });
}

async function assertStrengthCard(page) {
  await page.waitForFunction(() => document.getElementById('strength-editor'));

  const state = await strengthCardState(page);
  assert.ok(state.editorPresent, 'strength-editor is in the DOM');

  // strength score visible in PFRA mode
  const scoreVisible = await page.evaluate(() => {
    const score = document.querySelector('.component-editor__pfra-score');
    return score ? getComputedStyle(score).display !== 'none' : false;
  });
  assert.equal(scoreVisible, true, 'strength editor pfra score visible in PFRA mode');

  // exemption: select Exempt, verify score shows EXEMPT
  await page.locator('#push-sel').selectOption('Exempt');
  await page.waitForTimeout(100);
  const exemptScore = await page.evaluate(() => document.getElementById('pfra-strength-score')?.textContent.trim());
  assert.equal(exemptScore, 'EXEMPT', 'strength exemption sets PFRA strength score to EXEMPT');

  // restore
  await page.locator('#push-sel').selectOption('Pushups');
  await page.waitForTimeout(100);

  // event switch updates labels
  await page.locator('#push-sel').selectOption('Hand-Release');
  const labelAfter = await text(page, '#push-txt-p');
  assert.match(labelAfter, /Strength Score/, 'event switch updates strength score text');
  await page.locator('#push-sel').selectOption('Pushups');

  // score header still mirrors total
  const header = await scoreHeaderState(page);
  assert.match(header.value, /^\d+\.\d$/, 'score header mirrors total after strength changes');
}

async function assertCoreEditor(page) {
  // switch to core component so the panel is visible
  await page.evaluate(() => window.afptComponentEditor.selectComponent('core'));
  await page.waitForFunction(() => !document.getElementById('core-editor')?.hasAttribute('hidden'));

  // pfra-core-score visible in PFRA mode
  const coreScoreVisible = await page.evaluate(() => {
    const score = document.getElementById('pfra-core-score');
    return score ? getComputedStyle(score).display !== 'none' : false;
  });
  assert.equal(coreScoreVisible, true, 'core editor pfra score visible in PFRA mode');

  // exemption: select Exempt, verify score shows EXEMPT
  await page.locator('#sit-sel').selectOption('Exempt');
  await page.waitForTimeout(100);
  const exemptScore = await page.evaluate(() => document.getElementById('pfra-core-score')?.textContent.trim());
  assert.equal(exemptScore, 'EXEMPT', 'core exemption sets PFRA core score to EXEMPT');

  // restore and verify event label updates
  await page.locator('#sit-sel').selectOption('Situps');
  await page.waitForTimeout(100);
  await page.locator('#sit-sel').selectOption('Plank');
  const labelAfter = await text(page, '#sit-txt-p');
  assert.match(labelAfter, /Core Score/, 'core event switch updates score text');
  await page.locator('#sit-sel').selectOption('Situps');

  // score header still mirrors total
  const header = await scoreHeaderState(page);
  assert.match(header.value, /^\d+\.\d$/, 'score header mirrors total after core changes');

  // restore strength as active component
  await page.evaluate(() => window.afptComponentEditor.selectComponent('strength'));
}

async function assertBodyCompositionCard(page) {
  await page.waitForFunction(() => document.getElementById('body-composition-card'));

  const state = await bodyCompositionCardState(page);
  assert.ok(state.cardVariant, 'body-composition-card has a variant applied');
  assert.ok(state.visible, 'body-composition-card is visible in PFRA mode');

  const whtrBefore = state.whtrValue;
  const testWhtr = whtrBefore === '0.49' ? '0.55' : '0.49';
  await setControlValue(page, '#pfra-whtr', testWhtr, 'input');
  await page.waitForTimeout(100);

  const scoreAfter = await bodyCompositionCardState(page);
  assert.notEqual(scoreAfter.bodyScoreText, '--', 'WHtR change updates body score');

  const headerAfter = await scoreHeaderState(page);
  assert.match(headerAfter.value, /^\d+\.\d$/, 'score header mirrors updated total after WHtR change');

  await setControlValue(page, '#pfra-whtr', whtrBefore, 'input');
}

async function headerControlState(page) {
  return page.evaluate(() => ({
    age: document.getElementById('age-sel')?.value,
    mode: document.getElementById('standards-mode')?.value,
    sex: document.getElementById('sex-sel')?.value,
  }));
}

async function assertHeaderControlsVisible(page) {
  for (const selector of ['#sex-sel', '#age-sel', '#standards-mode']) {
    const control = page.locator(selector);
    await control.scrollIntoViewIfNeeded();
    const box = await control.boundingBox();
    assert.ok(box, `${selector} has a layout box`);
    assert.ok(box.width >= 76, `${selector} remains usable width`);
    assert.ok(box.height >= 40, `${selector} remains usable height`);
    assert.equal(await control.isVisible(), true, `${selector} is visible`);
  }
}

async function assertLapDisplayMirrorsSource(page, { count, variant }) {
  await page.waitForFunction(() => document.getElementById('lap-display')?.dataset.lapRaw);
  const state = await lapDisplayState(page);

  assert.equal(state.visible, true, 'lap display is visible');
  assert.equal(state.variant, variant, 'lap display variant');
  assert.equal(state.count, count, 'lap display lap count');
  assert.equal(state.raw, state.source, 'lap display mirrors source text');
  assert.match(state.display, new RegExp(`${count} laps`, 'i'), 'lap display includes lap count');
  const firstLapTime = state.raw.match(/Lap 1: <= ([^ ]+)/)?.[1];
  const finalLapTime = state.raw.match(new RegExp(`Lap ${count}: <= ([^ ]+)`))?.[1];
  assert.ok(firstLapTime && state.display.includes(firstLapTime), 'lap display includes first lap target');
  assert.ok(finalLapTime && state.display.includes(finalLapTime), 'lap display includes final lap target');

  return state;
}

async function assertScoreHeaderMirrorsSource(page, { mode, variant }) {
  await page.waitForFunction(() => document.getElementById('score-header')?.dataset.scoreRaw);
  const state = await scoreHeaderState(page);

  assert.equal(state.mode, mode, `${mode} score header mode`);
  assert.equal(state.variant, variant, `${mode} score header variant`);
  assert.match(state.value, /^\d+\.\d$/, `${mode} score header value`);
  assert.ok(state.source.includes(state.value), `${mode} score header value comes from source score text`);
  assert.ok(state.source.toLowerCase().includes(state.status.toLowerCase()), `${mode} score header status comes from source score text`);
  assert.ok(state.aria.includes(state.value), `${mode} score header aria label includes value`);

  return state;
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
  const headerBefore = await scoreHeaderState(page);
  const controlsBefore = await headerControlState(page);
  const lapBefore = await lapDisplayState(page);
  const whtrBefore = await inputValue(page, '#pfra-whtr');
  const bodyCardBefore = await bodyCompositionCardState(page);
  const strengthBefore = await strengthCardState(page);
  const stripBefore = await componentEditorState(page);
  await setThemePreset(page, nextPreset);
  const headerAfter = await scoreHeaderState(page);
  const controlsAfter = await headerControlState(page);
  const lapAfter = await lapDisplayState(page);
  const whtrAfter = await inputValue(page, '#pfra-whtr');
  const bodyCardAfter = await bodyCompositionCardState(page);
  const strengthAfter = await strengthCardState(page);
  const expectedVariant = await page.evaluate(
    (presetId) => window.afptTheme.resolveThemePreset(presetId).variants.scoreHeader,
    nextPreset,
  );
  const expectedLapVariant = await page.evaluate(
    (presetId) => window.afptTheme.resolveThemePreset(presetId).variants.lapDisplay,
    nextPreset,
  );

  assert.equal(await page.locator('html').getAttribute('data-theme-preset'), nextPreset);
  assert.equal(await page.locator('body').getAttribute('data-theme-preset'), nextPreset);
  assert.equal(
    await page.evaluate(() => localStorage.getItem(window.afptTheme.THEME_STORAGE_KEY)),
    nextPreset,
    'theme preset persists locally',
  );
  assert.equal(await text(page, '#run-txt-p'), scoreBefore, 'theme switch preserves score text');
  assert.equal(await inputValue(page, '#run-slider'), sliderBefore, 'theme switch preserves slider value');
  assert.equal(headerAfter.value, headerBefore.value, 'theme switch preserves score header value');
  assert.equal(headerAfter.status, headerBefore.status, 'theme switch preserves score header status');
  assert.equal(headerAfter.variant, expectedVariant, 'theme switch applies preset score header variant');
  assert.notEqual(headerAfter.className, headerBefore.className, 'theme switch changes score header presentation');
  assert.deepEqual(controlsAfter, controlsBefore, 'theme switch preserves header controls');
  assert.equal(lapAfter.raw, lapBefore.raw, 'theme switch preserves lap values');
  assert.equal(lapAfter.variant, expectedLapVariant, 'theme switch applies preset lap display variant');
  assert.notEqual(lapAfter.className, lapBefore.className, 'theme switch changes lap display presentation');
  assert.equal(whtrAfter, whtrBefore, 'theme switch preserves WHtR value');
  assert.equal(bodyCardAfter.bodyScoreText, bodyCardBefore.bodyScoreText, 'theme switch preserves body score');
  const expectedBodyVariant = await page.evaluate(
    (presetId) => window.afptTheme.resolveThemePreset(presetId).variants.bodyCompositionCard,
    nextPreset,
  );
  assert.equal(bodyCardAfter.cardVariant, expectedBodyVariant, 'theme switch applies preset body composition variant');
  assert.notEqual(bodyCardAfter.className, bodyCardBefore.className, 'theme switch changes body composition card presentation');
  assert.equal(strengthAfter.pushEvent, strengthBefore.pushEvent, 'theme switch preserves strength event');
  assert.equal(strengthAfter.pushValue, strengthBefore.pushValue, 'theme switch preserves strength input value');
  const stripAfter = await componentEditorState(page);
  const expectedStripVariant = await page.evaluate(
    (presetId) => window.afptTheme.resolveThemePreset(presetId).variants.componentSummaryStrip,
    nextPreset,
  );
  assert.equal(stripAfter.stripVariant, expectedStripVariant, 'theme switch applies preset summary strip variant');
  assert.equal(stripAfter.selectedComponent, stripBefore.selectedComponent, 'theme switch preserves selected component');
  assert.equal(stripAfter.strengthEditorVisible, stripBefore.strengthEditorVisible, 'theme switch preserves strength editor visibility');
  assert.equal(stripAfter.coreEditorVisible, stripBefore.coreEditorVisible, 'theme switch preserves core editor visibility');
  assert.equal(stripAfter.cardioEditorVisible, stripBefore.cardioEditorVisible, 'theme switch preserves cardio editor visibility');
}

async function assertSettingsPanelAlignment(page) {
  await openSettingsHub(page);

  const alignment = await page.evaluate(() => {
    const panel = document.getElementById('settings-hub-panel');
    const toggle = document.getElementById('settings-hub-toggle');
    if (!panel || !toggle) return null;
    const panelRect = panel.getBoundingClientRect();
    const toggleRect = toggle.getBoundingClientRect();
    return {
      panelRight: Math.round(panelRect.right),
      toggleRight: Math.round(toggleRect.right),
      viewportWidth: window.innerWidth,
    };
  });

  assert.ok(alignment, 'settings panel and toggle are present');
  assert.ok(
    Math.abs(alignment.panelRight - alignment.toggleRight) < 60,
    `settings panel right edge (${alignment.panelRight}px) aligns with toggle right edge (${alignment.toggleRight}px) — delta must be <60px`,
  );

  await closeSettingsHub(page);
}

async function assertDesktopCardAlignment(page) {
  const widths = await page.evaluate(() => {
    const rect = (sel) => document.querySelector(sel)?.getBoundingClientRect().width ?? null;
    return {
      scoreHeader: rect('#score-header'),
      componentEditor: rect('#active-component-editor'),
      topBar: rect('.info-section'),
    };
  });
  const { scoreHeader, componentEditor, topBar } = widths;
  assert.ok(scoreHeader !== null, 'score header is in the DOM');
  assert.ok(componentEditor !== null, 'active component editor is in the DOM');
  assert.ok(
    Math.abs(scoreHeader - componentEditor) < 40,
    `desktop card widths are aligned: score-header=${scoreHeader?.toFixed(0)}px component-editor=${componentEditor?.toFixed(0)}px (delta must be <40px)`,
  );
  if (topBar !== null) {
    assert.ok(
      Math.abs(topBar - scoreHeader) < 40,
      `top bar width aligns with card column: top-bar=${topBar?.toFixed(0)}px score-header=${scoreHeader?.toFixed(0)}px (delta must be <40px)`,
    );
  }
}

async function runLegacyRegression(browser, baseUrl, label, contextOptions = {}) {
  const { context, failures, page } = await newPage(browser, baseUrl, `?no-sw=1&qa=legacy-regression-${label}`, contextOptions);

  await assertSettingsHubParity(page);
  await assertHeaderControlsVisible(page);
  await assertComponentSummaryStrip(page);
  await assertActiveComponentEditor(page);

  if (label === 'desktop') {
    await assertDesktopCardAlignment(page);
    await assertSettingsPanelAlignment(page);
  }

  assert.equal(await inputValue(page, '#run-slider'), '1136');
  assert.equal(await text(page, '#run-txt-p'), 'Run Score: 35 | Min: 18:56 | Max: 10:23');
  await assertScoreHeaderMirrorsSource(page, {
    mode: 'Legacy',
    variant: 'tactical-score-number',
  });

  const defaultRunText = await text(page, '#run-txt-p');
  await page.locator('#sex-sel').selectOption('Male');
  await page.locator('#age-sel').selectOption('30-34');
  assert.equal(await inputValue(page, '#sex-sel'), 'Male');
  assert.equal(await inputValue(page, '#age-sel'), '30-34');
  assert.notEqual(await text(page, '#run-txt-p'), defaultRunText, 'sex/age changes update legacy ranges');
  await assertScoreHeaderMirrorsSource(page, {
    mode: 'Legacy',
    variant: 'tactical-score-number',
  });
  await assertThemeFoundation(page, 'stencil');
  await page.locator('#sex-sel').selectOption('Female');
  await page.locator('#age-sel').selectOption('< 25');
  assert.equal(await text(page, '#run-txt-p'), defaultRunText, 'restored sex/age returns legacy ranges');
  await assertLapDisplayMirrorsSource(page, {
    count: 6,
    variant: 'stencil-vertical-bars',
  });
  await assertChartDrawerShortcuts(page);

  const bodyCardLegacy = await page.evaluate(() => {
    const pfraPanel = document.querySelector('.pfra-panel');
    return pfraPanel ? getComputedStyle(pfraPanel).display : 'none';
  });
  assert.equal(bodyCardLegacy, 'none', 'body-composition-card hidden in legacy mode via pfra-panel');

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

  await page.evaluate(() => window.afptComponentEditor.selectComponent('core'));
  await page.waitForFunction(() => !document.getElementById('core-editor')?.hasAttribute('hidden'));
  await page.locator('#sit-txt').fill('54');
  await page.locator('#sit-tick').click();
  assert.equal(await inputValue(page, '#sit-txt'), '35');
  assert.equal(await inputValue(page, '#sit-slider'), '35');
  await page.evaluate(() => window.afptComponentEditor.selectComponent('strength'));

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

  await assertHeaderControlsVisible(page);
  await assertComponentSummaryStrip(page);
  await assertActiveComponentEditor(page);
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
  await assertScoreHeaderMirrorsSource(page, {
    mode: 'PFRA 2026',
    variant: 'tactical-score-number',
  });
  await assertThemeFoundation(page, 'fitness');
  await assertLapDisplayMirrorsSource(page, {
    count: 8,
    variant: 'fitness-tiles',
  });
  await assertBodyCompositionCard(page);
  await assertStrengthCard(page);
  await assertCoreEditor(page);

  await page.locator('#push-txt').fill('50');
  await page.locator('#push-tick').click();
  assert.equal(await inputValue(page, '#push-txt'), '15');
  assert.equal(await inputValue(page, '#push-slider'), '15');

  await page.evaluate(() => window.afptComponentEditor.selectComponent('core'));
  await page.waitForFunction(() => !document.getElementById('core-editor')?.hasAttribute('hidden'));
  // Fire the input event on sit-txt to trigger PFRA tick update, then wait for the PFRA minimum to be applied
  await page.locator('#sit-txt').fill('54');
  // Dispatch input on the slider to ensure PFRA tick wires to PFRA minimum
  await page.evaluate(() => {
    const slider = document.getElementById('sit-slider');
    slider.value = 54;
    slider.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.waitForTimeout(100);
  await page.locator('#sit-tick').click();
  assert.equal(await inputValue(page, '#sit-txt'), '29');
  assert.equal(await inputValue(page, '#sit-slider'), '29');
  await page.evaluate(() => window.afptComponentEditor.selectComponent('strength'));

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
