import { loadPfraStandards, walkMaximumTime } from './standards.mjs';
import {
  applyHamrAltitudeAdjustment,
  applyRunAltitudeAdjustment,
  applyWalkAltitudeAdjustment,
  categoryForTotal,
  firstScoringCellValue,
  pfraAgeToWalkAgeGroup,
  scoreFromTable,
  scorePfraAssessment,
  scoreWalk,
  secondsToTimeString,
  toSeconds,
  topCellValue,
} from './scoring.mjs';
import { eventDefaults } from './state.mjs';

// --- State ---

const defaultCardioValue = '20:00'; // fallback before tables load

// Per-event value cache — preserves user input across event switches
const savedEventValues = {
  strength: {},
  core: {},
  cardio: {},
};

let state = {
  sex: 'female',
  ageGroup: 'under-25',
  whtr: '0.49',
bodyHeightFt: '5',
bodyHeightIn: '10',
bodyWaist: '34',
bodyExempt: false,
altitudeGroup: 0,
  strength: { event: 'push-up', value: '0', exempt: false },
  core: { event: 'sit-up', value: '0', exempt: false },
  cardio: { event: 'two-mile-run', value: defaultCardioValue, exempt: false },
  selectedComponent: 'strength',
};

// --- Standards ---

let standards = null;
let tables = {};
let altitudeTables = {};
let ready = false;
let loadError = null;

// Which WHtR input the slider is "locked to" — sticky on focus, not cleared on blur
let _whtrFocus = 'ratio'; // 'ratio' | 'ft' | 'in' | 'waist'

// --- DOM helpers ---

function byId(id) { return document.getElementById(id); }
function val(id) { return byId(id)?.value ?? ''; }

// --- Altitude ---

function readAltitudeGroup(v) {
  if (!v || v === 'Altitude Adjust') return 0;
  if (v.startsWith('Group 1')) return 1;
  if (v.startsWith('Group 2')) return 2;
  if (v.startsWith('Group 3')) return 3;
  if (v.startsWith('Group 4')) return 4;
  return 0;
}

// --- State management ---

function getState() {
  return {
    ...state,
    strength: { ...state.strength },
    core: { ...state.core },
    cardio: { ...state.cardio },
  };
}

function refreshStateFromDom() {
  const pushSel = byId('push-sel');
  const sitSel = byId('sit-sel');
  const cardioSel = byId('cardio-sel');

  const cardioEvent = cardioSel?.value || 'two-mile-run';
  let cardioValue = state.cardio.value;
  if (cardioEvent === 'hamr-20-meter') {
    cardioValue = val('run-shuttle-txt') || state.cardio.value;
  } else {
    const m = val('run-mintxt');
    const s = val('run-sectxt');
    if (m !== '' && s !== '') cardioValue = `${m}:${s.padStart(2, '0')}`;
  }

  const coreEvent = sitSel?.value === 'exempt' ? state.core.event : (sitSel?.value || 'sit-up');
  let coreValue = state.core.value;
  if (coreEvent === 'forearm-plank') {
    const pm = val('sit-txt-plank');
    const ps = val('plankmintxt');
    if (pm !== '' && ps !== '') coreValue = `${pm}:${ps.padStart(2, '0')}`;
  } else {
    coreValue = val('sit-txt') || state.core.value;
  }

  const bodyModeSel = byId('body-mode-sel');
  state = {
    sex: byId('sex-sel')?.value || 'female',
    ageGroup: byId('age-sel')?.value || 'under-25',
    whtr: val('pfra-whtr') || '0.49',
bodyHeightFt: val('height-ft-input') || state.bodyHeightFt || '5',
bodyHeightIn: val('height-in-input') || state.bodyHeightIn || '10',
bodyWaist: val('waist-input') || state.bodyWaist || '34',
bodyExempt: bodyModeSel?.value === 'exempt',
altitudeGroup: readAltitudeGroup(val('alt-select')),
    strength: {
      event: pushSel?.value === 'exempt' ? (state.strength.event || 'push-up') : (pushSel?.value || 'push-up'),
      value: val('push-txt') || '0',
      exempt: pushSel?.value === 'exempt',
    },
    core: {
      event: coreEvent,
      value: coreValue,
      exempt: sitSel?.value === 'exempt',
    },
    cardio: {
      event: cardioSel?.value === 'exempt' ? (state.cardio.event || 'two-mile-run') : cardioEvent,
      value: cardioValue,
      exempt: cardioSel?.value === 'exempt',
    },
    selectedComponent: state.selectedComponent,
  };
}

function dispatch(action) {
  switch (action.type) {
    case 'SET_SEX': state = { ...state, sex: action.sex }; break;
    case 'SET_AGE_GROUP': state = { ...state, ageGroup: action.ageGroup }; break;
    case 'SET_WHTR': state = { ...state, whtr: action.value }; break;
case 'SET_BODY_HEIGHT_FT': state = { ...state, bodyHeightFt: action.value }; break;
case 'SET_BODY_HEIGHT_IN': state = { ...state, bodyHeightIn: action.value }; break;
case 'SET_BODY_WAIST': state = { ...state, bodyWaist: action.value }; break;
case 'SET_BODY_EXEMPT': state = { ...state, bodyExempt: action.exempt }; break;
    case 'SET_ALTITUDE_GROUP': state = { ...state, altitudeGroup: action.group }; break;
    case 'SET_STRENGTH_EVENT': state = { ...state, strength: { ...state.strength, event: action.event } }; break;
    case 'SET_STRENGTH_VALUE': state = { ...state, strength: { ...state.strength, value: action.value } }; break;
    case 'SET_STRENGTH_EXEMPT': state = { ...state, strength: { ...state.strength, exempt: action.exempt } }; break;
    case 'SET_CORE_EVENT': state = { ...state, core: { ...state.core, event: action.event } }; break;
    case 'SET_CORE_VALUE': state = { ...state, core: { ...state.core, value: action.value } }; break;
    case 'SET_CORE_EXEMPT': state = { ...state, core: { ...state.core, exempt: action.exempt } }; break;
    case 'SET_CARDIO_EVENT': state = { ...state, cardio: { ...state.cardio, event: action.event } }; break;
    case 'SET_CARDIO_VALUE': state = { ...state, cardio: { ...state.cardio, value: action.value } }; break;
    case 'SET_CARDIO_EXEMPT': state = { ...state, cardio: { ...state.cardio, exempt: action.exempt } }; break;
    case 'SET_SELECTED_COMPONENT': state = { ...state, selectedComponent: action.component }; break;
    default: break;
  }
}

function lowestScoringDefault(event, ageGroup, sex) {
  const t = tables[event];
  if (!t) return String(eventDefaults[event] ?? '0');

  const v = firstScoringCellValue(t, ageGroup, sex);
  return v !== undefined ? String(v) : String(eventDefaults[event] ?? '0');
}

// Returns the lowest valid scoring value for a cardio event given current sex/age.
// Used at init and on event change so sliders never start out of range.
function lowestCardioDefault(event, ageGroup, sex) {
  if (event === 'two-kilometer-walk') {
    return walkMaximumTime(standards, ageGroup, sex)
      || eventDefaults['two-kilometer-walk']
      || defaultCardioValue;
  }

  return lowestScoringDefault(event, ageGroup, sex)
    || (event === 'hamr-20-meter' ? '40' : defaultCardioValue);
}

function clearSavedEventValues() {
  Object.keys(savedEventValues.strength).forEach((key) => delete savedEventValues.strength[key]);
  Object.keys(savedEventValues.core).forEach((key) => delete savedEventValues.core[key]);
  Object.keys(savedEventValues.cardio).forEach((key) => delete savedEventValues.cardio[key]);
}

function syncCurrentInputsFromState() {
  const pushTxt = byId('push-txt');
  if (pushTxt) pushTxt.value = state.strength.value;

  if (state.core.event === 'forearm-plank') {
    const parts = String(state.core.value).split(':');
    const minEl = byId('sit-txt-plank');
    const secEl = byId('plankmintxt');
    if (minEl) minEl.value = parts[0] || '0';
    if (secEl) secEl.value = (parts[1] || '00').padStart(2, '0');
  } else {
    const sitTxt = byId('sit-txt');
    if (sitTxt) sitTxt.value = state.core.value;
  }

  if (state.cardio.event === 'hamr-20-meter') {
    const shuttleTxt = byId('run-shuttle-txt');
    if (shuttleTxt) shuttleTxt.value = state.cardio.value;
  } else if (state.cardio.event !== 'two-kilometer-walk') {
    const parts = String(state.cardio.value).split(':');
    const minEl = byId('run-mintxt');
    const secEl = byId('run-sectxt');
    if (minEl) minEl.value = parts[0] || '0';
    if (secEl) secEl.value = (parts[1] || '00').padStart(2, '0');
  }
}

function resetCurrentEventDefaults() {
  const strengthDef = lowestScoringDefault(state.strength.event, state.ageGroup, state.sex);
  dispatch({ type: 'SET_STRENGTH_VALUE', value: strengthDef });
  savedEventValues.strength[state.strength.event] = strengthDef;

  const coreDef = lowestScoringDefault(state.core.event, state.ageGroup, state.sex);
  dispatch({ type: 'SET_CORE_VALUE', value: coreDef });
  savedEventValues.core[state.core.event] = coreDef;

  const cardioDef = lowestCardioDefault(state.cardio.event, state.ageGroup, state.sex);
  dispatch({ type: 'SET_CARDIO_VALUE', value: cardioDef });
  savedEventValues.cardio[state.cardio.event] = cardioDef;

  syncCurrentInputsFromState();
}

// --- Scoring ---

function altitudeAdjustedCardio(cardioEvent, rawPerformance, altGroup, sex, ageGroup) {
  if (!altGroup || altGroup <= 0 || !rawPerformance) return rawPerformance;

  if (cardioEvent === 'two-mile-run') {
    if (!altitudeTables.run) return rawPerformance;
    const perfSec = toSeconds(rawPerformance);
    if (!Number.isFinite(perfSec)) return rawPerformance;
    return secondsToTimeString(applyRunAltitudeAdjustment(perfSec, altGroup, altitudeTables.run));
  }

  if (cardioEvent === 'hamr-20-meter') {
    return String(Math.round(applyHamrAltitudeAdjustment(Number(rawPerformance), altGroup)));
  }

  if (cardioEvent === 'two-kilometer-walk') {
    const walkAgeGroup = pfraAgeToWalkAgeGroup(ageGroup);
    const walkTable = sex === 'male' ? altitudeTables.walkMale : altitudeTables.walkFemale;
    if (!walkTable) return rawPerformance;
    const altMaxTime = applyWalkAltitudeAdjustment(walkTable, walkAgeGroup, altGroup);
    const seaLevelMaxTime = walkMaximumTime(standards, ageGroup, sex);
    if (!altMaxTime || !seaLevelMaxTime) return rawPerformance;
    const bonus = toSeconds(altMaxTime) - toSeconds(seaLevelMaxTime);
    if (!Number.isFinite(bonus) || bonus <= 0) return rawPerformance;
    const perfSec = toSeconds(rawPerformance);
    if (!Number.isFinite(perfSec)) return rawPerformance;
    return secondsToTimeString(Math.max(0, perfSec - bonus));
  }

  return rawPerformance;
}

function computeScoreFromState(s) {
  if (!standards || !Object.keys(tables).length) return null;
  const adjustedCardio = s.cardio.exempt
    ? s.cardio.value
    : altitudeAdjustedCardio(s.cardio.event, s.cardio.value.trim(), s.altitudeGroup, s.sex, s.ageGroup);
  return scorePfraAssessment({
    ageGroup: s.ageGroup,
    sex: s.sex,
    standards,
    tables,
    whtr: s.bodyExempt ? '0.00' : s.whtr,
    strengthEvent: s.strength.event,
    strengthPerformance: s.strength.value.trim(),
    coreEvent: s.core.event,
    corePerformance: s.core.value.trim(),
    cardioEvent: s.cardio.event,
    cardioPerformance: adjustedCardio,
    exemptions: {
      strength: s.strength.exempt,
      core: s.core.exempt,
      cardio: s.cardio.exempt,
    },
  });
}

function getScoreResult() { return computeScoreFromState(state); }

function refreshScoreFromDom() {
  refreshStateFromDom();
  return computeScoreFromState(state);
}

function isReady() { return ready; }
function getLoadError() { return loadError; }

// --- Chart generation ---

// Events per category for the chart modal component dropdown
const CHART_CATEGORY_EVENTS = {
  strength: [
    { value: 'push-up', label: 'Push-Ups (1 Min)' },
    { value: 'hand-release-push-up', label: 'Hand-Release Push-Ups' },
  ],
  core: [
    { value: 'sit-up', label: 'Sit-Ups (1 Min)' },
    { value: 'cross-leg-reverse-crunch', label: 'Cross-Leg Reverse Crunch' },
    { value: 'forearm-plank', label: 'Forearm Plank' },
  ],
  cardio: [
    { value: 'two-mile-run', label: '2 Mile Run' },
    { value: 'hamr-20-meter', label: '20m HAMR' },
    { value: 'two-kilometer-walk', label: '2 km Walk' },
  ],
};

const OFFICIAL_REFERENCES = {
  runAltitude: {
    title: 'Run Altitude Adjustment',
    src: './standards/sources/a31-crops/dafman-36-2905-2-page1-full.png',
    alt: 'Official DAFMAN 36-2905 Table A3.1 altitude time correction for the 2.0 mile run',
    caption: 'DAFMAN 36-2905, Attachment 3, Table A3.1',
  },
  walkAltitude: {
    title: 'Walk/Shuttle Altitude Adjustment',
    src: './standards/sources/a31-crops/dafman-36-2905-2-page2-full.png',
    alt: 'Official DAFMAN 36-2905 Tables A3.2, A3.3, and A3.4 for walk and HAMR altitude adjustment',
    caption: 'DAFMAN 36-2905, Attachment 3, Tables A3.2-A3.4',
  },
  shuttleScoreCard: {
    title: 'HAMR Shuttle Score Card',
    src: './standards/sources/ShuttleLevels.jpeg',
    alt: 'Official 20 meter high aerobic multi-shuttle run level and shuttle score card',
    caption: '20M High Aerobic Multi-Shuttle Run score card',
  },
};

const HAMR_LEVEL_RANGES = [
  { level: 1, start: 1, end: 7 },
  { level: 2, start: 8, end: 15 },
  { level: 3, start: 16, end: 23 },
  { level: 4, start: 24, end: 32 },
  { level: 5, start: 33, end: 41 },
  { level: 6, start: 42, end: 50 },
  { level: 7, start: 51, end: 60 },
  { level: 8, start: 61, end: 70 },
  { level: 9, start: 71, end: 81 },
  { level: 10, start: 82, end: 92 },
  { level: 11, start: 93, end: 104 },
  { level: 12, start: 105, end: 116 },
  { level: 13, start: 117, end: 129 },
  { level: 14, start: 130, end: 142 },
  { level: 15, start: 143, end: 155 },
];

// Modal-local state: separate from main app sex/age so changes don't affect scoring
let chartModalState = { sex: 'female', ageGroup: 'under-25', category: 'strength', event: 'push-up' };

function setChartDrawerTitle(titleText) {
  const title = byId('chart-drawer-title');
  if (title) title.textContent = titleText;
}

function setChartControlsVisible(visible) {
  const ctrlRow = document.querySelector('.chart-ctrl-row');
  const demoRow = document.querySelector('.chart-demo-row');
  if (ctrlRow) ctrlRow.hidden = !visible;
  if (demoRow) demoRow.hidden = !visible;
}

function currentPerformanceForChart(event, ageGroup, sex) {
  if (event === state.strength.event && !state.strength.exempt) {
    return String(state.strength.value).trim();
  }

  if (event === state.core.event && !state.core.exempt) {
    return String(state.core.value).trim();
  }

  if (event === state.cardio.event && !state.cardio.exempt) {
    return altitudeAdjustedCardio(event, String(state.cardio.value).trim(), state.altitudeGroup, sex, ageGroup);
  }

  return null;
}

function generateScoreChartFor(event, ageGroup, sex) {
  if (!ready) return '<p class="chart-empty">Standards not yet loaded.</p>';

  if (event === 'two-kilometer-walk') {
    const maxTime = walkMaximumTime(standards, ageGroup, sex);
    const currentPerformance = currentPerformanceForChart(event, ageGroup, sex);
    const currentScore = currentPerformance
      ? scoreWalk(standards, { ageGroup, sex, performance: currentPerformance })
      : null;
    const youText = currentPerformance
      ? `<br><strong class="chart-you chart-you--walk">&lt; YOU ${currentPerformance} · ${currentScore > 0 ? 'PASS' : 'FAIL'}</strong>`
      : '';
    return `<p class="chart-empty">Walk is pass/fail. Max time: <strong>${maxTime ?? '--'}</strong>${youText}</p>`;
  }

  const table = tables[event];
  if (!table) return `<p class="chart-empty">No chart available for ${event}.</p>`;

  const isTime = table.unit === 'min:sec';
  const colHeader = isTime ? 'Time' : 'Reps';
  const currentPerformance = currentPerformanceForChart(event, ageGroup, sex);
  const currentMatch = currentPerformance
    ? scoreFromTable(table, { ageGroup, sex, performance: currentPerformance }).matchedCell
    : null;

  let rows = '';
  for (const row of table.rows) {
    const cell = row.values?.[ageGroup]?.[sex];
    if (!cell) continue;
    const pts = row.points;
    const rawVal = cell.value;
    const displayVal = isTime
      ? rawVal
      : (cell.atLeast ? `&ge;&nbsp;${rawVal}` : `&le;&nbsp;${rawVal}`);
    const tier = pts >= 15 ? 'MAX' : pts >= 10 ? 'EXC' : pts >= 5 ? 'SAT' : 'MIN';
    const tierCls = pts >= 15 ? 'tier--max' : pts >= 10 ? 'tier--exc' : pts >= 5 ? 'tier--sat' : 'tier--min';
    const isCurrentRow = currentMatch === cell;
    const youMarker = isCurrentRow ? '<span class="chart-you" aria-label="You are here">&lt; YOU</span>' : '';
    rows += `<tr class="${isCurrentRow ? 'chart-row--you' : ''}"><td class="chart-cell chart-cell--perf">${displayVal}</td><td class="chart-cell chart-cell--score">${pts}${youMarker}</td><td class="chart-cell chart-cell--tier ${tierCls}">${tier}</td></tr>`;
  }

  const ageFmt = ageGroup.replace('under-', '< ').replace('-and-over', '+').replace('-', '–');
  return `<p class="chart-meta">${sex === 'male' ? 'Male' : 'Female'} &middot; Age ${ageFmt}</p><table class="chart-table"><thead><tr><th class="chart-th">${colHeader}</th><th class="chart-th">Pts</th><th class="chart-th">Tier</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function refreshChartContent() {
  const contentEl = byId('chart-content');
  if (contentEl) {
    setChartDrawerTitle('Score Chart');
    contentEl.innerHTML = generateScoreChartFor(
      chartModalState.event,
      chartModalState.ageGroup,
      chartModalState.sex,
    );
    window.requestAnimationFrame(() => {
      contentEl.querySelector('.chart-row--you')?.scrollIntoView({ block: 'center' });
    });
  }
}

function renderOfficialReference(referenceKey) {
  const contentEl = byId('chart-content');
  const reference = OFFICIAL_REFERENCES[referenceKey];
  if (!contentEl || !reference) return;

  setChartDrawerTitle(reference.title);
  contentEl.innerHTML = `<figure class="chart-reference">
    <div class="chart-reference__frame">
      <img class="chart-reference__image" src="${reference.src}" alt="${reference.alt}">
    </div>
    <figcaption class="chart-reference__caption">${reference.caption}</figcaption>
  </figure>`;
}

function populateChartComponentSel(category) {
  const sel = byId('chart-component-sel');
  if (!sel) return;
  const events = CHART_CATEGORY_EVENTS[category] || [];
  sel.innerHTML = events.map((e) => `<option value="${e.value}">${e.label}</option>`).join('');
  sel.value = events[0]?.value ?? '';
  chartModalState.event = sel.value;
}

function openChart(component, _title) {
  const modal = byId('modal');
  if (!modal) return;
  modal.dataset.chartMode = 'score';
  setChartControlsVisible(true);

  // Determine category and event from component arg (fallback to strength)
  let category = 'strength';
  let event = 'push-up';
  if (component === 'core') { category = 'core'; event = state.core.event; }
  else if (component === 'cardio') { category = 'cardio'; event = state.cardio.event; }
  else if (component === 'strength') { category = 'strength'; event = state.strength.event; }

  // Clamp to known events (exempt maps to first in category)
  const eventsInCat = CHART_CATEGORY_EVENTS[category] ?? [];
  if (!eventsInCat.find((e) => e.value === event)) event = eventsInCat[0]?.value ?? 'push-up';

  // Reset modal state to main app demographics
  chartModalState = { sex: state.sex, ageGroup: state.ageGroup, category, event };

  // Sync category selector
  const catSel = byId('chart-category-sel');
  if (catSel) catSel.value = category;

  // Populate and sync component selector
  populateChartComponentSel(category);
  const compSel = byId('chart-component-sel');
  if (compSel) compSel.value = event;
  chartModalState.event = compSel?.value ?? event;

  // Sync demographics selectors
  const sexSel = byId('chart-sex-sel');
  const ageSel = byId('chart-age-sel');
  if (sexSel) sexSel.value = chartModalState.sex;
  if (ageSel) ageSel.value = chartModalState.ageGroup;

  refreshChartContent();
  modal.removeAttribute('hidden');
  modal.dataset.chartOpen = 'true';
}

function openOfficialReference(referenceKey) {
  const modal = byId('modal');
  if (!modal) return;
  modal.dataset.chartMode = 'reference';
  setChartControlsVisible(false);
  renderOfficialReference(referenceKey);
  modal.removeAttribute('hidden');
  modal.dataset.chartOpen = 'true';
}

function closeChart() {
  const modal = byId('modal');
  if (!modal) return;
  modal.setAttribute('hidden', '');
  delete modal.dataset.chartOpen;
}

// PACE PLAN LOCKED: User approved this visual. Do not redesign. Only move/retheme.
// --- Stadium point — exact translation of mock-fitness.jsx stadiumPoint ---
// t in [0,1): 0 = top-center, clockwise. expand pushes outward along local normal.
function stadiumPoint(t, x, y, w, h, r, expand) {
  if (expand === undefined) expand = 0;
  const P = 2 * (w - 2 * r) + 2 * Math.PI * r;
  let s = (((t % 1) + 1) % 1) * P;
  const sh = w / 2 - r;
  const semi = Math.PI * r;
  if (s < sh) return { x: x + w / 2 + s, y: y - expand };
  s -= sh;
  if (s < semi) {
    const a = -Math.PI / 2 + (s / semi) * Math.PI;
    return { x: x + w - r + (r + expand) * Math.cos(a), y: y + r + (r + expand) * Math.sin(a) };
  }
  s -= semi;
  if (s < w - 2 * r) return { x: x + w - r - s, y: y + h + expand };
  s -= w - 2 * r;
  if (s < semi) {
    const a = Math.PI / 2 + (s / semi) * Math.PI;
    return { x: x + r + (r + expand) * Math.cos(a), y: y + r + (r + expand) * Math.sin(a) };
  }
  s -= semi;
  return { x: x + r + s, y: y - expand };
}

// PACE PLAN LOCKED: User approved this visual. Do not redesign. Only move/retheme.
// Canonical pace plan — used on all themes. SVG uses CSS classes for token-based theming.
// viewBox 0 0 340 190, rect x=70 y=50 w=200 h=90 rx=45 (exact mock-fitness.jsx params).
function formatPacePlan(totalSeconds, lapCount, lapSec) {
  const totalStr = secondsToTimeString(totalSeconds);
  const lapTimeStr = secondsToTimeString(lapSec);
  let markers = '';

  for (let i = 0; i < lapCount; i++) {
    const n = i + 1;
    const t = (n / lapCount) % 1; // lap n=lapCount → t=0 → top-center = FINISH
    const p = stadiumPoint(t, 70, 50, 200, 90, 45, 0);
    const lp = stadiumPoint(t, 70, 50, 200, 90, 45, 22);
    const isFinish = i === lapCount - 1;
    const anchor = (t > 0.05 && t < 0.45) ? 'start' : (t > 0.55 && t < 0.95) ? 'end' : 'middle';
    const dx = anchor === 'start' ? 4 : anchor === 'end' ? -4 : 0;
    const splitStr = secondsToTimeString(lapSec * n);
    const labelText = isFinish ? 'FINISH' : `L${n}`;
    const splitWeight = isFinish ? 800 : 600;
    const dotR = isFinish ? 7 : 4.5;
    // Finish dot uses hardcoded gold→pink gradient (always distinctive on any theme).
    // Non-finish dots use .pace-dot CSS class so the theme token applies.
    const dotAttrs = isFinish
      ? `fill="url(#pacePlanFinGrad)" stroke="rgba(255,255,255,0.4)" stroke-width="1.5"`
      : `class="pace-dot"`;
    const finText = isFinish
      ? `<text x="${p.x.toFixed(1)}" y="${(p.y + 0.5).toFixed(1)}" text-anchor="middle" dominant-baseline="middle" class="pace-fin-text" font-size="6" font-weight="800" letter-spacing="0.5">FIN</text>`
      : '';
    markers += `<g>
      <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${dotR}" ${dotAttrs}/>
      ${finText}
      <text x="${(lp.x + dx).toFixed(1)}" y="${(lp.y - 4).toFixed(1)}" text-anchor="${anchor}" class="${isFinish ? 'pace-fin-label' : 'pace-label'}" font-size="8" letter-spacing="1" font-weight="600">${labelText}</text>
      <text x="${(lp.x + dx).toFixed(1)}" y="${(lp.y + 7).toFixed(1)}" text-anchor="${anchor}" class="${isFinish ? 'pace-fin-split' : 'pace-split'}" font-size="11" font-weight="${splitWeight}" font-variant-numeric="tabular-nums">${splitStr}</text>
    </g>`;
  }

  return `<div class="lap-fitness">
    <div class="lap-fitness__hdr">
      <span class="lap-fitness__title">Pace plan</span>
      <span class="lap-fitness__sub">each lap &middot; <span class="lap-fitness__pace">${lapTimeStr}</span></span>
    </div>
    <p class="lap-fitness__cue">Glance at your watch crossing the line.</p>
    <div class="lap-fitness__svg-wrap">
      <svg width="100%" viewBox="0 0 340 190" style="max-width:340px;display:block;margin:0 auto">
        <defs>
          <linearGradient id="pacePlanFinGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#ffb547"/>
            <stop offset="1" stop-color="#ff5dab"/>
          </linearGradient>
        </defs>
        <rect x="70" y="50" width="200" height="90" rx="45" fill="none" class="pace-track-ring" stroke-width="14"/>
        <rect x="70" y="50" width="200" height="90" rx="45" fill="none" class="pace-track-dash" stroke-width="1" stroke-dasharray="2 6"/>
        <text x="170" y="87" text-anchor="middle" class="pace-goal-text" font-size="9" letter-spacing="2">GOAL</text>
        <text x="170" y="113" text-anchor="middle" class="pace-time-text" font-size="26" font-weight="800" letter-spacing="-0.5" font-variant-numeric="tabular-nums">${totalStr}</text>
        ${markers}
      </svg>
    </div>
  </div>`;
}

// PACE PLAN LOCKED: User approved this visual. Do not redesign. Only move/retheme.
function renderPacePlan() {
  const lapDisplay = byId('run-lap-times');
  if (!lapDisplay) return;
  const section = lapDisplay.closest('.pace-plan-section');
  if (state.cardio.exempt || state.cardio.event !== 'two-mile-run') {
    lapDisplay.innerHTML = '';
    if (section) section.hidden = true;
    return;
  }
  const curSec = toSeconds(state.cardio.value);
  if (!Number.isFinite(curSec) || curSec <= 0) {
    lapDisplay.innerHTML = '';
    if (section) section.hidden = true;
    return;
  }
  if (section) section.hidden = false;
  lapDisplay.innerHTML = formatPacePlan(curSec, 8, Math.round(curSec / 8));
}

// --- Tick positioning ---

// Places tick center to match browser thumb center at given percentage of slider range.
// Accounts for the 10px thumb radius offset browsers apply at both ends.
function setTickPct(tickId, pct, minValue) {
  const tick = byId(tickId);
  if (!tick) return;
  if (!Number.isFinite(pct)) { tick.style.display = 'none'; return; }
  const clamped = Math.max(0, Math.min(100, pct));
  tick.style.display = 'block';
  const halfThumb = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--slider-thumb-half')) || 11;
  tick.style.left = `calc(${halfThumb}px + ${(clamped / 100).toFixed(4)} * (100% - ${halfThumb * 2}px))`;
  if (minValue !== undefined) tick.dataset.minValue = String(minValue);
}

// --- Rendering ---

function renderScore(result) {
  const { total, category, scores } = result;

  const scoreTxt = byId('score-txt');
  if (scoreTxt) scoreTxt.textContent = Number.isInteger(total) ? String(total) : total.toFixed(1);

  const badge = byId('score-category-badge');
  if (badge) {
    const short = category === 'Excellent' ? 'EXC' : category === 'Satisfactory' ? 'SAT' : 'UNSAT';
    badge.textContent = short;
    badge.dataset.category = category.toLowerCase();
  }

  const barFill = byId('score-bar-fill');
  if (barFill) barFill.style.width = `${Math.max(0, 100 - Math.min(100, total))}%`;

  // SVG ring (fitness + blues themes)
  const ringArc = byId('score-ring-arc');
  if (ringArc) {
    const C = 2 * Math.PI * 70; // circumference for r=70
    const filled = (Math.min(100, Math.max(0, total)) / 100) * C;
    ringArc.setAttribute('stroke-dasharray', `${filled.toFixed(1)} ${C.toFixed(1)}`);
  }
  const ringNum = byId('score-ring-num');
  if (ringNum) {
    const numTxt = Number.isInteger(total) ? String(total) : total.toFixed(1);
    ringNum.textContent = numTxt;
    ringNum.setAttribute('data-len', numTxt.length);
  }
  const ringCat = byId('score-ring-cat');
  if (ringCat) {
    ringCat.textContent = category === 'Excellent' ? 'EXCELLENT' : category === 'Satisfactory' ? 'SAT' : 'FAIL';
  }

  // Fitness: avatar sex letter
  const fitAvatar = byId('fit-avatar');
  if (fitAvatar) fitAvatar.textContent = state.sex === 'male' ? 'M' : 'F';

  // Fitness: score deltas (above pass=75, to max=100)
  const passEl = byId('score-delta-pass');
  const maxEl = byId('score-delta-max');
  if (passEl) passEl.textContent = `+${Math.max(0, total - 75).toFixed(0)} above pass`;
  if (maxEl) maxEl.textContent = `+${Math.max(0, 100 - total).toFixed(0)} to max`;

  // Fitness: body comp pass/fail badge (WHtR ≤ 0.55 = PASS)
  const fitBodyBadge = byId('fit-body-badge');
  if (fitBodyBadge) {
    const whtrNum = parseFloat(state.whtr);
    const pass = !Number.isNaN(whtrNum) && whtrNum <= 0.55;
    fitBodyBadge.textContent = pass ? 'PASS' : 'FAIL';
    fitBodyBadge.dataset.pass = String(pass);
  }

  // Stencil threshold marker
  const stencilMarker = byId('score-stencil-marker');
  if (stencilMarker) stencilMarker.style.left = `${Math.min(100, Math.max(0, total))}%`;

  const bodyScore = byId('pfra-body-score');
  if (bodyScore) bodyScore.textContent = String(scores.body);

  const strScoreEl = byId('pfra-strength-score');
  if (strScoreEl) strScoreEl.textContent = state.strength.exempt ? 'EXEMPT' : String(scores.strength);

  const coreScoreEl = byId('pfra-core-score');
  if (coreScoreEl) coreScoreEl.textContent = state.core.exempt ? 'EXEMPT' : String(scores.core);

  const cardioScoreEl = byId('pfra-cardio-score');
  if (cardioScoreEl) cardioScoreEl.textContent = state.cardio.exempt ? 'EXEMPT' : String(scores.cardio);
}

function renderChipValues() {
  const chipBody = byId('chip-body-value');
  if (chipBody) chipBody.textContent = state.whtr || '--';

  const chipStr = byId('chip-strength-value');
  if (chipStr) chipStr.textContent = state.strength.exempt ? 'EX' : (state.strength.value || '--');

  const chipCore = byId('chip-core-value');
  if (chipCore) chipCore.textContent = state.core.exempt ? 'EX' : (state.core.value || '--');

  const chipCardio = byId('chip-cardio-value');
  if (chipCardio) chipCardio.textContent = state.cardio.exempt ? 'EX' : (state.cardio.value || '--');
}

function renderBodyEditor(scores) {
  const bodyTxtP = byId('body-txt-p');
  const whtrControls = byId('body-whtr-controls');

  if (state.bodyExempt) {
    if (whtrControls) whtrControls.hidden = true;
    if (bodyTxtP) bodyTxtP.textContent = 'WHtR Score: EXEMPT';
    return;
  }

  if (whtrControls) whtrControls.hidden = false;
  if (bodyTxtP) bodyTxtP.textContent = `WHtR Score: ${scores.body} | Pass ≤ 0.55`;

  syncWhtrMeasurementInputs();

const whtrInput = byId('pfra-whtr');
if (whtrInput) whtrInput.value = state.whtr;

// Only reset slider range/value if currently in ratio focus mode
if (_whtrFocus === 'ratio') {
  const whtrNum = parseFloat(state.whtr);
  const slider = byId('whtr-slider');
  if (slider && Number.isFinite(whtrNum)) {
    slider.min = '35'; slider.max = '70';
    slider.value = String(Math.round(whtrNum * 100));
  }
}
}

function renderStrengthEditor(scores) {
  const pushTxtP = byId('push-txt-p');

  if (state.strength.exempt) {
    if (pushTxtP) pushTxtP.textContent = 'Strength Score: EXEMPT';
    const tick = byId('push-tick');
    if (tick) tick.style.display = 'none';
    return;
  }

  const table = tables[state.strength.event];
  if (!table) return;

  const minVal = firstScoringCellValue(table, state.ageGroup, state.sex);
  const maxVal = topCellValue(table, state.ageGroup, state.sex);
  const minNum = Number(minVal);
  const maxNum = Number(maxVal);

  if (pushTxtP) {
    pushTxtP.textContent = `Strength Score: ${scores.strength} | Min: ${minVal ?? '--'} | Max: ${maxVal ?? '--'}`;
  }

  const slider = byId('push-slider');
  if (slider && Number.isFinite(minNum) && Number.isFinite(maxNum) && maxNum > 0) {
    slider.min = '0';
    slider.max = String(maxNum);
    const curVal = Number(state.strength.value);
    if (Number.isFinite(curVal)) slider.value = String(Math.max(0, Math.min(maxNum, curVal)));
    setTickPct('push-tick', (minNum / maxNum) * 100, minNum);
  } else {
    const tick = byId('push-tick');
    if (tick) tick.style.display = 'none';
  }
}

function renderCoreEditor(scores) {
  const sitTxtP = byId('sit-txt-p');

  if (state.core.exempt) {
    if (sitTxtP) sitTxtP.textContent = 'Core Score: EXEMPT';
    const tick = byId('sit-tick');
    if (tick) tick.style.display = 'none';
    return;
  }

  const table = tables[state.core.event];
  if (!table) return;

  const minVal = firstScoringCellValue(table, state.ageGroup, state.sex);
  const maxVal = topCellValue(table, state.ageGroup, state.sex);

  if (state.core.event === 'forearm-plank') {
    const minSec = toSeconds(String(minVal));
    const maxSec = toSeconds(String(maxVal));

    if (sitTxtP) {
      sitTxtP.textContent = `Core Score: ${scores.core} | Min: ${minVal ?? '--'} | Max: ${maxVal ?? '--'}`;
    }

    const slider = byId('sit-slider');
    if (slider && Number.isFinite(minSec) && Number.isFinite(maxSec) && maxSec > 0) {
      slider.min = '0';
      slider.max = String(maxSec);
      const curSec = toSeconds(state.core.value);
      if (Number.isFinite(curSec)) slider.value = String(Math.max(0, Math.min(maxSec, curSec)));
      setTickPct('sit-tick', (minSec / maxSec) * 100, minSec);
    } else {
      const tick = byId('sit-tick');
      if (tick) tick.style.display = 'none';
    }
  } else {
    const minNum = Number(minVal);
    const maxNum = Number(maxVal);

    if (sitTxtP) {
      sitTxtP.textContent = `Core Score: ${scores.core} | Min: ${minVal ?? '--'} | Max: ${maxVal ?? '--'}`;
    }

    const slider = byId('sit-slider');
    if (slider && Number.isFinite(minNum) && Number.isFinite(maxNum) && maxNum > 0) {
      slider.min = '0';
      slider.max = String(maxNum);
      const curVal = Number(state.core.value);
      if (Number.isFinite(curVal)) slider.value = String(Math.max(0, Math.min(maxNum, curVal)));
      setTickPct('sit-tick', (minNum / maxNum) * 100, minNum);
    } else {
      const tick = byId('sit-tick');
      if (tick) tick.style.display = 'none';
    }
  }
}

function hamrLevelText(totalShuttles) {
  const n = Number(totalShuttles);
  if (!Number.isFinite(n) || n < 1) return '';
  const rounded = Math.round(n);
  const range = HAMR_LEVEL_RANGES.find(({ start, end }) => rounded >= start && rounded <= end)
    || HAMR_LEVEL_RANGES[HAMR_LEVEL_RANGES.length - 1];
  const level = range.level;
  const shuttle = Math.max(1, Math.min(range.end - range.start + 1, rounded - range.start + 1));
  return `Level: ${level} | Shuttle: ${shuttle}`;
}

function renderCardioEditor(scores) {
  const runTxtP = byId('run-txt-p');

  if (state.cardio.exempt) {
    if (runTxtP) runTxtP.textContent = 'Cardio Score: EXEMPT';
    const tick = byId('run-tick');
    if (tick) tick.style.display = 'none';
    return;
  }

  if (state.cardio.event === 'two-kilometer-walk') {
    const maxTime = walkMaximumTime(standards, state.ageGroup, state.sex);
    if (runTxtP) runTxtP.textContent = `Cardio Score: ${scores.cardio} | Max Time: ${maxTime ?? '--'}`;
    const tick = byId('run-tick');
    if (tick) tick.style.display = 'none';
    if (maxTime) {
      const maxSec = toSeconds(maxTime);
      const slider = byId('run-slider');
      if (slider && Number.isFinite(maxSec)) {
        slider.min = '0';
        slider.max = String(maxSec + 120);
        const curSec = toSeconds(state.cardio.value);
        if (Number.isFinite(curSec)) slider.value = String(curSec);
      }
    }
    return;
  }

  const hamrLevelEl = byId('hamr-level-display');
  if (state.cardio.event === 'hamr-20-meter') {
    const table = tables['hamr-20-meter'];
    if (!table) return;
    const minVal = firstScoringCellValue(table, state.ageGroup, state.sex);
    const maxVal = topCellValue(table, state.ageGroup, state.sex);
    const minNum = Number(minVal);
    const maxNum = Number(maxVal);

    if (runTxtP) {
      runTxtP.textContent = `Cardio Score: ${scores.cardio} | Min: ${minVal ?? '--'} | Max: ${maxVal ?? '--'}`;
    }

    if (hamrLevelEl) {
      const lvlText = hamrLevelText(state.cardio.value);
      hamrLevelEl.textContent = lvlText;
      hamrLevelEl.hidden = !lvlText;
    }

    const slider = byId('run-slider');
    if (slider && Number.isFinite(minNum) && Number.isFinite(maxNum) && maxNum > 0) {
      slider.min = '0';
      slider.max = String(maxNum);
      const curVal = Number(state.cardio.value);
      if (Number.isFinite(curVal)) slider.value = String(Math.max(0, Math.min(maxNum, curVal)));
    }
    return;
  }

  if (hamrLevelEl) hamrLevelEl.hidden = true;

  // two-mile-run
  const table = tables['two-mile-run'];
  if (!table) return;
  const minVal = firstScoringCellValue(table, state.ageGroup, state.sex); // slowest scoring time
  const maxVal = topCellValue(table, state.ageGroup, state.sex);          // fastest scoring time
  const minSec = toSeconds(String(minVal)); // largest seconds = right side of slider
  const maxSec = toSeconds(String(maxVal)); // smallest seconds = left side of slider

  if (runTxtP) {
    runTxtP.textContent = `Cardio Score: ${scores.cardio} | Min: ${minVal ?? '--'} | Max: ${maxVal ?? '--'}`;
  }

  if (Number.isFinite(minSec) && Number.isFinite(maxSec)) {
    const slider = byId('run-slider');
    if (slider) {
      slider.min = String(maxSec);
      slider.max = String(minSec);
      const curSec = toSeconds(state.cardio.value);
      if (Number.isFinite(curSec)) {
        slider.value = String(Math.min(minSec, Math.max(maxSec, curSec)));
      }
    }

    setTickPct('run-tick', 100, minSec);
  }
}

function syncFitSeg(ctrlId, currentEvent, isExempt) {
  const ctrl = byId(ctrlId);
  if (!ctrl) return;
  ctrl.querySelectorAll('.fit-seg-btn').forEach((btn) => {
    const active = isExempt ? btn.dataset.segValue === 'exempt' : btn.dataset.segValue === currentEvent;
    btn.classList.toggle('fit-seg-btn--active', active);
  });
}

function renderEditorVisibility() {
  const isPlank = state.core.event === 'forearm-plank';
  const sitRepsRow = byId('sit-reps-row');
  const sitPlankRow = byId('sit-plank-row');
  if (sitRepsRow) sitRepsRow.hidden = isPlank;
  if (sitPlankRow) sitPlankRow.hidden = !isPlank;

  const isHamr = state.cardio.event === 'hamr-20-meter';
  const runTimeRow = byId('run-time-row');
  const runShuttleRow = byId('run-shuttle-row');
  if (runTimeRow) runTimeRow.hidden = isHamr;
  if (runShuttleRow) runShuttleRow.hidden = !isHamr;

  const editors = ['body', 'strength', 'core', 'cardio'];
  editors.forEach((name) => {
    const panel = byId(`${name}-editor`);
    if (panel) panel.hidden = name !== state.selectedComponent;
  });

  // Drive run slider direction: time events flip slider via CSS
  const cardioEditor = byId('cardio-editor');
  if (cardioEditor) {
    const isTimeEvent = state.cardio.event === 'two-mile-run' || state.cardio.event === 'two-kilometer-walk';
    cardioEditor.dataset.eventKind = isTimeEvent ? 'time' : 'count';
  }

  document.querySelectorAll('.component-chip').forEach((chip) => {
    const active = chip.dataset.component === state.selectedComponent;
    chip.classList.toggle('chip--active', active);
    chip.setAttribute('aria-selected', String(active));
  });

  // Fitness: sync segmented control active state to current event selection
  syncFitSeg('body-seg-ctrl', 'whtr', state.bodyExempt);
  syncFitSeg('push-seg-ctrl', state.strength.event, state.strength.exempt);
  syncFitSeg('sit-seg-ctrl', state.core.event, state.core.exempt);
  syncFitSeg('run-seg-ctrl', state.cardio.event, state.cardio.exempt);
}

function render() {
  if (!ready) return;

  const result = computeScoreFromState(state);
  if (!result) return;

  renderScore(result);
  renderChipValues();
  renderBodyEditor(result.scores);
  renderStrengthEditor(result.scores);
  renderCoreEditor(result.scores);
  renderCardioEditor(result.scores);
  renderEditorVisibility();
  renderPacePlan();
}

// --- Component selection ---

function selectComponent(component) {
  dispatch({ type: 'SET_SELECTED_COMPONENT', component });
  render();
}

// --- Event binding helpers ---

function bindMenuClick(id, handler) {
  const el = byId(id);
  if (!el) return;
  el.addEventListener('click', handler);
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); }
  });
}

function calculateWhtrFromMeasurements(heightFt, heightIn, waistIn) {
  const ft = Number(heightFt);
  const inches = Number(heightIn);
  const waist = Number(waistIn);

  if (!Number.isFinite(ft) || !Number.isFinite(inches) || !Number.isFinite(waist)) return null;

  const totalHeight = (ft * 12) + inches;
  if (totalHeight <= 0 || waist <= 0) return null;

  return (waist / totalHeight).toFixed(2);
}

function syncWhtrMeasurementInputs() {
  const ftEl = byId('height-ft-input');
  const inEl = byId('height-in-input');
  const waistEl = byId('waist-input');

  if (ftEl) ftEl.value = state.bodyHeightFt;
  if (inEl) inEl.value = state.bodyHeightIn;
  if (waistEl) waistEl.value = state.bodyWaist;
}

function _onWhtrFocus(field) {
  _whtrFocus = field;
  const slider = byId('whtr-slider');
  if (!slider) return;
  if (field === 'ratio') {
    slider.min = '35'; slider.max = '70';
    const v = parseFloat(val('pfra-whtr'));
    if (Number.isFinite(v)) slider.value = String(Math.round(v * 100));
  } else if (field === 'ft') {
    slider.min = '3'; slider.max = '8';
    const v = Number(val('height-ft-input') || 0);
    slider.value = String(Math.max(3, Math.min(8, v)));
  } else if (field === 'in') {
    slider.min = '0'; slider.max = '11';
    const v = Number(val('height-in-input') || 0);
    slider.value = String(Math.max(0, Math.min(11, v)));
  } else if (field === 'waist') {
    slider.min = '200'; slider.max = '800';
    const v = Number(val('waist-input') || 0);
    slider.value = String(Math.round(Math.max(20, Math.min(80, v)) * 10));
  }
}

function updateWhtrFromMeasurements() {
  const ft = val('height-ft-input') || state.bodyHeightFt;
  const inches = val('height-in-input') || state.bodyHeightIn;
  const waist = val('waist-input') || state.bodyWaist;

  dispatch({ type: 'SET_BODY_HEIGHT_FT', value: ft });
  dispatch({ type: 'SET_BODY_HEIGHT_IN', value: inches });
  dispatch({ type: 'SET_BODY_WAIST', value: waist });

  const ratio = calculateWhtrFromMeasurements(ft, inches, waist);
  if (ratio === null) {
    render();
    return;
  }

  dispatch({ type: 'SET_WHTR', value: ratio });

  const whtrInput = byId('pfra-whtr');
  if (whtrInput) whtrInput.value = ratio;

  // Sync slider to the currently active field, not always to ratio units
  const slider = byId('whtr-slider');
  if (slider) {
    if (_whtrFocus === 'ratio') {
      slider.value = String(Math.round(Number(ratio) * 100));
    } else if (_whtrFocus === 'ft') {
      const v = Number(val('height-ft-input') || 0);
      slider.value = String(Math.max(3, Math.min(8, v)));
    } else if (_whtrFocus === 'in') {
      const v = Number(val('height-in-input') || 0);
      slider.value = String(Math.max(0, Math.min(11, v)));
    } else if (_whtrFocus === 'waist') {
      const v = Number(val('waist-input') || 0);
      slider.value = String(Math.round(Math.max(20, Math.min(80, v)) * 10));
    }
  }

  render();
}

// --- Event bindings ---

function bindEvents() {
  // Demographics
  byId('sex-sel')?.addEventListener('change', () => {
    dispatch({ type: 'SET_SEX', sex: byId('sex-sel').value });
    clearSavedEventValues();
    resetCurrentEventDefaults();
    render();
  });

  byId('age-sel')?.addEventListener('change', () => {
    dispatch({ type: 'SET_AGE_GROUP', ageGroup: byId('age-sel').value });
    clearSavedEventValues();
    resetCurrentEventDefaults();
    render();
  });

  byId('body-mode-sel')?.addEventListener('change', () => {
    dispatch({ type: 'SET_BODY_EXEMPT', exempt: byId('body-mode-sel').value === 'exempt' });
    render();
  });

  byId('pfra-whtr')?.addEventListener('input', () => {
    const v = val('pfra-whtr');
    dispatch({ type: 'SET_WHTR', value: v });
    const slider = byId('whtr-slider');
    if (slider) {
      const num = parseFloat(v);
      if (Number.isFinite(num)) slider.value = String(Math.round(num * 100));
    }
    render();
  });

  // --- Numeric input clear/blur defaults ---
  // Allow empty while typing; on blur default to 0

  function attachNumericBlurDefault(id, defaultVal) {
    const el = byId(id);
    if (!el) return;
    el.addEventListener('blur', () => {
      if (el.value === '' || el.value === '-') {
        el.value = defaultVal ?? '0';
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
  }

  attachNumericBlurDefault('height-ft-input', '5');
  attachNumericBlurDefault('height-in-input', '0');
  attachNumericBlurDefault('waist-input', '0');
  attachNumericBlurDefault('push-txt', '0');
  attachNumericBlurDefault('sit-txt', '0');
  attachNumericBlurDefault('run-shuttle-txt', '0');
  attachNumericBlurDefault('run-mintxt', '0');
  attachNumericBlurDefault('run-sectxt', '00');
  attachNumericBlurDefault('sit-txt-plank', '0');
  attachNumericBlurDefault('plankmintxt', '00');
  attachNumericBlurDefault('pfra-whtr', '0.49');

  byId('height-ft-input')?.addEventListener('input', () => {
    const ftEl = byId('height-ft-input');
    if (ftEl && ftEl.value !== '') updateWhtrFromMeasurements();
  });

  // Height inches: rollover at 11/0 boundary
  byId('height-in-input')?.addEventListener('input', () => {
    const inEl = byId('height-in-input');
    const ftEl = byId('height-ft-input');
    if (!inEl || inEl.value === '') return;
    const inVal = Number(inEl.value);
    const ftVal = Number(ftEl?.value || state.bodyHeightFt || 5);
    if (inVal > 11) {
      inEl.value = '0';
      if (ftEl) { ftEl.value = String(ftVal + 1); }
    } else if (inVal < 0) {
      inEl.value = '11';
      if (ftEl) { ftEl.value = String(Math.max(3, ftVal - 1)); }
    }
    updateWhtrFromMeasurements();
  });

  byId('waist-input')?.addEventListener('input', () => {
    const el = byId('waist-input');
    if (el && el.value !== '') updateWhtrFromMeasurements();
  });

  let _stepTimer = null;
  let _stepInterval = null;

  function _doStepBtn(btn) {
    if (btn.classList.contains('body-step-btn')) {
      const input = byId(btn.dataset.target);
      if (!input) return;
      const step = Number(btn.dataset.bodyStep || input.step || 1);
      const current = Number(input.value || 0);
      const min = input.min === '' ? -Infinity : Number(input.min);
      const max = input.max === '' ? Infinity : Number(input.max);
      if (!Number.isFinite(step) || !Number.isFinite(current)) return;
      const decimals = String(step).includes('.') ? String(step).split('.')[1].length : 0;
      const next = Math.min(max, Math.max(min, current + step));
      input.value = decimals > 0 ? next.toFixed(decimals) : String(Math.round(next));
      input.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      const sliderId = btn.dataset.target;
      let dir = Number(btn.dataset.step);
      if (!sliderId || !Number.isFinite(dir)) return;
      const slider = byId(sliderId);
      if (!slider) return;
      if (slider.closest('[data-event-kind="time"]')) dir = -dir;
      const cur = Number(slider.value);
      const lo = Number(slider.min);
      const hi = Number(slider.max);
      const next = Math.min(hi, Math.max(lo, cur + dir));
      if (next === cur) return;
      slider.value = String(next);
      slider.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  function _stopStep() {
    clearTimeout(_stepTimer);
    clearInterval(_stepInterval);
    _stepTimer = null;
    _stepInterval = null;
  }

  document.addEventListener('pointerdown', (e) => {
    const btn = e.target.closest('.body-step-btn, .slider-step-btn');
    if (!btn) return;
    _doStepBtn(btn);
    _stepTimer = setTimeout(() => {
      _stepInterval = setInterval(() => _doStepBtn(btn), 80);
    }, 400);
  });

  document.addEventListener('pointerup', _stopStep);
  document.addEventListener('pointercancel', _stopStep);

  // --- WHtR slider: targets last-focused measurement input (sticky until next focus) ---

  byId('pfra-whtr')?.addEventListener('focus', () => _onWhtrFocus('ratio'));
  byId('height-ft-input')?.addEventListener('focus', () => _onWhtrFocus('ft'));
  byId('height-in-input')?.addEventListener('focus', () => _onWhtrFocus('in'));
  byId('waist-input')?.addEventListener('focus', () => _onWhtrFocus('waist'));

  byId('whtr-slider')?.addEventListener('input', () => {
    const slider = byId('whtr-slider');
    if (!slider) return;
    const raw = Number(slider.value);
    if (_whtrFocus === 'ratio' || _whtrFocus === undefined) {
      const whtrStr = (raw / 100).toFixed(2);
      dispatch({ type: 'SET_WHTR', value: whtrStr });
      const txt = byId('pfra-whtr');
      if (txt) txt.value = whtrStr;
    } else if (_whtrFocus === 'ft') {
      const ftEl = byId('height-ft-input');
      if (ftEl) { ftEl.value = String(raw); ftEl.dispatchEvent(new Event('input', { bubbles: true })); }
    } else if (_whtrFocus === 'in') {
      const inEl = byId('height-in-input');
      if (inEl) { inEl.value = String(raw); inEl.dispatchEvent(new Event('input', { bubbles: true })); }
    } else if (_whtrFocus === 'waist') {
      const waistEl = byId('waist-input');
      if (waistEl) { waistEl.value = (raw / 10).toFixed(1); waistEl.dispatchEvent(new Event('input', { bubbles: true })); }
    }
    if (_whtrFocus === 'ratio' || _whtrFocus === undefined) render();
  });

  byId('alt-select')?.addEventListener('change', () => {
    dispatch({ type: 'SET_ALTITUDE_GROUP', group: readAltitudeGroup(val('alt-select')) });
    render();
  });

  // --- Strength ---

  byId('push-sel')?.addEventListener('change', () => {
    const sv = byId('push-sel').value;
    if (sv === 'exempt') {
      if (!state.strength.exempt) savedEventValues.strength[state.strength.event] = state.strength.value;
      dispatch({ type: 'SET_STRENGTH_EXEMPT', exempt: true });
    } else {
      if (!state.strength.exempt) savedEventValues.strength[state.strength.event] = state.strength.value;
      dispatch({ type: 'SET_STRENGTH_EXEMPT', exempt: false });
      dispatch({ type: 'SET_STRENGTH_EVENT', event: sv });
      const saved = savedEventValues.strength[sv];
      const def = saved !== undefined
        ? saved
        : lowestScoringDefault(sv, state.ageGroup, state.sex);
      savedEventValues.strength[sv] = def;
      const pushTxt = byId('push-txt');
      if (pushTxt) pushTxt.value = def;
      dispatch({ type: 'SET_STRENGTH_VALUE', value: def });
    }
    render();
  });

  byId('push-txt')?.addEventListener('input', () => {
    const v = val('push-txt');
    dispatch({ type: 'SET_STRENGTH_VALUE', value: v });
    if (!state.strength.exempt) savedEventValues.strength[state.strength.event] = v;
    const slider = byId('push-slider');
    if (slider) slider.value = v;
    render();
  });

  byId('push-slider')?.addEventListener('input', () => {
    const v = val('push-slider');
    dispatch({ type: 'SET_STRENGTH_VALUE', value: v });
    if (!state.strength.exempt) savedEventValues.strength[state.strength.event] = v;
    const txt = byId('push-txt');
    if (txt) txt.value = v;
    render();
  });

  // --- Strength MIN/MAX buttons ---

  byId('push-min-btn')?.addEventListener('click', () => {
    const table = tables[state.strength.event];
    if (!table) return;
    const minVal = String(firstScoringCellValue(table, state.ageGroup, state.sex) ?? '0');
    dispatch({ type: 'SET_STRENGTH_VALUE', value: minVal });
    if (!state.strength.exempt) savedEventValues.strength[state.strength.event] = minVal;
    const txt = byId('push-txt'); if (txt) txt.value = minVal;
    const slider = byId('push-slider'); if (slider) slider.value = minVal;
    render();
  });

  byId('push-max-btn')?.addEventListener('click', () => {
    const table = tables[state.strength.event];
    if (!table) return;
    const maxVal = String(topCellValue(table, state.ageGroup, state.sex) ?? '0');
    dispatch({ type: 'SET_STRENGTH_VALUE', value: maxVal });
    if (!state.strength.exempt) savedEventValues.strength[state.strength.event] = maxVal;
    const txt = byId('push-txt'); if (txt) txt.value = maxVal;
    const slider = byId('push-slider'); if (slider) slider.value = maxVal;
    render();
  });

  // --- Core ---

  byId('sit-sel')?.addEventListener('change', () => {
    const sv = byId('sit-sel').value;
    if (sv === 'exempt') {
      if (!state.core.exempt) savedEventValues.core[state.core.event] = state.core.value;
      dispatch({ type: 'SET_CORE_EXEMPT', exempt: true });
    } else {
      if (!state.core.exempt) savedEventValues.core[state.core.event] = state.core.value;
      dispatch({ type: 'SET_CORE_EXEMPT', exempt: false });
      dispatch({ type: 'SET_CORE_EVENT', event: sv });
      const saved = savedEventValues.core[sv];
      const def = saved !== undefined
        ? saved
        : lowestScoringDefault(sv, state.ageGroup, state.sex);
      savedEventValues.core[sv] = def;
      dispatch({ type: 'SET_CORE_VALUE', value: def });
      if (sv === 'forearm-plank') {
        const parts = def.split(':');
        const minEl = byId('sit-txt-plank');
        const secEl = byId('plankmintxt');
        if (minEl) minEl.value = parts[0] || '3';
        if (secEl) secEl.value = parts[1] || '40';
      } else {
        const txt = byId('sit-txt');
        if (txt) txt.value = def;
      }
    }
    render();
  });

  byId('sit-txt')?.addEventListener('input', () => {
    const v = val('sit-txt');
    dispatch({ type: 'SET_CORE_VALUE', value: v });
    if (!state.core.exempt) savedEventValues.core[state.core.event] = v;
    const slider = byId('sit-slider');
    if (slider) slider.value = v;
    render();
  });

  byId('sit-slider')?.addEventListener('input', () => {
    const v = val('sit-slider');
    if (state.core.event === 'forearm-plank') {
      const timeStr = secondsToTimeString(Number(v));
      dispatch({ type: 'SET_CORE_VALUE', value: timeStr });
      if (!state.core.exempt) savedEventValues.core[state.core.event] = timeStr;
      const parts = timeStr.split(':');
      const minEl = byId('sit-txt-plank');
      const secEl = byId('plankmintxt');
      if (minEl) minEl.value = parts[0];
      if (secEl) secEl.value = parts[1];
    } else {
      dispatch({ type: 'SET_CORE_VALUE', value: v });
      if (!state.core.exempt) savedEventValues.core[state.core.event] = v;
      const txt = byId('sit-txt');
      if (txt) txt.value = v;
    }
    render();
  });

  const updatePlankTime = (rolloverSrc) => {
    const minEl = byId('sit-txt-plank');
    const secEl = byId('plankmintxt');
    if (!minEl || !secEl) return;
    if (minEl.value === '' || secEl.value === '') return;
    let m = Number(minEl.value);
    let s = Number(secEl.value);
    if (rolloverSrc === 'sec') {
      if (s >= 60) { m += Math.floor(s / 60); s = s % 60; }
      else if (s < 0) { m = Math.max(0, m - 1); s = 59; }
      minEl.value = String(m);
      secEl.value = String(s).padStart(2, '0');
    }
    const timeStr = `${m}:${String(s).padStart(2, '0')}`;
    dispatch({ type: 'SET_CORE_VALUE', value: timeStr });
    if (!state.core.exempt) savedEventValues.core[state.core.event] = timeStr;
    const slider = byId('sit-slider');
    const sec2 = toSeconds(timeStr);
    if (slider && Number.isFinite(sec2)) slider.value = String(sec2);
    render();
  };

  byId('sit-txt-plank')?.addEventListener('input', () => updatePlankTime('min'));
  byId('plankmintxt')?.addEventListener('input', () => updatePlankTime('sec'));

  // --- Core MIN/MAX buttons (reps) ---

  byId('sit-min-btn')?.addEventListener('click', () => {
    const table = tables[state.core.event];
    if (!table) return;
    const minVal = String(firstScoringCellValue(table, state.ageGroup, state.sex) ?? '0');
    dispatch({ type: 'SET_CORE_VALUE', value: minVal });
    if (!state.core.exempt) savedEventValues.core[state.core.event] = minVal;
    const txt = byId('sit-txt'); if (txt) txt.value = minVal;
    const slider = byId('sit-slider'); if (slider) slider.value = minVal;
    render();
  });

  byId('sit-max-btn')?.addEventListener('click', () => {
    const table = tables[state.core.event];
    if (!table) return;
    const maxVal = String(topCellValue(table, state.ageGroup, state.sex) ?? '0');
    dispatch({ type: 'SET_CORE_VALUE', value: maxVal });
    if (!state.core.exempt) savedEventValues.core[state.core.event] = maxVal;
    const txt = byId('sit-txt'); if (txt) txt.value = maxVal;
    const slider = byId('sit-slider'); if (slider) slider.value = maxVal;
    render();
  });

  // --- Core MIN/MAX buttons (plank time) ---

  function _setPlankValue(valStr) {
    dispatch({ type: 'SET_CORE_VALUE', value: valStr });
    if (!state.core.exempt) savedEventValues.core[state.core.event] = valStr;
    const parts = valStr.split(':');
    const minEl = byId('sit-txt-plank'); if (minEl) minEl.value = parts[0] || '0';
    const secEl = byId('plankmintxt'); if (secEl) secEl.value = parts[1] || '00';
    const sec = toSeconds(valStr);
    const slider = byId('sit-slider'); if (slider && Number.isFinite(sec)) slider.value = String(sec);
    render();
  }

  byId('sit-plank-min-btn')?.addEventListener('click', () => {
    const table = tables['forearm-plank'];
    if (!table) return;
    const rawMin = firstScoringCellValue(table, state.ageGroup, state.sex);
    if (rawMin !== undefined) _setPlankValue(String(rawMin));
  });

  byId('sit-plank-max-btn')?.addEventListener('click', () => {
    const table = tables['forearm-plank'];
    if (!table) return;
    const rawMax = topCellValue(table, state.ageGroup, state.sex);
    if (rawMax !== undefined) _setPlankValue(String(rawMax));
  });

  // --- Cardio ---

  byId('cardio-sel')?.addEventListener('change', () => {
    const sv = byId('cardio-sel').value;
    if (sv === 'exempt') {
      if (!state.cardio.exempt) savedEventValues.cardio[state.cardio.event] = state.cardio.value;
      dispatch({ type: 'SET_CARDIO_EXEMPT', exempt: true });
    } else {
      if (!state.cardio.exempt) savedEventValues.cardio[state.cardio.event] = state.cardio.value;
      dispatch({ type: 'SET_CARDIO_EXEMPT', exempt: false });
      dispatch({ type: 'SET_CARDIO_EVENT', event: sv });
      const saved = savedEventValues.cardio[sv];
      const def = saved !== undefined ? saved : lowestCardioDefault(sv, state.ageGroup, state.sex);
      savedEventValues.cardio[sv] = def;
      dispatch({ type: 'SET_CARDIO_VALUE', value: def });
      if (sv === 'hamr-20-meter') {
        const shuttleTxt = byId('run-shuttle-txt');
        if (shuttleTxt) shuttleTxt.value = def;
      } else if (sv !== 'two-kilometer-walk') {
        const parts = def.split(':');
        const minEl = byId('run-mintxt');
        const secEl = byId('run-sectxt');
        if (minEl) minEl.value = parts[0] || '0';
        if (secEl) secEl.value = (parts[1] || '00').padStart(2, '0');
      }
    }
    render();
  });

  const updateRunTime = (rolloverSrc) => {
    const minEl = byId('run-mintxt');
    const secEl = byId('run-sectxt');
    if (!minEl || !secEl) return;
    // Allow empty while typing
    if (minEl.value === '' || secEl.value === '') return;
    let m = Number(minEl.value);
    let s = Number(secEl.value);
    // SS rollover
    if (rolloverSrc === 'sec') {
      if (s >= 60) { m += Math.floor(s / 60); s = s % 60; }
      else if (s < 0) { m = Math.max(0, m - 1); s = 59; }
      minEl.value = String(m);
      secEl.value = String(s).padStart(2, '0');
    }
    const timeStr = `${m}:${String(s).padStart(2, '0')}`;
    dispatch({ type: 'SET_CARDIO_VALUE', value: timeStr });
    if (!state.cardio.exempt) savedEventValues.cardio[state.cardio.event] = timeStr;
    const slider = byId('run-slider');
    const sec2 = toSeconds(timeStr);
    if (slider && Number.isFinite(sec2)) slider.value = String(sec2);
    render();
  };

  byId('run-mintxt')?.addEventListener('input', () => updateRunTime('min'));
  byId('run-sectxt')?.addEventListener('input', () => updateRunTime('sec'));

  byId('run-shuttle-txt')?.addEventListener('input', () => {
    const v = val('run-shuttle-txt');
    dispatch({ type: 'SET_CARDIO_VALUE', value: v });
    if (!state.cardio.exempt) savedEventValues.cardio[state.cardio.event] = v;
    const slider = byId('run-slider');
    if (slider) slider.value = v;
    render();
  });

  byId('run-slider')?.addEventListener('input', () => {
    const v = val('run-slider');
    if (state.cardio.event === 'hamr-20-meter') {
      dispatch({ type: 'SET_CARDIO_VALUE', value: v });
      if (!state.cardio.exempt) savedEventValues.cardio[state.cardio.event] = v;
      const txt = byId('run-shuttle-txt');
      if (txt) txt.value = v;
    } else {
      const timeStr = secondsToTimeString(Number(v));
      dispatch({ type: 'SET_CARDIO_VALUE', value: timeStr });
      if (!state.cardio.exempt) savedEventValues.cardio[state.cardio.event] = timeStr;
      const parts = timeStr.split(':');
      const minEl = byId('run-mintxt');
      const secEl = byId('run-sectxt');
      if (minEl) minEl.value = parts[0];
      if (secEl) secEl.value = parts[1];
    }
    render();
  });

  // --- Cardio MIN/MAX buttons (run time) ---

  function _setRunTimeValue(valStr) {
    dispatch({ type: 'SET_CARDIO_VALUE', value: valStr });
    if (!state.cardio.exempt) savedEventValues.cardio[state.cardio.event] = valStr;
    const parts = valStr.split(':');
    const minEl = byId('run-mintxt'); if (minEl) minEl.value = parts[0] || '0';
    const secEl = byId('run-sectxt'); if (secEl) secEl.value = parts[1] || '00';
    const sec = toSeconds(valStr);
    const slider = byId('run-slider'); if (slider && Number.isFinite(sec)) slider.value = String(sec);
    render();
  }

  byId('run-min-btn')?.addEventListener('click', () => {
    if (state.cardio.event === 'two-kilometer-walk') {
      const maxTime = walkMaximumTime(standards, state.ageGroup, state.sex);
      if (maxTime) _setRunTimeValue(maxTime);
      return;
    }
    const table = tables[state.cardio.event];
    if (!table) return;
    const minVal = firstScoringCellValue(table, state.ageGroup, state.sex);
    if (minVal !== undefined) _setRunTimeValue(String(minVal));
  });

  byId('run-max-btn')?.addEventListener('click', () => {
    if (state.cardio.event === 'two-kilometer-walk') return;
    const table = tables[state.cardio.event];
    if (!table) return;
    const maxVal = topCellValue(table, state.ageGroup, state.sex);
    if (maxVal !== undefined) _setRunTimeValue(String(maxVal));
  });

  // --- Cardio MIN/MAX buttons (HAMR shuttles) ---

  byId('run-shuttle-min-btn')?.addEventListener('click', () => {
    const table = tables['hamr-20-meter'];
    if (!table) return;
    const minVal = String(firstScoringCellValue(table, state.ageGroup, state.sex) ?? '0');
    dispatch({ type: 'SET_CARDIO_VALUE', value: minVal });
    if (!state.cardio.exempt) savedEventValues.cardio[state.cardio.event] = minVal;
    const txt = byId('run-shuttle-txt'); if (txt) txt.value = minVal;
    const slider = byId('run-slider'); if (slider) slider.value = minVal;
    render();
  });

  byId('run-shuttle-max-btn')?.addEventListener('click', () => {
    const table = tables['hamr-20-meter'];
    if (!table) return;
    const maxVal = String(topCellValue(table, state.ageGroup, state.sex) ?? '0');
    dispatch({ type: 'SET_CARDIO_VALUE', value: maxVal });
    if (!state.cardio.exempt) savedEventValues.cardio[state.cardio.event] = maxVal;
    const txt = byId('run-shuttle-txt'); if (txt) txt.value = maxVal;
    const slider = byId('run-slider'); if (slider) slider.value = maxVal;
    render();
  });

  // --- Component tabs ---

  document.querySelectorAll('.component-chip').forEach((chip) => {
    chip.addEventListener('click', () => selectComponent(chip.dataset.component));
  });

  // --- Fitness segmented event selectors ---

  document.querySelectorAll('.fit-seg-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const sel = byId(btn.dataset.segTarget);
      if (sel) {
        sel.value = btn.dataset.segValue;
        sel.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  });

  // --- Slider step buttons (−/+ flanking each slider) ---
  // Handled by the unified pointerdown hold-to-repeat above.

  // --- Theme change: re-render lap display and ring ---

  document.addEventListener('afpt:themechange', () => { render(); });

  // --- Chart buttons ---

  byId('push-btn')?.addEventListener('click', () => {
    openChart('strength', 'Strength Score Chart');
  });
  byId('sit-btn')?.addEventListener('click', () => {
    openChart('core', 'Core Score Chart');
  });
  byId('run-btn')?.addEventListener('click', () => {
    openChart('cardio', 'Cardio Score Chart');
  });

  // --- Chart modal controls ---

  byId('chart-category-sel')?.addEventListener('change', () => {
    chartModalState.category = byId('chart-category-sel').value;
    populateChartComponentSel(chartModalState.category);
    chartModalState.event = byId('chart-component-sel')?.value ?? '';
    refreshChartContent();
  });

  byId('chart-component-sel')?.addEventListener('change', () => {
    chartModalState.event = byId('chart-component-sel').value;
    refreshChartContent();
  });

  byId('chart-sex-sel')?.addEventListener('change', () => {
    chartModalState.sex = byId('chart-sex-sel').value;
    refreshChartContent();
  });

  byId('chart-age-sel')?.addEventListener('change', () => {
    chartModalState.ageGroup = byId('chart-age-sel').value;
    refreshChartContent();
  });

  // --- Chart close ---

  byId('close-btn')?.addEventListener('click', closeChart);
  byId('chart-drawer-scrim')?.addEventListener('click', closeChart);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !byId('modal')?.hasAttribute('hidden')) closeChart();
  });

  // --- Settings menu items ---

  bindMenuClick('run-adjust-chart', () => {
    openOfficialReference('runAltitude');
  });
  bindMenuClick('walk-adjust-chart', () => {
    openOfficialReference('walkAltitude');
  });
  bindMenuClick('shuttle-score-card', () => {
    openOfficialReference('shuttleScoreCard');
  });
  bindMenuClick('shuttle-audio-menu', () => {
    const player = byId('shuttle-audio-player');
    if (player) player.removeAttribute('hidden');
  });
  bindMenuClick('install-app-menu', () => {
    const modal = byId('install-modal');
    if (modal) modal.removeAttribute('hidden');
  });
  bindMenuClick('pwa-update-check', () => {
    window.afptPwa?.checkForUpdates?.();
  });
  bindMenuClick('dev-version-menu', () => {
    const modal = byId('dev-version-modal');
    const textEl = byId('dev-version-text');
    if (textEl) {
      fetch('./dev-build-info.json')
        .then((r) => r.json())
        .then((info) => { textEl.textContent = JSON.stringify(info, null, 2); })
        .catch(() => { textEl.textContent = 'Build info unavailable.'; });
    }
    if (modal) modal.removeAttribute('hidden');
  });

  byId('dev-version-close')?.addEventListener('click', () => {
    const modal = byId('dev-version-modal');
    if (modal) modal.setAttribute('hidden', '');
  });
  byId('install-close')?.addEventListener('click', () => {
    const modal = byId('install-modal');
    if (modal) modal.setAttribute('hidden', '');
  });
  byId('pwa-update-now')?.addEventListener('click', () => {
    byId('pwa-update-modal')?.setAttribute('hidden', '');
    window.location.reload();
  });
  byId('pwa-update-later')?.addEventListener('click', () => {
    byId('pwa-update-modal')?.setAttribute('hidden', '');
  });
}

// --- Standards loading ---

async function loadData() {
  const statusEl = byId('pfra-status');
  try {
    const [loaded, runTable, walkMaleTable, walkFemaleTable] = await Promise.all([
      loadPfraStandards(),
      fetch('./standards/extracted/tables/altitude-run-2-mile.json').then((r) => r.json()),
      fetch('./standards/extracted/tables/altitude-walk-2km-male.json').then((r) => r.json()),
      fetch('./standards/extracted/tables/altitude-walk-2km-female.json').then((r) => r.json()),
    ]);
    standards = loaded.standards;
    tables = loaded.tables;
    altitudeTables = { run: runTable, walkMale: walkMaleTable, walkFemale: walkFemaleTable };
    ready = true;
    if (statusEl) statusEl.textContent = 'Standards loaded';
  } catch (err) {
    loadError = err.message;
    if (statusEl) statusEl.textContent = `Error loading standards: ${err.message}`;
  }
}

// --- Init ---

function init() {
  refreshStateFromDom();
  bindEvents();
  loadData().then(() => {
    // After tables load, set initial defaults to the lowest valid scoring values
    // for the selected sex/age. eventDefaults are fallback-only.
    resetCurrentEventDefaults();
    render();
  });
}

init();

// --- Public API ---

window.afptApp = {
  getState,
  refreshStateFromDom,
  dispatch,
  getScoreResult,
  refreshScoreFromDom,
  isReady,
  getLoadError,
};
