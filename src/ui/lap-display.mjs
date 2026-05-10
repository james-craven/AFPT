const IMPLEMENTED_LAP_VARIANTS = new Set([
  'blues-table',
  'fitness-tiles',
  'light-rows',
  'stencil-vertical-bars',
  'tactical-horizontal-bars',
]);

let variantOverride = null;

function normalizeText(text) {
  return text.replace(/≤/g, '<=').replace(/\s+/g, ' ').trim();
}

function currentLapVariant() {
  if (variantOverride && IMPLEMENTED_LAP_VARIANTS.has(variantOverride)) return variantOverride;

  const resolved = window.afptTheme?.getActiveThemePreset?.();
  const variant = resolved?.variants?.lapDisplay || 'light-rows';
  return IMPLEMENTED_LAP_VARIANTS.has(variant) ? variant : 'light-rows';
}

function lineText(source) {
  return (source?.innerText || source?.textContent || '')
    .split(/\n+/)
    .map((line) => normalizeText(line))
    .filter(Boolean);
}

function parseLapSource(source) {
  const lines = lineText(source);
  const rawText = lines.join(' ');
  const summary = lines[0] || '';
  const lapMatch = summary.match(/^Req'd\s+(\d+)\s+Lap Time:\s*~(.+)$/i);
  const laps = lines.slice(1).map((line) => {
    const match = line.match(/^Lap\s+(\d+):\s*<=\s*(.+)$/i);
    if (!match) return null;
    return {
      number: Number(match[1]),
      time: match[2],
    };
  }).filter(Boolean);

  return {
    lapCount: lapMatch ? Number(lapMatch[1]) : laps.length,
    rawText,
    requiredLapTime: lapMatch?.[2] || '',
    rows: laps,
    summary,
  };
}

function clearElement(element) {
  while (element.firstChild) element.firstChild.remove();
}

function appendText(parent, tagName, className, text) {
  const element = document.createElement(tagName);
  element.className = className;
  element.innerText = text;
  parent.append(element);
  return element;
}

function renderSummary(display, state) {
  const summary = document.createElement('div');
  summary.className = 'lap-display__summary';
  appendText(summary, 'span', 'lap-display__eyebrow', state.lapCount ? `${state.lapCount} laps` : 'Timing');
  appendText(summary, 'strong', 'lap-display__required', state.requiredLapTime || state.summary);
  display.append(summary);
}

function renderLightRows(display, state) {
  renderSummary(display, state);
  const list = document.createElement('ol');
  list.className = 'lap-display__rows';

  for (const lap of state.rows) {
    const item = document.createElement('li');
    item.className = 'lap-display__row';
    appendText(item, 'span', 'lap-display__lap', `Lap ${lap.number}`);
    appendText(item, 'span', 'lap-display__time', lap.time);
    list.append(item);
  }

  display.append(list);
}

function renderTacticalBars(display, state) {
  renderSummary(display, state);
  const list = document.createElement('ol');
  list.className = 'lap-display__bars';
  const denominator = Math.max(state.rows.length, 1);

  for (const lap of state.rows) {
    const item = document.createElement('li');
    item.className = 'lap-display__bar-row';
    appendText(item, 'span', 'lap-display__lap', `${lap.number}`);
    const track = document.createElement('span');
    track.className = 'lap-display__bar-track';
    const fill = document.createElement('span');
    fill.className = 'lap-display__bar-fill';
    fill.style.width = `${Math.max(12, (lap.number / denominator) * 100)}%`;
    track.append(fill);
    item.append(track);
    appendText(item, 'span', 'lap-display__time', lap.time);
    list.append(item);
  }

  display.append(list);
}

function renderStencilBars(display, state) {
  renderSummary(display, state);
  const chart = document.createElement('ol');
  chart.className = 'lap-display__vertical-bars';
  const denominator = Math.max(state.rows.length, 1);

  for (const lap of state.rows) {
    const item = document.createElement('li');
    item.className = 'lap-display__vertical-item';
    const bar = document.createElement('span');
    bar.className = 'lap-display__vertical-bar';
    bar.style.height = `${Math.max(18, (lap.number / denominator) * 100)}%`;
    appendText(item, 'span', 'lap-display__time', lap.time);
    item.append(bar);
    appendText(item, 'span', 'lap-display__lap', `${lap.number}`);
    chart.append(item);
  }

  display.append(chart);
}

function renderFitnessTiles(display, state) {
  renderSummary(display, state);
  const grid = document.createElement('ol');
  grid.className = 'lap-display__tiles';

  for (const lap of state.rows) {
    const tile = document.createElement('li');
    tile.className = 'lap-display__tile';
    appendText(tile, 'span', 'lap-display__lap', `Lap ${lap.number}`);
    appendText(tile, 'span', 'lap-display__time', lap.time);
    grid.append(tile);
  }

  display.append(grid);
}

function renderBluesTable(display, state) {
  renderSummary(display, state);
  const table = document.createElement('table');
  table.className = 'lap-display__table';
  const head = document.createElement('thead');
  const body = document.createElement('tbody');
  const headRow = document.createElement('tr');
  appendText(headRow, 'th', '', 'Lap');
  appendText(headRow, 'th', '', 'Target');
  head.append(headRow);

  for (const lap of state.rows) {
    const row = document.createElement('tr');
    appendText(row, 'td', '', String(lap.number));
    appendText(row, 'td', '', lap.time);
    body.append(row);
  }

  table.append(head, body);
  display.append(table);
}

function renderFallback(display, state) {
  appendText(display, 'p', 'lap-display__fallback', state.rawText);
}

function setVariant(display, variant) {
  display.dataset.lapVariant = variant;
  display.classList.remove(
    'lap-display--blues-table',
    'lap-display--fitness-tiles',
    'lap-display--light-rows',
    'lap-display--stencil-vertical-bars',
    'lap-display--tactical-horizontal-bars',
  );
  display.classList.add(`lap-display--${variant}`);
}

function renderLapDisplay(display, source) {
  const state = parseLapSource(source);
  const variant = currentLapVariant();
  clearElement(display);
  setVariant(display, variant);
  display.dataset.lapRaw = state.rawText;
  display.dataset.lapCount = String(state.lapCount || 0);
  display.hidden = !state.rawText;

  if (!state.rawText) return;

  if (!state.rows.length) {
    renderFallback(display, state);
  } else if (variant === 'tactical-horizontal-bars') {
    renderTacticalBars(display, state);
  } else if (variant === 'stencil-vertical-bars') {
    renderStencilBars(display, state);
  } else if (variant === 'fitness-tiles') {
    renderFitnessTiles(display, state);
  } else if (variant === 'blues-table') {
    renderBluesTable(display, state);
  } else {
    renderLightRows(display, state);
  }

  display.setAttribute('aria-label', state.rawText);
}

function initLapDisplay() {
  const display = document.getElementById('lap-display');
  const source = document.getElementById('run-lap-times');
  if (!display || !source) return;

  const update = () => renderLapDisplay(display, source);
  const observer = new MutationObserver(update);
  observer.observe(source, {
    characterData: true,
    childList: true,
    subtree: true,
  });

  document.addEventListener('afpt:themechange', update);
  update();

  window.afptLapDisplay = Object.freeze({
    applyVariantOverride(variant) {
      variantOverride = IMPLEMENTED_LAP_VARIANTS.has(variant) ? variant : null;
      update();
    },
    clearVariantOverride() {
      variantOverride = null;
      update();
    },
    implementedVariants: Array.from(IMPLEMENTED_LAP_VARIANTS),
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLapDisplay, { once: true });
} else {
  initLapDisplay();
}
