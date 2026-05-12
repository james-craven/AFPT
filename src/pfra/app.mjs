import { loadPfraStandards, walkMaximumTime } from './standards.mjs';
import {
  applyHamrAltitudeAdjustment,
  applyRunAltitudeAdjustment,
  applyWalkAltitudeAdjustment,
  categoryForTotal,
  firstScoringCellValue,
  pfraAgeToWalkAgeGroup,
  scorePfraAssessment,
  secondsToTimeString,
  toSeconds,
  topCellValue,
} from './scoring.mjs';
import { eventDefaults } from './state.mjs';

// --- State ---

const defaultCardioValue = '20:00'; // fallback before tables load

let state = {
  sex: 'female',
  ageGroup: 'under-25',
  whtr: '0.49',
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

// Returns the lowest valid scoring value for a cardio event given current sex/age.
// Used at init and on event change so sliders never start out of range.
function lowestCardioDefault(event, ageGroup, sex) {
  if (event === 'two-kilometer-walk') return eventDefaults['two-kilometer-walk'] || defaultCardioValue;
  const t = tables[event];
  if (t) {
    const v = firstScoringCellValue(t, ageGroup, sex);
    if (v !== undefined) return String(v);
  }
  return event === 'hamr-20-meter' ? '40' : defaultCardioValue;
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

function generateScoreChart(component) {
  if (!ready) return '<p class="chart-empty">Standards not yet loaded.</p>';

  const componentState = state[component];
  if (!componentState) return '<p class="chart-empty">Unknown component.</p>';
  if (componentState.exempt) return '<p class="chart-empty">Component is exempt — no scoring table applies.</p>';

  const event = componentState.event;

  if (event === 'two-kilometer-walk') {
    const maxTime = walkMaximumTime(standards, state.ageGroup, state.sex);
    return `<p class="chart-empty">Walk is pass/fail. Max time for your group: <strong>${maxTime ?? '--'}</strong></p>`;
  }

  const table = tables[event];
  if (!table) return `<p class="chart-empty">No chart available for ${event}.</p>`;

  const { ageGroup, sex } = state;
  const result = computeScoreFromState(state);
  const currentPoints = result?.scores?.[component] ?? -1;
  const isTime = table.unit === 'min:sec';
  const colHeader = isTime ? 'Time' : 'Reps';

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
    const isYou = pts === currentPoints;
    const youTag = isYou ? ' <span class="chart-you">&#9664; YOU</span>' : '';
    rows += `<tr class="${isYou ? 'chart-row--you' : ''}"><td class="chart-cell chart-cell--perf">${displayVal}${youTag}</td><td class="chart-cell chart-cell--score">${pts}</td><td class="chart-cell chart-cell--tier ${tierCls}">${tier}</td></tr>`;
  }

  const ageFmt = ageGroup.replace('under-', '< ').replace('-and-over', '+').replace('-', '–');
  return `<p class="chart-meta">${sex === 'male' ? 'Male' : 'Female'} &middot; Age ${ageFmt}</p><table class="chart-table"><thead><tr><th class="chart-th">${colHeader}</th><th class="chart-th">Pts</th><th class="chart-th">Tier</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function openChart(component, title) {
  const modal = byId('modal');
  if (!modal) return;
  const titleEl = byId('chart-drawer-title');
  if (titleEl) titleEl.textContent = title || 'Score Chart';
  const contentEl = byId('chart-content');
  if (contentEl) {
    contentEl.innerHTML = component
      ? generateScoreChart(component)
      : '<p class="chart-empty">Reference charts are not available in this build.</p>';
  }
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
  if (state.cardio.exempt || state.cardio.event !== 'two-mile-run') {
    lapDisplay.innerHTML = '<p class="pace-plan-empty">Select 2-mile run to view lap pace plan.</p>';
    return;
  }
  const curSec = toSeconds(state.cardio.value);
  if (!Number.isFinite(curSec) || curSec <= 0) {
    lapDisplay.innerHTML = '<p class="pace-plan-empty">Enter a run time to see lap splits.</p>';
    return;
  }
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
  tick.style.left = `calc(10px + ${(clamped / 100).toFixed(4)} * (100% - 20px))`;
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
  if (ringNum) ringNum.textContent = Number.isInteger(total) ? String(total) : total.toFixed(1);
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
    if (bodyTxtP) bodyTxtP.textContent = 'Body Score: EXEMPT';
    return;
  }

  if (whtrControls) whtrControls.hidden = false;
  if (bodyTxtP) bodyTxtP.textContent = `Body Score: ${scores.body} | Pass ≤ 0.55`;

  const whtrNum = parseFloat(state.whtr);
  const slider = byId('whtr-slider');
  if (slider && Number.isFinite(whtrNum)) {
    slider.value = String(Math.round(whtrNum * 100));
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

    const slider = byId('run-slider');
    if (slider && Number.isFinite(minNum) && Number.isFinite(maxNum) && maxNum > 0) {
      slider.min = '0';
      slider.max = String(maxNum);
      const curVal = Number(state.cardio.value);
      if (Number.isFinite(curVal)) slider.value = String(Math.max(0, Math.min(maxNum, curVal)));
      setTickPct('run-tick', (minNum / maxNum) * 100, minNum);
    } else {
      const tick = byId('run-tick');
      if (tick) tick.style.display = 'none';
    }
    return;
  }

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

// --- Event bindings ---

function bindEvents() {
  // Demographics
  byId('sex-sel')?.addEventListener('change', () => {
    dispatch({ type: 'SET_SEX', sex: byId('sex-sel').value });
    render();
  });

  byId('age-sel')?.addEventListener('change', () => {
    dispatch({ type: 'SET_AGE_GROUP', ageGroup: byId('age-sel').value });
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

  byId('whtr-slider')?.addEventListener('input', () => {
    const whtrStr = (Number(val('whtr-slider')) / 100).toFixed(2);
    dispatch({ type: 'SET_WHTR', value: whtrStr });
    const txt = byId('pfra-whtr');
    if (txt) txt.value = whtrStr;
    render();
  });

  byId('alt-select')?.addEventListener('change', () => {
    dispatch({ type: 'SET_ALTITUDE_GROUP', group: readAltitudeGroup(val('alt-select')) });
    render();
  });

  // --- Strength ---

  byId('push-sel')?.addEventListener('change', () => {
    const sv = byId('push-sel').value;
    if (sv === 'exempt') {
      dispatch({ type: 'SET_STRENGTH_EXEMPT', exempt: true });
    } else {
      dispatch({ type: 'SET_STRENGTH_EXEMPT', exempt: false });
      dispatch({ type: 'SET_STRENGTH_EVENT', event: sv });
      const def = eventDefaults[sv] || '0';
      const pushTxt = byId('push-txt');
      if (pushTxt) pushTxt.value = def;
      dispatch({ type: 'SET_STRENGTH_VALUE', value: def });
    }
    render();
  });

  byId('push-txt')?.addEventListener('input', () => {
    const v = val('push-txt');
    dispatch({ type: 'SET_STRENGTH_VALUE', value: v });
    const slider = byId('push-slider');
    if (slider) slider.value = v;
    render();
  });

  byId('push-slider')?.addEventListener('input', () => {
    const v = val('push-slider');
    dispatch({ type: 'SET_STRENGTH_VALUE', value: v });
    const txt = byId('push-txt');
    if (txt) txt.value = v;
    render();
  });

  byId('push-tick')?.addEventListener('click', () => {
    const tick = byId('push-tick');
    const minVal = tick?.dataset.minValue;
    if (minVal !== undefined) {
      dispatch({ type: 'SET_STRENGTH_VALUE', value: minVal });
      const txt = byId('push-txt');
      if (txt) txt.value = minVal;
      const slider = byId('push-slider');
      if (slider) slider.value = minVal;
      render();
    }
  });

  // --- Core ---

  byId('sit-sel')?.addEventListener('change', () => {
    const sv = byId('sit-sel').value;
    if (sv === 'exempt') {
      dispatch({ type: 'SET_CORE_EXEMPT', exempt: true });
    } else {
      dispatch({ type: 'SET_CORE_EXEMPT', exempt: false });
      dispatch({ type: 'SET_CORE_EVENT', event: sv });
      const def = eventDefaults[sv] || '0';
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
    const slider = byId('sit-slider');
    if (slider) slider.value = v;
    render();
  });

  byId('sit-slider')?.addEventListener('input', () => {
    const v = val('sit-slider');
    if (state.core.event === 'forearm-plank') {
      const timeStr = secondsToTimeString(Number(v));
      dispatch({ type: 'SET_CORE_VALUE', value: timeStr });
      const parts = timeStr.split(':');
      const minEl = byId('sit-txt-plank');
      const secEl = byId('plankmintxt');
      if (minEl) minEl.value = parts[0];
      if (secEl) secEl.value = parts[1];
    } else {
      dispatch({ type: 'SET_CORE_VALUE', value: v });
      const txt = byId('sit-txt');
      if (txt) txt.value = v;
    }
    render();
  });

  const updatePlankTime = () => {
    const m = val('sit-txt-plank') || '0';
    const s = val('plankmintxt') || '00';
    const timeStr = `${m}:${s.padStart(2, '0')}`;
    dispatch({ type: 'SET_CORE_VALUE', value: timeStr });
    const slider = byId('sit-slider');
    const sec = toSeconds(timeStr);
    if (slider && Number.isFinite(sec)) slider.value = String(sec);
    render();
  };

  byId('sit-txt-plank')?.addEventListener('input', updatePlankTime);
  byId('plankmintxt')?.addEventListener('input', updatePlankTime);

  byId('sit-tick')?.addEventListener('click', () => {
    const tick = byId('sit-tick');
    const minVal = tick?.dataset.minValue;
    if (minVal !== undefined) {
      if (state.core.event === 'forearm-plank') {
        const timeStr = secondsToTimeString(Number(minVal));
        dispatch({ type: 'SET_CORE_VALUE', value: timeStr });
        const parts = timeStr.split(':');
        const minEl = byId('sit-txt-plank');
        const secEl = byId('plankmintxt');
        if (minEl) minEl.value = parts[0];
        if (secEl) secEl.value = parts[1];
        const slider = byId('sit-slider');
        if (slider) slider.value = minVal;
      } else {
        dispatch({ type: 'SET_CORE_VALUE', value: minVal });
        const txt = byId('sit-txt');
        if (txt) txt.value = minVal;
        const slider = byId('sit-slider');
        if (slider) slider.value = minVal;
      }
      render();
    }
  });

  // --- Cardio ---

  byId('cardio-sel')?.addEventListener('change', () => {
    const sv = byId('cardio-sel').value;
    if (sv === 'exempt') {
      dispatch({ type: 'SET_CARDIO_EXEMPT', exempt: true });
    } else {
      dispatch({ type: 'SET_CARDIO_EXEMPT', exempt: false });
      dispatch({ type: 'SET_CARDIO_EVENT', event: sv });
      const def = lowestCardioDefault(sv, state.ageGroup, state.sex);
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

  const updateRunTime = () => {
    const m = val('run-mintxt') || '0';
    const s = val('run-sectxt') || '00';
    const timeStr = `${m}:${s.padStart(2, '0')}`;
    dispatch({ type: 'SET_CARDIO_VALUE', value: timeStr });
    const slider = byId('run-slider');
    const sec = toSeconds(timeStr);
    if (slider && Number.isFinite(sec)) slider.value = String(sec);
    render();
  };

  byId('run-mintxt')?.addEventListener('input', updateRunTime);
  byId('run-sectxt')?.addEventListener('input', updateRunTime);

  byId('run-shuttle-txt')?.addEventListener('input', () => {
    const v = val('run-shuttle-txt');
    dispatch({ type: 'SET_CARDIO_VALUE', value: v });
    const slider = byId('run-slider');
    if (slider) slider.value = v;
    render();
  });

  byId('run-slider')?.addEventListener('input', () => {
    const v = val('run-slider');
    if (state.cardio.event === 'hamr-20-meter') {
      dispatch({ type: 'SET_CARDIO_VALUE', value: v });
      const txt = byId('run-shuttle-txt');
      if (txt) txt.value = v;
    } else {
      const timeStr = secondsToTimeString(Number(v));
      dispatch({ type: 'SET_CARDIO_VALUE', value: timeStr });
      const parts = timeStr.split(':');
      const minEl = byId('run-mintxt');
      const secEl = byId('run-sectxt');
      if (minEl) minEl.value = parts[0];
      if (secEl) secEl.value = parts[1];
    }
    render();
  });

  byId('run-tick')?.addEventListener('click', () => {
    const tick = byId('run-tick');
    const minVal = tick?.dataset.minValue;
    if (minVal !== undefined) {
      if (state.cardio.event === 'hamr-20-meter') {
        dispatch({ type: 'SET_CARDIO_VALUE', value: minVal });
        const txt = byId('run-shuttle-txt');
        if (txt) txt.value = minVal;
        const slider = byId('run-slider');
        if (slider) slider.value = minVal;
      } else {
        const timeStr = secondsToTimeString(Number(minVal));
        dispatch({ type: 'SET_CARDIO_VALUE', value: timeStr });
        const parts = timeStr.split(':');
        const minEl = byId('run-mintxt');
        const secEl = byId('run-sectxt');
        if (minEl) minEl.value = parts[0];
        if (secEl) secEl.value = parts[1];
        const slider = byId('run-slider');
        if (slider) slider.value = minVal;
      }
      render();
    }
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
  // Single delegated handler. Inverts step for visually-flipped time sliders.

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.slider-step-btn');
    if (!btn) return;
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
  });

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

  // --- Chart close ---

  byId('close-btn')?.addEventListener('click', closeChart);
  byId('chart-drawer-scrim')?.addEventListener('click', closeChart);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !byId('modal')?.hasAttribute('hidden')) closeChart();
  });

  // --- Settings menu items ---

  bindMenuClick('run-adjust-chart', () => {
    openChart(null, 'Run Altitude Adjustment');
  });
  bindMenuClick('walk-adjust-chart', () => {
    openChart(null, 'Walk Altitude Adjustment');
  });
  bindMenuClick('shuttle-score-card', () => {
    openChart(null, 'Shuttle Score Card');
  });
  bindMenuClick('shuttle-audio-menu', () => {
    const player = byId('shuttle-audio-player');
    if (player) player.style.visibility = 'visible';
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
    // After tables load, set cardio to lowest valid scoring default for initial sex/age
    const def = lowestCardioDefault(state.cardio.event, state.ageGroup, state.sex);
    dispatch({ type: 'SET_CARDIO_VALUE', value: def });
    if (state.cardio.event === 'hamr-20-meter') {
      const shuttleTxt = byId('run-shuttle-txt');
      if (shuttleTxt) shuttleTxt.value = def;
    } else if (state.cardio.event !== 'two-kilometer-walk') {
      const parts = def.split(':');
      const minEl = byId('run-mintxt');
      const secEl = byId('run-sectxt');
      if (minEl) minEl.value = parts[0] || '0';
      if (secEl) secEl.value = (parts[1] || '00').padStart(2, '0');
    }
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
