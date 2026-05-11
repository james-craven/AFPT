import { legacyAgeToPfraAgeGroup, legacySexToPfraSex } from './state.mjs';
import { loadPfraStandards, walkMaximumTime } from './standards.mjs';
import {
  applyHamrAltitudeAdjustment,
  applyRunAltitudeAdjustment,
  applyWalkAltitudeAdjustment,
  pfraAgeToWalkAgeGroup,
  scorePfraAssessment,
  secondsToTimeString,
  toSeconds,
} from './scoring.mjs';

// --- State ---

const defaultState = {
  sex: 'female',
  ageGroup: 'under-25',
  whtr: '0.49',
  altitudeGroup: 0,
  strength: { event: 'push-up', value: '67', exempt: false },
  core: { event: 'sit-up', value: '58', exempt: false },
  cardio: { event: 'two-mile-run', value: '13:25', exempt: false },
  selectedComponent: 'strength',
};

let state = { ...defaultState, strength: { ...defaultState.strength }, core: { ...defaultState.core }, cardio: { ...defaultState.cardio } };

// --- Standards/tables (loaded async) ---

let standards = null;
let tables = {};
let altitudeTables = {};
let loadError = null;
let ready = false;

// --- Helpers ---

function readAltitudeGroup(val) {
  if (!val || val === 'Altitude Adjust') return 0;
  if (val.startsWith('Group 1')) return 1;
  if (val.startsWith('Group 2')) return 2;
  if (val.startsWith('Group 3')) return 3;
  if (val.startsWith('Group 4')) return 4;
  return 0;
}

function byId(id) {
  return document.getElementById(id);
}

// --- State readers ---

function refreshStateFromDom() {
  const sexEl = byId('sex-sel');
  const ageEl = byId('age-sel');
  const whtrEl = byId('pfra-whtr');
  const altEl = byId('alt-select');
  const strengthEventEl = byId('pfra-strength-event');
  const strengthPerfEl = byId('pfra-strength-performance');
  const pushSel = byId('push-sel');
  const coreEventEl = byId('pfra-core-event');
  const corePerfEl = byId('pfra-core-performance');
  const sitSel = byId('sit-sel');
  const cardioEventEl = byId('pfra-cardio-event');
  const cardioPerfEl = byId('pfra-cardio-performance');
  const cardioSel = byId('cardio-sel');

  state = {
    sex: legacySexToPfraSex(sexEl?.value || 'Female'),
    ageGroup: legacyAgeToPfraAgeGroup(ageEl?.value || '< 25') || 'under-25',
    whtr: whtrEl?.value || '0.49',
    altitudeGroup: readAltitudeGroup(altEl?.value),
    strength: {
      event: strengthEventEl?.value || 'push-up',
      value: strengthPerfEl?.value || '67',
      exempt: pushSel?.value === 'Exempt',
    },
    core: {
      event: coreEventEl?.value || 'sit-up',
      value: corePerfEl?.value || '58',
      exempt: sitSel?.value === 'Exempt',
    },
    cardio: {
      event: cardioEventEl?.value || 'two-mile-run',
      value: cardioPerfEl?.value || '13:25',
      exempt: cardioSel?.value === 'Exempt',
    },
    selectedComponent: window.afptComponentEditor?.getSelectedComponent?.() || 'strength',
  };
}

function getState() {
  return {
    ...state,
    strength: { ...state.strength },
    core: { ...state.core },
    cardio: { ...state.cardio },
  };
}

// --- Dispatch (internal state only, no DOM) ---

function dispatch(action) {
  switch (action.type) {
    case 'SET_SEX':
      state = { ...state, sex: action.sex };
      break;
    case 'SET_AGE_GROUP':
      state = { ...state, ageGroup: action.ageGroup };
      break;
    case 'SET_WHTR':
      state = { ...state, whtr: action.value };
      break;
    case 'SET_ALTITUDE_GROUP':
      state = { ...state, altitudeGroup: action.group };
      break;
    case 'SET_STRENGTH_EVENT':
      state = { ...state, strength: { ...state.strength, event: action.event } };
      break;
    case 'SET_STRENGTH_VALUE':
      state = { ...state, strength: { ...state.strength, value: action.value } };
      break;
    case 'SET_STRENGTH_EXEMPT':
      state = { ...state, strength: { ...state.strength, exempt: action.exempt } };
      break;
    case 'SET_CORE_EVENT':
      state = { ...state, core: { ...state.core, event: action.event } };
      break;
    case 'SET_CORE_VALUE':
      state = { ...state, core: { ...state.core, value: action.value } };
      break;
    case 'SET_CORE_EXEMPT':
      state = { ...state, core: { ...state.core, exempt: action.exempt } };
      break;
    case 'SET_CARDIO_EVENT':
      state = { ...state, cardio: { ...state.cardio, event: action.event } };
      break;
    case 'SET_CARDIO_VALUE':
      state = { ...state, cardio: { ...state.cardio, value: action.value } };
      break;
    case 'SET_CARDIO_EXEMPT':
      state = { ...state, cardio: { ...state.cardio, exempt: action.exempt } };
      break;
    case 'SET_SELECTED_COMPONENT':
      state = { ...state, selectedComponent: action.component };
      break;
    default:
      break;
  }
}

// --- Shadow scoring ---

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
    whtr: s.whtr,
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

function getScoreResult() {
  return computeScoreFromState(state);
}

function refreshScoreFromDom() {
  refreshStateFromDom();
  return computeScoreFromState(state);
}

function isReady() {
  return ready;
}

function getLoadError() {
  return loadError;
}

// --- Standards loading ---

async function loadData() {
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
  } catch (err) {
    loadError = err.message;
  }
}

// --- Init ---

refreshStateFromDom();
loadData();

window.afptApp = {
  getState,
  refreshStateFromDom,
  dispatch,
  getScoreResult,
  refreshScoreFromDom,
  isReady,
  getLoadError,
};
