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

const defaultCardioValue = '20:00';

let state = {
  sex: 'female',
  ageGroup: 'under-25',
  whtr: '0.49',
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

  state = {
    sex: byId('sex-sel')?.value || 'female',
    ageGroup: byId('age-sel')?.value || 'under-25',
    whtr: val('pfra-whtr') || '0.49',
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
      ? secondsToTimeString(Number(rawVal))
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

// --- Lap display variants ---

function formatLapTimesTactical(lapCount, lapSec) {
  const lapLabel = lapCount === 8 ? '8 × 400m' : `${lapCount} laps`;
  const lapTimeStr = secondsToTimeString(lapSec);
  const barPct = Math.min(95, Math.max(30, ((480 - lapSec) / 200) * 80 + 30)).toFixed(1);
  let rows = '';
  for (let i = 1; i <= lapCount; i++) {
    rows += `<div class="lap-hud-row"><span class="lap-hud-n">${i}</span><span class="lap-hud-pace">${lapTimeStr}</span><span class="lap-hud-split">${secondsToTimeString(lapSec * i)}</span><div class="lap-hud-bar"><div class="lap-hud-bar-fill" style="width:${barPct}%"></div></div></div>`;
  }
  return `<div class="lap-hud"><div class="lap-hud-header"><span class="lap-hud-title">PACE PLAN</span><span class="lap-hud-sub">${lapLabel} &middot; ${lapTimeStr}/lap</span></div><div class="lap-hud-rows">${rows}</div></div>`;
}

// formatLapTimesFitness — direct translation of mock-fitness.jsx lap plan section.
// SVG params exactly match the mock: viewBox 0 0 340 190, rect x=70 y=50 w=200 h=90 rx=45.
function formatLapTimesFitness(totalSeconds, lapCount, lapSec) {
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
    const labelFill = isFinish ? '#ffb547' : 'rgba(255,255,255,0.55)';
    const splitWeight = isFinish ? 800 : 600;
    const dotR = isFinish ? 7 : 4.5;
    const dotFill = isFinish ? 'url(#finGrad)' : '#fff';
    const dotStroke = isFinish ? ' stroke="rgba(255,255,255,0.4)" stroke-width="1.5"' : '';
    const finText = isFinish
      ? `<text x="${p.x.toFixed(1)}" y="${(p.y + 0.5).toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-size="6" font-weight="800" fill="#2b1456" letter-spacing="0.5">FIN</text>`
      : '';
    markers += `<g>
      <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${dotR}" fill="${dotFill}"${dotStroke}/>
      ${finText}
      <text x="${(lp.x + dx).toFixed(1)}" y="${(lp.y - 4).toFixed(1)}" text-anchor="${anchor}" font-size="8" fill="${labelFill}" letter-spacing="1" font-weight="600">${labelText}</text>
      <text x="${(lp.x + dx).toFixed(1)}" y="${(lp.y + 7).toFixed(1)}" text-anchor="${anchor}" font-size="11" fill="#fff" font-weight="${splitWeight}" font-variant-numeric="tabular-nums">${splitStr}</text>
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
          <linearGradient id="finGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#ffb547"/>
            <stop offset="1" stop-color="#ff5dab"/>
          </linearGradient>
        </defs>
        <rect x="70" y="50" width="200" height="90" rx="45" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="14"/>
        <rect x="70" y="50" width="200" height="90" rx="45" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="1" stroke-dasharray="2 6"/>
        <text x="170" y="87" text-anchor="middle" fill="rgba(255,255,255,0.5)" font-size="9" letter-spacing="2">GOAL</text>
        <text x="170" y="113" text-anchor="middle" fill="#fff" font-size="26" font-weight="800" letter-spacing="-0.5" font-variant-numeric="tabular-nums">${totalStr}</text>
        ${markers}
      </svg>
    </div>
  </div>`;
}

function formatLapTimesBlues(totalSeconds, lapCount, lapSec) {
  const lapLabel = lapCount === 8 ? '8 × 400m' : `${lapCount} laps`;
  const lapTimeStr = secondsToTimeString(lapSec);
  let rows = '';
  for (let i = 1; i <= lapCount; i++) {
    const alt = i % 2 === 0 ? ' class="lap-table-row--alt"' : '';
    rows += `<tr${alt}><td>${i}</td><td>${lapTimeStr}</td><td>${secondsToTimeString(lapSec * i)}</td></tr>`;
  }
  return `<div class="lap-table-wrap"><div class="lap-table-header">Lap targets <span>${lapLabel} &rarr; ${secondsToTimeString(totalSeconds)}</span></div><table class="lap-table"><thead><tr><th>LAP</th><th>PACE</th><th>SPLIT</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function formatLapTimesStencil(totalSeconds, lapCount, lapSec) {
  const lapLabel = lapCount === 8 ? '8 × 400m' : `${lapCount} laps`;
  const lapTimeStr = secondsToTimeString(lapSec);
  const barPct = Math.min(90, Math.max(20, ((600 - lapSec) / 300) * 70 + 20)).toFixed(1);
  let bars = '';
  for (let i = 1; i <= lapCount; i++) {
    bars += `<div class="lap-bar-col"><span class="lap-bar-pace">${lapTimeStr}</span><div class="lap-bar-track"><div class="lap-bar-fill" style="height:${barPct}%"></div></div><span class="lap-bar-index">L${i}</span></div>`;
  }
  const splits = Array.from({ length: lapCount }, (_, i) => `<span>L${i + 1}: ${secondsToTimeString(lapSec * (i + 1))}</span>`).join('');
  return `<div class="lap-bars"><div class="lap-bars-header">PACE PLAN &middot; ${lapLabel} &middot; ${lapTimeStr}/lap</div><div class="lap-bars-chart">${bars}</div><div class="lap-bars-splits">${splits}</div></div>`;
}

function formatLapTimesLight(totalSeconds, lapCount, lapSec) {
  const lapLabel = lapCount === 8 ? '8 × 400m' : `${lapCount} laps`;
  const lapTimeStr = secondsToTimeString(lapSec);
  const barPct = Math.min(92, Math.max(25, ((480 - lapSec) / 240) * 67 + 25)).toFixed(1);
  let rows = '';
  for (let i = 1; i <= lapCount; i++) {
    const sep = i < lapCount ? ' lap-row--sep' : '';
    rows += `<div class="lap-row${sep}"><span class="lap-row-n">${i}</span><span class="lap-row-pace">${lapTimeStr}</span><div class="lap-row-bar"><div class="lap-row-bar-fill" style="width:${barPct}%"></div></div><span class="lap-row-split">${secondsToTimeString(lapSec * i)}</span></div>`;
  }
  return `<div class="lap-rows-wrap"><div class="lap-rows-header">Lap targets <span>${lapLabel} &rarr; ${secondsToTimeString(totalSeconds)}</span></div>${rows}</div>`;
}

function formatLapTimes(totalSeconds, lapCount) {
  if (!totalSeconds || !lapCount) return '';
  const lapSec = Math.round(totalSeconds / lapCount);
  const theme = document.documentElement.dataset.theme || 'tactical';
  if (theme === 'fitness') return formatLapTimesFitness(totalSeconds, lapCount, lapSec);
  if (theme === 'blues') return formatLapTimesBlues(totalSeconds, lapCount, lapSec);
  if (theme === 'stencil') return formatLapTimesStencil(totalSeconds, lapCount, lapSec);
  if (theme === 'light') return formatLapTimesLight(totalSeconds, lapCount, lapSec);
  return formatLapTimesTactical(lapCount, lapSec);
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
  const chipStr = byId('chip-strength-value');
  if (chipStr) chipStr.textContent = state.strength.exempt ? 'EX' : (state.strength.value || '--');

  const chipCore = byId('chip-core-value');
  if (chipCore) chipCore.textContent = state.core.exempt ? 'EX' : (state.core.value || '--');

  const chipCardio = byId('chip-cardio-value');
  if (chipCardio) chipCardio.textContent = state.cardio.exempt ? 'EX' : (state.cardio.value || '--');
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
  const lapDisplay = byId('run-lap-times');

  if (state.cardio.exempt) {
    if (runTxtP) runTxtP.textContent = 'Cardio Score: EXEMPT';
    if (lapDisplay) lapDisplay.innerHTML = '';
    const tick = byId('run-tick');
    if (tick) tick.style.display = 'none';
    return;
  }

  if (state.cardio.event === 'two-kilometer-walk') {
    const maxTime = walkMaximumTime(standards, state.ageGroup, state.sex);
    if (runTxtP) runTxtP.textContent = `Cardio Score: ${scores.cardio} | Max Time: ${maxTime ?? '--'}`;
    if (lapDisplay) lapDisplay.innerHTML = '';
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
    if (lapDisplay) lapDisplay.innerHTML = '';

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

  if (lapDisplay) {
    const curSec = toSeconds(state.cardio.value);
    lapDisplay.innerHTML = Number.isFinite(curSec) ? formatLapTimes(curSec, 8) : '';
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

  const editors = ['strength', 'core', 'cardio'];
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
  renderStrengthEditor(result.scores);
  renderCoreEditor(result.scores);
  renderCardioEditor(result.scores);
  renderEditorVisibility();
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

  byId('pfra-whtr')?.addEventListener('input', () => {
    dispatch({ type: 'SET_WHTR', value: val('pfra-whtr') });
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
      const def = eventDefaults[sv] || defaultCardioValue;
      dispatch({ type: 'SET_CARDIO_VALUE', value: def });
      if (sv === 'hamr-20-meter') {
        const shuttleTxt = byId('run-shuttle-txt');
        if (shuttleTxt) shuttleTxt.value = def;
      } else {
        const parts = def.split(':');
        const minEl = byId('run-mintxt');
        const secEl = byId('run-sectxt');
        if (minEl) minEl.value = parts[0] || '20';
        if (secEl) secEl.value = parts[1] || '00';
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
  loadData().then(render);
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
