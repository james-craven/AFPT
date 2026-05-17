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
import {
  DEFAULT_PACER_AUDIO_SETTINGS,
  PacerAudioController,
  loadPacerAudioSettings,
  normalizePacerAudioSettings,
  savePacerAudioSettings,
} from './pacer-audio.mjs';

// --- State ---

const defaultCardioValue = '20:00'; // fallback before tables load
const PACE_TRACK = { x: 70, y: 50, w: 200, h: 90, r: 45 };
const PACE_ROUTE = { startX: 22, endX: 318, y: 128 };
const PACE_OUT_BACK = { startX: 24, endX: 316, outY: 48, backY: 146 };
const PACE_TRACK_CENTER_Y = PACE_TRACK.y + PACE_TRACK.h / 2;
const PACE_TOTAL_MILES = 2;

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

let pacePacer = {
  active: false,
  elapsedMs: 0,
  finished: false,
  goalSeconds: null,
  rafId: 0,
  startedAt: 0,
};

let paceAudioSettings = loadPacerAudioSettings();
const paceAudioController = new PacerAudioController();

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

const SCORE_CHART_REFERENCES = {
  'push-up': {
    title: 'Push-Up Official Score Chart',
    src: './standards/sources/pfra-score-pages/pfra-scoring-page-02.jpg',
    alt: 'Official PFRA push-up scoring standards page',
    caption: 'AFPC PFRA Scoring Charts, Push-Up Scoring Standards',
  },
  'hand-release-push-up': {
    title: 'Hand Release Push-Up Official Score Chart',
    src: './standards/sources/pfra-score-pages/pfra-scoring-page-03.jpg',
    alt: 'Official PFRA hand release push-up scoring standards page',
    caption: 'AFPC PFRA Scoring Charts, Hand Release Push-Up Scoring Standards',
  },
  'sit-up': {
    title: 'Sit-Up Official Score Chart',
    src: './standards/sources/pfra-score-pages/pfra-scoring-page-04.jpg',
    alt: 'Official PFRA sit-up scoring standards page',
    caption: 'AFPC PFRA Scoring Charts, Sit-Up Scoring Standards',
  },
  'cross-leg-reverse-crunch': {
    title: 'Cross-Leg Reverse Crunch Official Score Chart',
    src: './standards/sources/pfra-score-pages/pfra-scoring-page-05.jpg',
    alt: 'Official PFRA cross-leg reverse crunch scoring standards page',
    caption: 'AFPC PFRA Scoring Charts, Cross-Leg Reverse Crunch Scoring Standards',
  },
  'forearm-plank': {
    title: 'Forearm Plank Official Score Chart',
    src: './standards/sources/pfra-score-pages/pfra-scoring-page-06.jpg',
    alt: 'Official PFRA forearm plank scoring standards page',
    caption: 'AFPC PFRA Scoring Charts, Forearm Plank Scoring Standards',
  },
  'two-mile-run': {
    title: '2 Mile Run Official Score Chart',
    src: './standards/sources/pfra-score-pages/pfra-scoring-page-07.jpg',
    alt: 'Official PFRA 2 mile run scoring standards page',
    caption: 'AFPC PFRA Scoring Charts, 2 Mile Run Scoring Standards',
  },
  'hamr-20-meter': {
    title: '20m HAMR Official Score Chart',
    src: './standards/sources/pfra-score-pages/pfra-scoring-page-08.jpg',
    alt: 'Official PFRA 20 meter HAMR scoring standards page',
    caption: 'AFPC PFRA Scoring Charts, 20-Meter HAMR Scoring Standards',
  },
  'two-kilometer-walk': {
    title: '2 km Walk Official Reference',
    src: './standards/sources/pfra-score-pages/pfra-scoring-page-10.jpg',
    alt: 'Official PFRA 2 kilometer walk male and female maximum times page',
    caption: 'AFPC PFRA Scoring Charts, 2.0 Kilometer Walk Male and Female',
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
  const referenceRow = document.querySelector('.chart-reference-row');
  const ctrlRow = document.querySelector('.chart-ctrl-row');
  const demoRow = document.querySelector('.chart-demo-row');
  if (referenceRow) referenceRow.hidden = !visible;
  if (ctrlRow) ctrlRow.hidden = !visible;
  if (demoRow) demoRow.hidden = !visible;
}

function updateChartReferenceButton() {
  const button = byId('chart-reference-btn');
  if (!button) return;
  const reference = SCORE_CHART_REFERENCES[chartModalState.event];
  button.disabled = !reference;
  button.title = chartModalState.event === 'hamr-20-meter'
    ? 'Open HAMR score chart and shuttle score card'
    : reference ? `Open ${reference.title}` : 'No official reference is available for this event';
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

function deltaForChartCell(table, cell, currentPerformance, isCurrentRow) {
  if (isCurrentRow) {
    return { text: 'You', className: 'delta--current' };
  }

  const current = table.unit === 'min:sec'
    ? toSeconds(currentPerformance)
    : Number(currentPerformance);
  const target = table.unit === 'min:sec'
    ? toSeconds(cell.value)
    : Number(cell.value);

  if (!Number.isFinite(current) || !Number.isFinite(target)) {
    return { text: '—', className: 'delta--na' };
  }

  const higherIsBetter = cell.atLeast || table.higherIsBetter;
  const meetsTarget = higherIsBetter ? current >= target : current <= target;
  const rawDelta = higherIsBetter ? target - current : current - target;
  const delta = Math.abs(rawDelta);
  const formattedDelta = table.unit === 'min:sec'
    ? secondsToTimeString(delta)
    : String(delta);

  if (meetsTarget) {
    return {
      text: delta === 0 ? 'You' : `✓ ${formattedDelta}`,
      className: delta === 0 ? 'delta--current' : 'delta--met',
    };
  }

  return {
    text: higherIsBetter ? `+${formattedDelta}` : `-${formattedDelta}`,
    className: 'delta--need',
  };
}

function hamrLevelParts(totalShuttles) {
  const n = Number(totalShuttles);
  if (!Number.isFinite(n) || n < 1) return null;
  const rounded = Math.round(n);
  const range = HAMR_LEVEL_RANGES.find(({ start, end }) => rounded >= start && rounded <= end)
    || HAMR_LEVEL_RANGES[HAMR_LEVEL_RANGES.length - 1];
  return {
    level: range.level,
    shuttle: Math.max(1, Math.min(range.end - range.start + 1, rounded - range.start + 1)),
  };
}

function hamrLevelShortText(totalShuttles) {
  const parts = hamrLevelParts(totalShuttles);
  return parts ? `(L:${parts.level} | S:${parts.shuttle})` : '';
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
  const colHeader = table.unit === 'shuttles' ? 'Shuttles' : isTime ? 'Time' : 'Reps';
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
    const baseDisplayVal = isTime
      ? rawVal
      : (cell.atLeast ? `&ge;&nbsp;${rawVal}` : `&le;&nbsp;${rawVal}`);
    const displayVal = event === 'hamr-20-meter'
      ? `${baseDisplayVal} <span class="chart-hamr-level">${hamrLevelShortText(rawVal)}</span>`
      : baseDisplayVal;
    const isCurrentRow = currentMatch === cell;
    const delta = deltaForChartCell(table, cell, currentPerformance, isCurrentRow);
    const youMarker = isCurrentRow ? '<span class="chart-you" aria-label="You are here">&lt; YOU</span>' : '';
    rows += `<tr class="${isCurrentRow ? 'chart-row--you' : ''}"><td class="chart-cell chart-cell--perf">${displayVal}</td><td class="chart-cell chart-cell--score">${pts}${youMarker}</td><td class="chart-cell chart-cell--delta ${delta.className}">${delta.text}</td></tr>`;
  }

  const ageFmt = ageGroup.replace('under-', '< ').replace('-and-over', '+').replace('-', '–');
  return `<p class="chart-meta">${sex === 'male' ? 'Male' : 'Female'} &middot; Age ${ageFmt}</p><table class="chart-table"><thead><tr><th class="chart-th">${colHeader}</th><th class="chart-th">Pts</th><th class="chart-th" title="Difference between your current result and this row">Your Gap</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function refreshChartContent() {
  const contentEl = byId('chart-content');
  if (contentEl) {
    setChartDrawerTitle('Score Chart');
    updateChartReferenceButton();
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

function referenceFigure(reference) {
  return `<figure class="chart-reference">
    <div class="chart-reference__frame">
      <img class="chart-reference__image" src="${reference.src}" alt="${reference.alt}">
    </div>
    <figcaption class="chart-reference__caption">${reference.caption}</figcaption>
  </figure>`;
}

function resolveOfficialReference(referenceKey) {
  return typeof referenceKey === 'string'
    ? OFFICIAL_REFERENCES[referenceKey]
    : referenceKey;
}

function renderOfficialReference(referenceKey) {
  const contentEl = byId('chart-content');
  const reference = resolveOfficialReference(referenceKey);
  if (!contentEl || !reference) return;

  setChartDrawerTitle(reference.title);
  contentEl.innerHTML = referenceFigure(reference);
}

function renderOfficialReferenceSet(title, referenceKeys) {
  const contentEl = byId('chart-content');
  if (!contentEl) return;
  const references = referenceKeys.map(resolveOfficialReference).filter(Boolean);
  if (!references.length) return;

  setChartDrawerTitle(title);
  contentEl.innerHTML = references.map(referenceFigure).join('');
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
  delete modal.dataset.returnToChart;

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
  delete modal.dataset.returnToChart;
  setChartControlsVisible(false);
  renderOfficialReference(referenceKey);
  modal.removeAttribute('hidden');
  modal.dataset.chartOpen = 'true';
}

function openCurrentScoreReference() {
  const reference = SCORE_CHART_REFERENCES[chartModalState.event];
  if (!reference) return;
  const modal = byId('modal');
  if (!modal) return;
  modal.dataset.chartMode = 'reference';
  modal.dataset.returnToChart = 'true';
  setChartControlsVisible(false);
  if (chartModalState.event === 'hamr-20-meter') {
    renderOfficialReferenceSet('20m HAMR Official References', [reference, 'shuttleScoreCard']);
  } else {
    renderOfficialReference(reference);
  }
  modal.removeAttribute('hidden');
  modal.dataset.chartOpen = 'true';
}

function closeChart() {
  const modal = byId('modal');
  if (!modal) return;

  if (modal.dataset.chartMode === 'reference' && modal.dataset.returnToChart === 'true') {
    modal.dataset.chartMode = 'score';
    delete modal.dataset.returnToChart;
    setChartControlsVisible(true);
    refreshChartContent();
    return;
  }

  modal.setAttribute('hidden', '');
  delete modal.dataset.chartOpen;
  delete modal.dataset.returnToChart;
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

function pacePoint(t, expand = 0) {
  return stadiumPoint(t, PACE_TRACK.x, PACE_TRACK.y, PACE_TRACK.w, PACE_TRACK.h, PACE_TRACK.r, expand);
}

function routePoint(t) {
  const clamped = Math.max(0, Math.min(1, t));
  return {
    x: PACE_ROUTE.startX + (PACE_ROUTE.endX - PACE_ROUTE.startX) * clamped,
    y: PACE_ROUTE.y,
  };
}

function outBackPoint(t) {
  const clamped = Math.max(0, Math.min(1, t));
  if (clamped <= 0.5) {
    const outbound = clamped / 0.5;
    return {
      x: PACE_OUT_BACK.startX + (PACE_OUT_BACK.endX - PACE_OUT_BACK.startX) * outbound,
      y: PACE_OUT_BACK.outY,
      leg: 'outbound',
    };
  }
  const inbound = (clamped - 0.5) / 0.5;
  return {
    x: PACE_OUT_BACK.endX - (PACE_OUT_BACK.endX - PACE_OUT_BACK.startX) * inbound,
    y: PACE_OUT_BACK.backY,
    leg: 'return',
  };
}

function paceCoursePoint(courseMode, t) {
  if (courseMode === 'route') return routePoint(t);
  if (courseMode === 'out-back') return outBackPoint(t);
  return pacePoint(t);
}

function paceCourseAngle(courseMode, t) {
  if (courseMode === 'route') return 0;
  if (courseMode === 'out-back') return 0;
  return 0;
}

function paceLapProgress(courseMode, lapNumber, lapCount) {
  const ratio = lapNumber / lapCount;
  return courseMode === 'track' ? ratio % 1 : ratio;
}

function paceMarkerLayout(courseMode, t, lapNumber) {
  if (courseMode === 'route') {
    const p = routePoint(t);
    const edgeAnchor = t >= 0.98 ? 'end' : t <= 0.02 ? 'start' : 'middle';
    const labelAbove = lapNumber % 2 === 1;
    return {
      anchor: edgeAnchor,
      label: { x: p.x, y: labelAbove ? p.y - 29 : p.y + 24 },
      point: p,
      split: { x: p.x, y: labelAbove ? p.y - 17 : p.y + 36 },
    };
  }

  if (courseMode === 'out-back') {
    const p = outBackPoint(t);
    const outbound = p.leg !== 'return';
    const edgeAnchor = p.x >= PACE_OUT_BACK.endX - 1 ? 'end' : p.x <= PACE_OUT_BACK.startX + 1 ? 'start' : 'middle';
    return {
      anchor: edgeAnchor,
      label: { x: p.x, y: outbound ? p.y - 34 : p.y + 22 },
      point: p,
      split: { x: p.x, y: outbound ? p.y - 22 : p.y + 34 },
    };
  }

  const p = pacePoint(t, 0);
  const lp = pacePoint(t, 22);
  const anchor = (t > 0.05 && t < 0.45) ? 'start' : (t > 0.55 && t < 0.95) ? 'end' : 'middle';
  const dx = anchor === 'start' ? 4 : anchor === 'end' ? -4 : 0;
  return {
    anchor,
    label: { x: lp.x + dx, y: lp.y - 4 },
    point: p,
    split: { x: lp.x + dx, y: lp.y + 7 },
  };
}

function formatPaceCourseShape(courseMode) {
  if (courseMode === 'route') {
    return `<line x1="${PACE_ROUTE.startX}" y1="${PACE_ROUTE.y}" x2="${PACE_ROUTE.endX}" y2="${PACE_ROUTE.y}" class="pace-route-line" stroke-width="14"/>
        <line x1="${PACE_ROUTE.startX}" y1="${PACE_ROUTE.y}" x2="${PACE_ROUTE.endX}" y2="${PACE_ROUTE.y}" class="pace-route-dash" stroke-width="1" stroke-dasharray="2 6"/>`;
  }

  if (courseMode === 'out-back') {
    return `<line x1="${PACE_OUT_BACK.startX}" y1="${PACE_OUT_BACK.outY}" x2="${PACE_OUT_BACK.endX}" y2="${PACE_OUT_BACK.outY}" class="pace-outback-line pace-outback-line--out" stroke-width="12"/>
        <line x1="${PACE_OUT_BACK.endX}" y1="${PACE_OUT_BACK.backY}" x2="${PACE_OUT_BACK.startX}" y2="${PACE_OUT_BACK.backY}" class="pace-outback-line pace-outback-line--back" stroke-width="12"/>
        <line x1="${PACE_OUT_BACK.startX}" y1="${PACE_OUT_BACK.outY}" x2="${PACE_OUT_BACK.endX}" y2="${PACE_OUT_BACK.outY}" class="pace-outback-dash" stroke-width="1" stroke-dasharray="2 6"/>
        <line x1="${PACE_OUT_BACK.endX}" y1="${PACE_OUT_BACK.backY}" x2="${PACE_OUT_BACK.startX}" y2="${PACE_OUT_BACK.backY}" class="pace-outback-dash pace-outback-dash--back" stroke-width="1" stroke-dasharray="2 6"/>`;
  }

  return `<rect x="70" y="50" width="200" height="90" rx="45" fill="none" class="pace-track-ring" stroke-width="14"/>
        <rect x="70" y="50" width="200" height="90" rx="45" fill="none" class="pace-track-dash" stroke-width="1" stroke-dasharray="2 6"/>`;
}

function formatPaceCourseMorph(courseMode, previousCourse) {
  if (!previousCourse || previousCourse === courseMode) return '';

  const trackRect = `<rect x="${PACE_TRACK.x}" y="${PACE_TRACK.y}" width="${PACE_TRACK.w}" height="${PACE_TRACK.h}" rx="${PACE_TRACK.r}" fill="none" class="pace-morph-track pace-morph-track--to-${courseMode}" stroke-width="14"/>`;
  const centerLine = (extraClass) => `<line x1="${PACE_OUT_BACK.startX}" y1="${PACE_TRACK_CENTER_Y}" x2="${PACE_OUT_BACK.endX}" y2="${PACE_TRACK_CENTER_Y}" class="pace-morph-line ${extraClass}" stroke-width="12"/>`;
  const routeLine = (extraClass) => `<line x1="${PACE_ROUTE.startX}" y1="${PACE_ROUTE.y}" x2="${PACE_ROUTE.endX}" y2="${PACE_ROUTE.y}" class="pace-morph-line ${extraClass}" stroke-width="14"/>`;
  const outLine = (extraClass) => `<line x1="${PACE_OUT_BACK.startX}" y1="${PACE_OUT_BACK.outY}" x2="${PACE_OUT_BACK.endX}" y2="${PACE_OUT_BACK.outY}" class="pace-morph-line ${extraClass}" stroke-width="12"/>`;
  const backLine = (extraClass) => `<line x1="${PACE_OUT_BACK.endX}" y1="${PACE_OUT_BACK.backY}" x2="${PACE_OUT_BACK.startX}" y2="${PACE_OUT_BACK.backY}" class="pace-morph-line ${extraClass}" stroke-width="12"/>`;

  if (previousCourse === 'track' && courseMode === 'route') {
    return `${trackRect}`;
  }

  if (previousCourse === 'track' && courseMode === 'out-back') {
    return `${trackRect}
      ${centerLine('pace-morph-line--track-to-out')}
      ${centerLine('pace-morph-line--track-to-back')}`;
  }

  if (previousCourse === 'route' && courseMode === 'out-back') {
    return `${routeLine('pace-morph-line--route-to-out')}
      ${routeLine('pace-morph-line--route-to-back')}`;
  }

  if (previousCourse === 'out-back' && courseMode === 'route') {
    return `${outLine('pace-morph-line--out-to-route')}
      ${backLine('pace-morph-line--back-to-route')}`;
  }

  if (previousCourse === 'route' && courseMode === 'track') {
    return `${routeLine('pace-morph-line--route-to-track')}`;
  }

  if (previousCourse === 'out-back' && courseMode === 'track') {
    return `${outLine('pace-morph-line--out-to-track')}
      ${backLine('pace-morph-line--back-to-track')}`;
  }

  return '';
}

function paceCourseSubText(courseMode, lapTimeStr) {
  if (courseMode === 'route') return `route marks &middot; <span class="lap-fitness__pace">${lapTimeStr}</span>`;
  if (courseMode === 'out-back') return `out/back marks &middot; <span class="lap-fitness__pace">${lapTimeStr}</span>`;
  return `each lap &middot; <span class="lap-fitness__pace">${lapTimeStr}</span>`;
}

function paceCourseCueText(courseMode) {
  if (courseMode === 'route') return 'Runner moves down the route; dots show track-lap equivalents.';
  if (courseMode === 'out-back') return 'Runner drops to the return lane at halfway.';
  return 'Glance at your watch crossing the line.';
}

function formatPaceCourseEndpoints(courseMode) {
  if (courseMode === 'route') {
    return `<g class="pace-endpoint pace-endpoint--start" aria-hidden="true">
      <circle cx="${PACE_ROUTE.startX}" cy="${PACE_ROUTE.y}" r="7" class="pace-dot--start" fill="url(#pacePlanFinGrad)" stroke="rgba(255,255,255,0.4)" stroke-width="1.5"/>
      <text x="${PACE_ROUTE.startX}" y="${PACE_ROUTE.y + 0.5}" text-anchor="middle" dominant-baseline="middle" class="pace-start-text" font-size="6" font-weight="800" letter-spacing="0.4">ST</text>
    </g>`;
  }

  if (courseMode === 'out-back') {
    return `<g class="pace-endpoint pace-endpoint--start" aria-hidden="true">
      <circle cx="${PACE_OUT_BACK.startX}" cy="${PACE_OUT_BACK.outY}" r="7" class="pace-dot--start" fill="url(#pacePlanFinGrad)" stroke="rgba(255,255,255,0.4)" stroke-width="1.5"/>
      <text x="${PACE_OUT_BACK.startX}" y="${PACE_OUT_BACK.outY + 0.5}" text-anchor="middle" dominant-baseline="middle" class="pace-start-text" font-size="6" font-weight="800" letter-spacing="0.4">ST</text>
    </g>
    <g class="pace-endpoint pace-endpoint--return-start" data-pace-return-dot-lap="4" aria-hidden="true">
      <circle cx="${PACE_OUT_BACK.endX}" cy="${PACE_OUT_BACK.backY}" r="4.5" class="pace-dot pace-return-dot"/>
    </g>`;
  }

  return '';
}

function paceGoalLayout(courseMode) {
  if (courseMode === 'route') {
    return { goalY: 36, timeY: 62, timeSize: 23, buttonCy: 56, buttonR: 13, startCx: 112, secondaryCx: 228 };
  }
  if (courseMode === 'out-back') {
    return { goalY: 75, timeY: 103, timeSize: 23, buttonCy: 97, buttonR: 13, startCx: 112, secondaryCx: 228 };
  }
  return { goalY: 73, timeY: 101, timeSize: 24, buttonCy: 95, buttonR: 13, startCx: 112, secondaryCx: 228 };
}

function formatPaceGoalButton(courseMode, totalStr) {
  const layout = paceGoalLayout(courseMode);
  const playPath = `M ${layout.startCx - 4} ${layout.buttonCy - 7} L ${layout.startCx - 4} ${layout.buttonCy + 7} L ${layout.startCx + 8} ${layout.buttonCy} Z`;
  const pauseBarY = layout.buttonCy - 7;
  const resetPath = `M ${layout.secondaryCx + 6} ${layout.buttonCy - 7} A 9 9 0 1 0 ${layout.secondaryCx + 8} ${layout.buttonCy + 4} M ${layout.secondaryCx + 6} ${layout.buttonCy - 7} L ${layout.secondaryCx + 6} ${layout.buttonCy - 12} L ${layout.secondaryCx + 11} ${layout.buttonCy - 8}`;
  return `<g class="pace-goal-display" aria-hidden="true">
          <text x="170" y="${layout.goalY}" text-anchor="middle" class="pace-goal-text" font-size="9" letter-spacing="2">GOAL</text>
          <text x="170" y="${layout.timeY}" text-anchor="middle" class="pace-time-text" font-size="${layout.timeSize}" font-weight="800" letter-spacing="-0.5" font-variant-numeric="tabular-nums">${totalStr}</text>
        </g>
        <g class="pace-pacer-control pace-pacer-start" data-pacer-start role="button" tabindex="0" focusable="true" aria-label="Start personal pacer for ${totalStr} goal">
          <circle cx="${layout.startCx}" cy="${layout.buttonCy}" r="${layout.buttonR}" class="pace-pacer-hit"/>
          <path class="pace-pacer-icon pace-icon--play" d="${playPath}"/>
        </g>
        <g class="pace-pacer-control pace-pacer-secondary" data-pacer-secondary data-pacer-action="pause" role="button" tabindex="0" focusable="true" aria-label="Pause personal pacer" aria-hidden="true">
          <circle cx="${layout.secondaryCx}" cy="${layout.buttonCy}" r="${layout.buttonR}" class="pace-pacer-hit"/>
          <g class="pace-pacer-icon pace-icon--pause">
            <rect x="${layout.secondaryCx - 5}" y="${pauseBarY}" width="3.5" height="14" rx="1"/>
            <rect x="${layout.secondaryCx + 2}" y="${pauseBarY}" width="3.5" height="14" rx="1"/>
          </g>
          <path class="pace-pacer-icon pace-icon--reset" d="${resetPath}"/>
        </g>`;
}

function selectedOption(value, current) {
  return value === current ? ' selected' : '';
}

function formatPaceAudioControls(settings) {
  const normalized = normalizePacerAudioSettings(settings || DEFAULT_PACER_AUDIO_SETTINGS);
  const enabled = normalized.enabled ? ' checked' : '';
  return `<div class="pace-audio-panel" data-pacer-audio-panel data-audio-enabled="${normalized.enabled ? 'true' : 'false'}">
    <div class="pace-audio-panel__top">
      <span class="pace-audio-panel__title">Pacer Audio</span>
      <label class="pace-audio-toggle">
        <input type="checkbox" data-pacer-audio-field="enabled"${enabled}>
        <span>Audio cues</span>
      </label>
    </div>
    <div class="pace-audio-grid">
      <label>
        <span>Course</span>
        <select data-pacer-audio-field="courseMode" aria-label="Pacer course mode">
          <option value="track"${selectedOption('track', normalized.courseMode)}>Track</option>
          <option value="route"${selectedOption('route', normalized.courseMode)}>Route</option>
          <option value="out-back"${selectedOption('out-back', normalized.courseMode)}>Out/Back</option>
        </select>
      </label>
      <label>
        <span>Cue</span>
        <select data-pacer-audio-field="cueFrequency" aria-label="Pacer cue frequency">
          <option value="100m"${selectedOption('100m', normalized.cueFrequency)}>100m</option>
          <option value="200m"${selectedOption('200m', normalized.cueFrequency)}>200m</option>
          <option value="400m"${selectedOption('400m', normalized.cueFrequency)}>400m</option>
          <option value="quarter"${selectedOption('quarter', normalized.cueFrequency)}>Quarter</option>
        </select>
      </label>
      <label class="pace-audio-vibrate">
        <span>Haptics</span>
        <span class="pace-audio-check">
          <input type="checkbox" data-pacer-audio-field="vibration"${normalized.vibration ? ' checked' : ''}>
          Vibrate
        </span>
      </label>
    </div>
    <p class="pace-audio-note">Audio pacer uses voice cues and requests ducking behavior when supported. Test with your headphones or music before running.</p>
    <div class="pace-audio-actions">
      <button type="button" data-pacer-audio-test>Test cue</button>
      <span class="pace-audio-status" data-pacer-audio-status>${normalized.enabled ? 'Audio cues ready.' : 'Audio cues off.'}</span>
    </div>
  </div>`;
}

function updatePaceAudioStatus(message) {
  const status = byId('run-lap-times')?.querySelector('[data-pacer-audio-status]');
  if (!status) return;
  if (message) {
    status.textContent = message;
    return;
  }
  status.textContent = paceAudioSettings.enabled
    ? `Audio pacer on: ${paceAudioSettings.courseMode.replace('-', '/')} · ${paceAudioSettings.cueFrequency}.`
    : 'Audio cues off.';
}

paceAudioController.setStatusCallback(updatePaceAudioStatus);

function currentPaceGoalSeconds() {
  const goalSeconds = toSeconds(state.cardio.value);
  return Number.isFinite(goalSeconds) && goalSeconds > 0 ? goalSeconds : null;
}

function applyPaceAudioSettings(nextSettings, { persist = true, syncElapsed = true } = {}) {
  const previousCourseMode = paceAudioSettings.courseMode;
  paceAudioSettings = normalizePacerAudioSettings(nextSettings);
  if (persist) savePacerAudioSettings(paceAudioSettings);

  if (paceAudioSettings.courseMode !== previousCourseMode) {
    renderPacePlan(previousCourseMode);
    return;
  }

  const panel = byId('run-lap-times')?.querySelector('[data-pacer-audio-panel]');
  if (panel) panel.dataset.audioEnabled = paceAudioSettings.enabled ? 'true' : 'false';

  const goalSeconds = currentPaceGoalSeconds();
  if (syncElapsed && goalSeconds !== null) {
    paceAudioController.syncToElapsed(currentPacePacerElapsedMs(), goalSeconds, paceAudioSettings);
  }
  updatePaceAudioStatus();
}

function readPaceAudioSettingsFromControls() {
  const panel = byId('run-lap-times')?.querySelector('[data-pacer-audio-panel]');
  if (!panel) return paceAudioSettings;
  const field = (name) => panel.querySelector(`[data-pacer-audio-field="${name}"]`);
  return normalizePacerAudioSettings({
    enabled: Boolean(field('enabled')?.checked),
    courseMode: field('courseMode')?.value,
    cueFrequency: field('cueFrequency')?.value,
    vibration: Boolean(field('vibration')?.checked),
  });
}

// PACE PLAN LOCKED: User approved this visual. Do not redesign. Only move/retheme.
// Canonical pace plan — used on all themes. SVG uses CSS classes for token-based theming.
// viewBox 0 0 340 190, rect x=70 y=50 w=200 h=90 rx=45 (exact mock-fitness.jsx params).
function formatPacePlan(totalSeconds, lapCount, lapSec, previousCourseMode = null) {
  const totalStr = secondsToTimeString(totalSeconds);
  const lapTimeStr = secondsToTimeString(lapSec);
  const courseMode = normalizePacerAudioSettings(paceAudioSettings).courseMode;
  const startPoint = paceCoursePoint(courseMode, 0);
  const startAngle = paceCourseAngle(courseMode, 0);
  const previousCourse = previousCourseMode || courseMode;
  const hasCourseTransition = previousCourse !== courseMode;
  let markers = '';

  for (let i = 0; i < lapCount; i++) {
    const n = i + 1;
    const t = paceLapProgress(courseMode, n, lapCount);
    const layout = paceMarkerLayout(courseMode, t, n);
    const p = layout.point;
    const isFinish = i === lapCount - 1;
    const splitSeconds = isFinish ? totalSeconds : Math.round((totalSeconds * n) / lapCount);
    const splitStr = secondsToTimeString(splitSeconds);
    const labelText = isFinish ? 'FINISH' : `L${n}`;
    const splitWeight = isFinish ? 800 : 600;
    const dotR = isFinish ? 7 : 4.5;
    // Finish dot uses hardcoded gold→pink gradient (always distinctive on any theme).
    // Non-finish dots use .pace-dot CSS class so the theme token applies.
    const dotAttrs = isFinish
      ? `class="pace-dot--finish" fill="url(#pacePlanFinGrad)" stroke="rgba(255,255,255,0.4)" stroke-width="1.5"`
      : `class="pace-dot"`;
    const finText = isFinish
      ? `<text x="${p.x.toFixed(1)}" y="${(p.y + 0.5).toFixed(1)}" text-anchor="middle" dominant-baseline="middle" class="pace-fin-text" font-size="6" font-weight="800" letter-spacing="0.5">FIN</text>`
      : '';
    const textAnchor = isFinish ? 'middle' : layout.anchor;
    markers += `<g class="pace-marker${isFinish ? ' pace-marker--finish' : ''}" data-pace-lap="${n}">
      <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${dotR}" ${dotAttrs}/>
      ${finText}
      <text x="${layout.label.x.toFixed(1)}" y="${layout.label.y.toFixed(1)}" text-anchor="${textAnchor}" class="${isFinish ? 'pace-fin-label' : 'pace-label'}" font-size="8" letter-spacing="1" font-weight="600">${labelText}</text>
      <text x="${layout.split.x.toFixed(1)}" y="${layout.split.y.toFixed(1)}" text-anchor="${textAnchor}" class="${isFinish ? 'pace-fin-split' : 'pace-split'}" font-size="11" font-weight="${splitWeight}" font-variant-numeric="tabular-nums">${splitStr}</text>
    </g>`;
  }

  return `<div class="lap-fitness" data-lap-count="${lapCount}" data-course="${courseMode}" data-prev-course="${previousCourse}" data-course-transition="${hasCourseTransition ? 'true' : 'false'}">
    <div class="lap-fitness__hdr">
      <span class="lap-fitness__title">Pace plan</span>
      <span class="lap-fitness__sub">${paceCourseSubText(courseMode, lapTimeStr)}</span>
    </div>
    <p class="lap-fitness__cue">${paceCourseCueText(courseMode)}</p>
    <div class="lap-fitness__svg-wrap">
      <svg width="100%" viewBox="0 0 340 190" style="max-width:340px;display:block;margin:0 auto">
        <defs>
          <linearGradient id="pacePlanFinGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#ffb547"/>
            <stop offset="1" stop-color="#ff5dab"/>
          </linearGradient>
        </defs>
        <g class="pace-course-shape">${formatPaceCourseShape(courseMode)}</g>
        <g class="pace-course-morph" data-morph-from="${previousCourse}" data-morph-to="${courseMode}">${hasCourseTransition ? formatPaceCourseMorph(courseMode, previousCourse) : ''}</g>
        ${formatPaceCourseEndpoints(courseMode)}
        ${formatPaceGoalButton(courseMode, totalStr)}
        <g class="pace-pacer-runner" data-pacer-runner data-course-leg="${startPoint.leg || 'track'}" transform="translate(${startPoint.x.toFixed(2)} ${startPoint.y.toFixed(2)}) rotate(${startAngle.toFixed(1)})" aria-hidden="true">
          <circle class="pace-pacer-halo" r="10"/>
          <circle class="pace-runner-head" cx="0" cy="-6" r="2.3"/>
          <path class="pace-runner-body" d="M0 -3 L0 2 M0 -1 L-5 2 M0 -1 L5 -3 M0 2 L-4 7 M0 2 L5 6"/>
        </g>
        ${markers}
      </svg>
    </div>
    <p class="pace-pacer-status" data-pacer-status>Tap play to start pacer.</p>
    <div class="pace-distance-readout" aria-label="Distance traveled">
      <span>Distance</span>
      <strong><span data-pacer-distance-value>0.00</span> mi</strong>
    </div>
    ${formatPaceAudioControls(paceAudioSettings)}
  </div>`;
}

function cancelPacePacerFrame() {
  if (!pacePacer.rafId) return;
  cancelAnimationFrame(pacePacer.rafId);
  pacePacer.rafId = 0;
}

function resetPacePacer(goalSeconds = null) {
  cancelPacePacerFrame();
  paceAudioController.reset();
  pacePacer = {
    active: false,
    elapsedMs: 0,
    finished: false,
    goalSeconds,
    rafId: 0,
    startedAt: 0,
  };
}

function currentPacePacerElapsedMs(now = performance.now()) {
  return pacePacer.elapsedMs + (pacePacer.active ? now - pacePacer.startedAt : 0);
}

function updateCompletedPaceLaps(plan, completedLaps) {
  plan.querySelectorAll('[data-pace-lap]').forEach((marker) => {
    const lap = Number(marker.dataset.paceLap);
    marker.classList.toggle('pace-marker--complete', Number.isFinite(lap) && lap <= completedLaps);
  });
  plan.querySelectorAll('[data-pace-return-dot-lap]').forEach((marker) => {
    const lap = Number(marker.dataset.paceReturnDotLap);
    marker.classList.toggle('pace-marker--complete', Number.isFinite(lap) && lap <= completedLaps);
  });
}

function updatePacePacerDisplay(now = performance.now()) {
  const lapDisplay = byId('run-lap-times');
  const runner = lapDisplay?.querySelector('[data-pacer-runner]');
  const status = lapDisplay?.querySelector('[data-pacer-status]');
  const distance = lapDisplay?.querySelector('[data-pacer-distance-value]');
  const startControl = lapDisplay?.querySelector('[data-pacer-start]');
  const secondaryControl = lapDisplay?.querySelector('[data-pacer-secondary]');
  const plan = lapDisplay?.querySelector('.lap-fitness');
  const goalSeconds = pacePacer.goalSeconds ?? toSeconds(state.cardio.value);
  if (!lapDisplay || !runner || !status || !distance || !startControl || !secondaryControl || !plan || !Number.isFinite(goalSeconds) || goalSeconds <= 0) return;

  const goalMs = goalSeconds * 1000;
  const lapCount = Math.max(1, Number(plan.dataset.lapCount) || 8);
  const lapMs = goalMs / lapCount;
  const elapsedMs = Math.min(goalMs, currentPacePacerElapsedMs(now));
  const elapsedSeconds = Math.floor(elapsedMs / 1000);
  const completedLaps = lapMs > 0 ? Math.min(lapCount, Math.floor(elapsedMs / lapMs)) : 0;
  const currentLap = Math.min(lapCount, completedLaps + 1);
  const lapProgress = completedLaps >= lapCount ? 0 : ((elapsedMs % lapMs) / lapMs);
  const totalProgress = goalMs > 0 ? Math.min(1, Math.max(0, elapsedMs / goalMs)) : 0;
  const distanceMiles = Math.min(PACE_TOTAL_MILES, totalProgress * PACE_TOTAL_MILES);
  const courseMode = plan.dataset.course || 'track';
  const courseProgress = courseMode === 'track' ? lapProgress : totalProgress;
  const p = paceCoursePoint(courseMode, courseProgress);
  const angle = paceCourseAngle(courseMode, courseProgress);

  if (elapsedMs >= goalMs && pacePacer.active) {
    pacePacer.active = false;
    pacePacer.finished = true;
    pacePacer.elapsedMs = goalMs;
    cancelPacePacerFrame();
  }

  runner.dataset.courseLeg = p.leg || courseMode;
  runner.setAttribute('transform', `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)}) rotate(${angle.toFixed(1)})`);
  distance.textContent = distanceMiles.toFixed(2);
  updateCompletedPaceLaps(plan, completedLaps);
  paceAudioController.update(elapsedMs, goalSeconds, paceAudioSettings);
  const stateName = pacePacer.finished ? 'finished' : pacePacer.active ? 'running' : pacePacer.elapsedMs > 0 ? 'paused' : 'idle';
  plan.dataset.pacerState = stateName;
  startControl.setAttribute('aria-label', pacePacer.elapsedMs > 0 && !pacePacer.finished
    ? 'Resume personal pacer'
    : `Start personal pacer for ${secondsToTimeString(goalSeconds)} goal`);
  startControl.setAttribute('aria-disabled', pacePacer.active ? 'true' : 'false');
  startControl.setAttribute('tabindex', pacePacer.active ? '-1' : '0');
  const secondaryAction = pacePacer.active ? 'pause' : 'reset';
  secondaryControl.dataset.pacerAction = secondaryAction;
  secondaryControl.setAttribute('aria-label', secondaryAction === 'pause' ? 'Pause personal pacer' : 'Reset personal pacer');
  secondaryControl.setAttribute('aria-hidden', stateName === 'idle' ? 'true' : 'false');
  secondaryControl.setAttribute('tabindex', stateName === 'idle' ? '-1' : '0');

  if (pacePacer.finished) {
    status.textContent = `Goal reached at ${secondsToTimeString(goalSeconds)}. Tap play to restart or reset to start.`;
    paceAudioController.stop({ cancelSpeech: false });
  } else if (pacePacer.active) {
    status.textContent = `Pacer ${secondsToTimeString(elapsedSeconds)} / ${secondsToTimeString(goalSeconds)} · Lap ${currentLap} of ${lapCount}`;
  } else if (pacePacer.elapsedMs > 0) {
    status.textContent = `Paused at ${secondsToTimeString(elapsedSeconds)} · Lap ${currentLap} of ${lapCount}. Tap play to resume or reset.`;
  } else {
    status.textContent = 'Tap play to start pacer.';
  }

  if (pacePacer.active && !pacePacer.rafId) {
    pacePacer.rafId = requestAnimationFrame((nextNow) => {
      pacePacer.rafId = 0;
      updatePacePacerDisplay(nextNow);
    });
  }
}

function startPacePacer() {
  const goalSeconds = toSeconds(state.cardio.value);
  if (state.cardio.exempt || state.cardio.event !== 'two-mile-run' || !Number.isFinite(goalSeconds) || goalSeconds <= 0) return;
  const now = performance.now();
  if (pacePacer.active) return;

  if (pacePacer.goalSeconds !== goalSeconds || pacePacer.finished) {
    resetPacePacer(goalSeconds);
  }

  pacePacer.goalSeconds = goalSeconds;
  pacePacer.active = true;
  pacePacer.finished = false;
  pacePacer.startedAt = now;
  void paceAudioController.start(goalSeconds, paceAudioSettings);
  updatePacePacerDisplay(now);
}

function pausePacePacer() {
  if (!pacePacer.active) return;
  const now = performance.now();
  pacePacer.elapsedMs = currentPacePacerElapsedMs(now);
  pacePacer.active = false;
  paceAudioController.pause();
  cancelPacePacerFrame();
  updatePacePacerDisplay(now);
}

function resetVisiblePacePacer() {
  const goalSeconds = toSeconds(state.cardio.value);
  resetPacePacer(Number.isFinite(goalSeconds) && goalSeconds > 0 ? goalSeconds : null);
  updatePacePacerDisplay();
}

function handlePacePacerControl(action) {
  if (action === 'pause') {
    pausePacePacer();
    return;
  }
  if (action === 'reset') {
    resetVisiblePacePacer();
    return;
  }
  startPacePacer();
}

function syncPacePacerForGoal(goalSeconds) {
  if (pacePacer.goalSeconds !== null && pacePacer.goalSeconds !== goalSeconds) {
    resetPacePacer(goalSeconds);
  } else if (pacePacer.goalSeconds === null) {
    pacePacer.goalSeconds = goalSeconds;
  }
  updatePacePacerDisplay();
}

// PACE PLAN LOCKED: User approved this visual. Do not redesign. Only move/retheme.
function renderPacePlan(previousCourseMode = null) {
  const lapDisplay = byId('run-lap-times');
  if (!lapDisplay) return;
  const section = lapDisplay.closest('.pace-plan-section');
  if (state.cardio.exempt || state.cardio.event !== 'two-mile-run') {
    resetPacePacer(null);
    lapDisplay.innerHTML = '';
    if (section) section.hidden = true;
    return;
  }
  const curSec = toSeconds(state.cardio.value);
  if (!Number.isFinite(curSec) || curSec <= 0) {
    resetPacePacer(null);
    lapDisplay.innerHTML = '';
    if (section) section.hidden = true;
    return;
  }
  if (section) section.hidden = false;
  const currentCourseMode = normalizePacerAudioSettings(paceAudioSettings).courseMode;
  const previousCourse = previousCourseMode
    || lapDisplay.querySelector('.lap-fitness')?.dataset.course
    || currentCourseMode;
  lapDisplay.innerHTML = formatPacePlan(curSec, 8, Math.round(curSec / 8), previousCourse);
  syncPacePacerForGoal(curSec);
  updatePaceAudioStatus();
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
    const C = 2 * Math.PI * 64; // circumference for r=64
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
    if (bodyTxtP) bodyTxtP.textContent = 'Score: EXEMPT';
    return;
  }

  if (whtrControls) whtrControls.hidden = false;
  if (bodyTxtP) bodyTxtP.textContent = `Score: ${scores.body} | Pass ≤ 0.55`;

  syncWhtrMeasurementInputs();

  const whtrInput = byId('pfra-whtr');
  if (whtrInput) whtrInput.value = state.whtr;
}

function renderStrengthEditor(scores) {
  const pushTxtP = byId('push-txt-p');

  if (state.strength.exempt) {
    if (pushTxtP) pushTxtP.textContent = 'Score: EXEMPT';
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
    pushTxtP.textContent = `Score: ${scores.strength} | Min: ${minVal ?? '--'} | Max: ${maxVal ?? '--'}`;
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
    if (sitTxtP) sitTxtP.textContent = 'Score: EXEMPT';
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
      sitTxtP.textContent = `Score: ${scores.core} | Min: ${minVal ?? '--'} | Max: ${maxVal ?? '--'}`;
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
      sitTxtP.textContent = `Score: ${scores.core} | Min: ${minVal ?? '--'} | Max: ${maxVal ?? '--'}`;
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
  const parts = hamrLevelParts(totalShuttles);
  return parts ? `Level: ${parts.level} | Shuttle: ${parts.shuttle}` : '';
}

function renderCardioEditor(scores) {
  const runTxtP = byId('run-txt-p');

  if (state.cardio.exempt) {
    if (runTxtP) runTxtP.textContent = 'Score: EXEMPT';
    const tick = byId('run-tick');
    if (tick) tick.style.display = 'none';
    return;
  }

  if (state.cardio.event === 'two-kilometer-walk') {
    const maxTime = walkMaximumTime(standards, state.ageGroup, state.sex);
    if (runTxtP) runTxtP.textContent = `Score: ${scores.cardio} | Max Time: ${maxTime ?? '--'}`;
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
      runTxtP.textContent = `Score: ${scores.cardio} | Min: ${minVal ?? '--'} | Max: ${maxVal ?? '--'}`;
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
    runTxtP.textContent = `Score: ${scores.cardio} | Min: ${minVal ?? '--'} | Max: ${maxVal ?? '--'}`;
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

  // --- Pace plan personal pacer ---

  byId('run-lap-times')?.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    const startTarget = event.target.closest('[data-pacer-start]');
    if (startTarget) {
      handlePacePacerControl('start');
      return;
    }
    const secondaryTarget = event.target.closest('[data-pacer-secondary]');
    if (secondaryTarget instanceof HTMLElement || secondaryTarget instanceof SVGElement) {
      handlePacePacerControl(secondaryTarget.dataset.pacerAction || 'pause');
    }
  });

  byId('run-lap-times')?.addEventListener('keydown', (event) => {
    if (!(event.target instanceof Element) || (event.key !== 'Enter' && event.key !== ' ')) return;
    const startTarget = event.target.closest('[data-pacer-start]');
    const secondaryTarget = event.target.closest('[data-pacer-secondary]');
    if (!startTarget && !secondaryTarget) return;
    event.preventDefault();
    if (startTarget) {
      handlePacePacerControl('start');
      return;
    }
    if (secondaryTarget instanceof HTMLElement || secondaryTarget instanceof SVGElement) {
      handlePacePacerControl(secondaryTarget.dataset.pacerAction || 'pause');
    }
  });

  byId('run-lap-times')?.addEventListener('change', (event) => {
    const target = event.target instanceof Element ? event.target.closest('[data-pacer-audio-field]') : null;
    if (!target) return;
    applyPaceAudioSettings(readPaceAudioSettingsFromControls());
  });

  byId('run-lap-times')?.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest('[data-pacer-audio-test]') : null;
    if (!target) return;
    const goalSeconds = currentPaceGoalSeconds() ?? 840;
    void paceAudioController.testCue({ ...paceAudioSettings, enabled: true }, goalSeconds);
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

  byId('chart-reference-btn')?.addEventListener('click', openCurrentScoreReference);

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
    if (window.afptPwa?.showInstallHelp) {
      window.afptPwa.showInstallHelp({ promptIfAvailable: true });
      return;
    }
    byId('install-modal')?.removeAttribute('hidden');
  });
  bindMenuClick('pwa-update-check', () => {
    window.afptPwa?.checkForUpdates?.();
  });
  bindMenuClick('dev-version-menu', () => {
    const modal = byId('dev-version-modal');
    const textEl = byId('dev-version-text');
    if (textEl) {
      textEl.innerHTML = `<p>This is a developmental build for testing. It is not the final production release.</p>
        <dl>
          <dt>Status</dt><dd>Developmental build</dd>
          <dt>Generated</dt><dd>Loading build metadata...</dd>
        </dl>`;
      fetch('./dev-build-info.json')
        .then((r) => r.json())
        .then((info) => {
          const generatedAt = info.generatedAt
            ? new Date(info.generatedAt).toLocaleString()
            : 'Unavailable';
          textEl.innerHTML = `<p>This is a developmental build for testing. It is not the final production release.</p>
            <dl>
              <dt>Status</dt><dd>Developmental build</dd>
              <dt>Generated</dt><dd>${generatedAt}</dd>
            </dl>`;
        })
        .catch(() => {
          textEl.innerHTML = `<p>This is a developmental build for testing. Build metadata is unavailable.</p>
            <dl><dt>Status</dt><dd>Developmental build</dd></dl>`;
        });
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
  getPacerAudioSettings: () => ({ ...paceAudioSettings }),
  getPacerAudioDebug: () => paceAudioController.getDebugState(),
};
