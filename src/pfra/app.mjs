import { legacyAgeToPfraAgeGroup, legacySexToPfraSex } from './state.mjs';

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

function readAltitudeGroup(val) {
  if (!val || val === 'Altitude Adjust') return 0;
  if (val.startsWith('Group 1')) return 1;
  if (val.startsWith('Group 2')) return 2;
  if (val.startsWith('Group 3')) return 3;
  if (val.startsWith('Group 4')) return 4;
  return 0;
}

function readStrengthEvent(pfraVal) {
  const map = { 'push-up': 'push-up', 'hand-release-push-up': 'hand-release-push-up' };
  return map[pfraVal] || 'push-up';
}

function readCoreEvent(pfraVal) {
  const map = { 'sit-up': 'sit-up', 'cross-leg-reverse-crunch': 'cross-leg-reverse-crunch', 'forearm-plank': 'forearm-plank' };
  return map[pfraVal] || 'sit-up';
}

function readCardioEvent(pfraVal) {
  const map = { 'two-mile-run': 'two-mile-run', 'hamr-20-meter': 'hamr-20-meter', 'two-kilometer-walk': 'two-kilometer-walk' };
  return map[pfraVal] || 'two-mile-run';
}

function byId(id) {
  return document.getElementById(id);
}

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
      event: readStrengthEvent(strengthEventEl?.value),
      value: strengthPerfEl?.value || '67',
      exempt: pushSel?.value === 'Exempt',
    },
    core: {
      event: readCoreEvent(coreEventEl?.value),
      value: corePerfEl?.value || '58',
      exempt: sitSel?.value === 'Exempt',
    },
    cardio: {
      event: readCardioEvent(cardioEventEl?.value),
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

refreshStateFromDom();

window.afptApp = { getState, refreshStateFromDom, dispatch };
