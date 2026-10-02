import { celebrate } from './celebrate.mjs';

const MANIFEST_URL = '/14ws-500/challenges.json';
// Used when the manifest can't be loaded, so the page still shows something.
const FALLBACK_MANIFEST = {
  current: 'default',
  challenges: [{ id: 'default', data: '/14ws-500/data.json' }],
};
const SERVICE_WORKER_URL = '/sw.js';

// September's data.json predates per-challenge metrics, so a file without a
// `metric` block is a mileage challenge.
const DEFAULT_METRIC = {
  label: 'Miles Logged',
  unit: 'miles',
  unitShort: 'mi',
  decimals: 2,
  participant: 'runner',
  icon: '/running.webp',
};

const els = {
  shell: document.querySelector('.challenge-shell'),
  tabs: document.getElementById('challenge-tabs'),
  board: document.getElementById('challenge-board'),
  kicker: document.getElementById('challenge-kicker'),
  title: document.getElementById('challenge-title'),
  dateRange: document.getElementById('challenge-date-range'),
  metricLabel: document.getElementById('metric-label'),
  totalMiles: document.getElementById('total-miles'),
  totalUnit: document.getElementById('total-unit'),
  statusNote: document.getElementById('status-note'),
  progressRing: document.getElementById('progress-ring'),
  progressPercent: document.getElementById('progress-percent'),
  progressFill: document.getElementById('progress-fill'),
  goalMiles: document.getElementById('goal-miles'),
  goalUnit: document.getElementById('goal-unit'),
  remainingMiles: document.getElementById('remaining-miles'),
  remainingUnit: document.getElementById('remaining-unit'),
  neededPace: document.getElementById('needed-pace'),
  paceLabel: document.getElementById('pace-label'),
  updatedAt: document.getElementById('updated-at'),
  dataStatus: document.getElementById('data-status'),
  leaderboardList: document.getElementById('leaderboard-list'),
  leaderboardCount: document.getElementById('leaderboard-count'),
};

const wholeFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
});

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
});

const monthFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function toFiniteNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function resolveMetric(data) {
  const metric = { ...DEFAULT_METRIC, ...(data?.metric || {}) };
  const decimals = clamp(Math.round(toFiniteNumber(metric.decimals, 2)), 0, 4);
  const formatter = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  });
  return {
    ...metric,
    decimals,
    format: (value) => formatter.format(toFiniteNumber(value)),
    round: (value) => {
      const factor = 10 ** decimals;
      return Math.round(value * factor) / factor;
    },
  };
}

function plural(word, count) {
  return `${word}${count === 1 ? '' : 's'}`;
}

function parseLocalDate(value) {
  if (!value) return null;
  const [year, month, day] = String(value).split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function formatDateRange(startDate, endDate) {
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);
  if (!start || !end) return '';
  return `${dateFormatter.format(start)} - ${dateFormatter.format(end)}`;
}

function daysUntil(date, now = new Date()) {
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
}

function challengeTiming(data, metric) {
  const perDay = `${metric.unitShort}/day`;
  const start = parseLocalDate(data.startDate);
  const end = parseLocalDate(data.endDate);
  if (!start || !end) return { label: perDay, daysForPace: 1 };

  const now = new Date();
  const startsIn = daysUntil(start, now);
  if (startsIn > 0) {
    const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1);
    return { label: perDay, daysForPace: totalDays, status: `Starts in ${startsIn} ${plural('day', startsIn)}` };
  }

  const endsIn = daysUntil(end, now);
  if (endsIn >= 0) {
    return { label: `${perDay} left`, daysForPace: endsIn + 1, status: `${endsIn + 1} ${plural('day', endsIn + 1)} left` };
  }

  return { label: 'final pace', daysForPace: 1, status: 'Challenge complete' };
}

// Mileage files store each runner's total as `miles`; newer files use `count`.
function participantValue(participant) {
  return toFiniteNumber(participant?.count ?? participant?.miles);
}

function normalizeParticipants(participants) {
  if (!Array.isArray(participants)) return [];

  return participants
    .map((participant, index) => ({
      index,
      value: Math.max(0, participantValue(participant)),
      name: String(participant?.name || '').trim(),
    }))
    .filter((participant) => participant.name && participant.value > 0)
    .sort((left, right) => {
      if (right.value !== left.value) return right.value - left.value;
      return left.index - right.index;
    });
}

function participantInitials(name) {
  const parts = name.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return `${first}${last}`.toUpperCase() || '?';
}

function renderLeaderboard(participants, metric) {
  if (!els.leaderboardList) return;

  els.leaderboardList.textContent = '';
  if (els.leaderboardCount) {
    const count = participants.length;
    els.leaderboardCount.textContent = `${count} ${plural(metric.participant, count)} with ${metric.unit} logged`;
  }

  if (!participants.length) {
    const emptyRow = document.createElement('li');
    emptyRow.className = 'leaderboard-empty';
    emptyRow.textContent = `No ${metric.unit} logged yet.`;
    els.leaderboardList.append(emptyRow);
    return;
  }

  const leaderValue = Math.max(1, participants[0].value);

  participants.forEach((participant, index) => {
    const row = document.createElement('li');
    row.className = 'leaderboard-row';
    row.dataset.rank = String(index + 1);

    const rank = document.createElement('span');
    rank.className = 'leaderboard-rank';
    rank.textContent = String(index + 1);

    const avatar = document.createElement('span');
    avatar.className = 'leaderboard-avatar';
    avatar.textContent = participantInitials(participant.name);
    avatar.setAttribute('aria-hidden', 'true');

    const runner = document.createElement('div');
    runner.className = 'leaderboard-runner';

    const name = document.createElement('strong');
    name.textContent = participant.name;

    const track = document.createElement('span');
    track.className = 'leaderboard-track';

    const fill = document.createElement('span');
    fill.style.width = `${clamp((participant.value / leaderValue) * 100, 0, 100)}%`;
    track.append(fill);

    runner.append(name, track);

    const value = document.createElement('span');
    value.className = 'leaderboard-miles';
    value.textContent = `${metric.format(participant.value)} ${metric.unitShort}`;

    row.append(rank, avatar, runner, value);
    els.leaderboardList.append(row);
  });
}

async function refreshServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  const params = new URLSearchParams(window.location.search);
  const canRegister = window.location.protocol === 'https:' || params.get('sw') === '1';
  if (!canRegister) return;

  try {
    const registration = await navigator.serviceWorker.register(SERVICE_WORKER_URL, { updateViaCache: 'none' });
    await registration.update();
    registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
  } catch {
    // Challenge totals should still load even if service-worker update checks fail.
  }
}

function render(data) {
  const metric = resolveMetric(data);
  const participants = normalizeParticipants(data.participants);
  const participantTotal = participants.reduce((sum, participant) => sum + participant.value, 0);
  const totalSource = participants.length ? participantTotal : (data.total ?? data.totalMiles);
  const total = metric.round(Math.max(0, toFiniteNumber(totalSource)));
  const goal = Math.max(1, toFiniteNumber(data.goal ?? data.goalMiles, 1000));
  const remaining = Math.max(0, goal - total);
  const percent = clamp((total / goal) * 100, 0, 100);
  const timing = challengeTiming(data, metric);
  const neededPace = remaining > 0 ? remaining / Math.max(1, timing.daysForPace) : 0;
  const start = parseLocalDate(data.startDate);

  document.title = data.challengeName || '14WS Unit Challenge';
  if (els.shell) els.shell.style.setProperty('--challenge-icon', `url("${metric.icon}")`);
  if (els.kicker) els.kicker.textContent = start ? `${monthFormatter.format(start)} unit challenge` : 'Unit challenge';
  if (els.title) els.title.textContent = data.challengeName || '14WS Unit Challenge';
  if (els.dateRange) els.dateRange.textContent = formatDateRange(data.startDate, data.endDate) || 'Unit challenge';
  if (els.metricLabel) els.metricLabel.textContent = metric.label;
  if (els.totalMiles) els.totalMiles.textContent = metric.format(total);
  if (els.totalUnit) els.totalUnit.textContent = metric.unitShort;
  if (els.statusNote) els.statusNote.textContent = data.statusNote || timing.status || 'Unit total';
  if (els.goalMiles) els.goalMiles.textContent = wholeFormatter.format(goal);
  if (els.goalUnit) els.goalUnit.textContent = metric.unit;
  if (els.remainingMiles) els.remainingMiles.textContent = metric.format(remaining);
  if (els.remainingUnit) els.remainingUnit.textContent = metric.unit;
  if (els.neededPace) els.neededPace.textContent = metric.format(neededPace);
  if (els.paceLabel) els.paceLabel.textContent = timing.label;
  if (els.progressPercent) els.progressPercent.textContent = `${percentFormatter.format(percent)}%`;
  if (els.progressFill) els.progressFill.style.width = `${percent}%`;
  if (els.progressRing) {
    els.progressRing.style.setProperty('--progress', `${percent * 3.6}deg`);
    els.progressRing.setAttribute('aria-label', `Progress toward ${wholeFormatter.format(goal)} ${metric.unit}`);
    els.progressRing.setAttribute('aria-valuemax', String(goal));
    els.progressRing.setAttribute('aria-valuenow', String(total));
  }
  renderLeaderboard(participants, metric);

  const goalReached = total >= goal;
  if (els.shell) els.shell.dataset.goalReached = String(goalReached);

  const updated = data.updatedAt ? new Date(data.updatedAt) : null;
  if (els.updatedAt) {
    els.updatedAt.textContent = updated && !Number.isNaN(updated.getTime())
      ? `Last updated ${dateTimeFormatter.format(updated)}`
      : 'Last updated recently';
  }

  return goalReached;
}

async function fetchJson(url) {
  const response = await fetch(`${url}?v=${Date.now()}`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}

async function loadManifest() {
  try {
    const manifest = await fetchJson(MANIFEST_URL);
    const challenges = Array.isArray(manifest?.challenges)
      ? manifest.challenges.filter((challenge) => challenge?.id && challenge?.data)
      : [];
    if (!challenges.length) return FALLBACK_MANIFEST;
    const current = challenges.some((challenge) => challenge.id === manifest.current)
      ? manifest.current
      : challenges[0].id;
    return { current, challenges };
  } catch {
    return FALLBACK_MANIFEST;
  }
}

const dataCache = new Map();
const celebrated = new Set();
let manifest = FALLBACK_MANIFEST;
let activeId = null;
let loadToken = 0;

function challengeById(id) {
  return manifest.challenges.find((challenge) => challenge.id === id);
}

function tabButtons() {
  return Array.from(els.tabs?.querySelectorAll('[role="tab"]') || []);
}

function syncTabs() {
  tabButtons().forEach((button) => {
    const selected = button.dataset.challenge === activeId;
    button.setAttribute('aria-selected', String(selected));
    button.tabIndex = selected ? 0 : -1;
  });
}

function buildTabs() {
  if (!els.tabs) return;
  els.tabs.textContent = '';
  if (manifest.challenges.length < 2) {
    els.tabs.hidden = true;
    return;
  }

  manifest.challenges.forEach((challenge) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'challenge-tab';
    button.id = `tab-${challenge.id}`;
    button.dataset.challenge = challenge.id;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', 'challenge-board');

    const tabName = document.createElement('span');
    tabName.className = 'challenge-tab-name';
    tabName.textContent = challenge.tab || challenge.id;
    button.append(tabName);

    if (challenge.metric) {
      const tabMetric = document.createElement('span');
      tabMetric.className = 'challenge-tab-metric';
      tabMetric.textContent = challenge.metric;
      button.append(tabMetric);
    }

    button.addEventListener('click', () => selectChallenge(challenge.id, { updateHash: true }));
    els.tabs.append(button);
  });

  els.tabs.addEventListener('keydown', (event) => {
    const buttons = tabButtons();
    const index = buttons.findIndex((button) => button.dataset.challenge === activeId);
    let next = -1;
    if (event.key === 'ArrowRight') next = (index + 1) % buttons.length;
    if (event.key === 'ArrowLeft') next = (index - 1 + buttons.length) % buttons.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = buttons.length - 1;
    if (next < 0) return;
    event.preventDefault();
    buttons[next].focus();
    selectChallenge(buttons[next].dataset.challenge, { updateHash: true });
  });

  els.tabs.hidden = false;
}

function loadChallengeData(challenge) {
  if (!dataCache.has(challenge.id)) {
    const request = fetchJson(challenge.data).catch((error) => {
      dataCache.delete(challenge.id);
      throw error;
    });
    dataCache.set(challenge.id, request);
  }
  return dataCache.get(challenge.id);
}

async function selectChallenge(id, { updateHash = false } = {}) {
  const challenge = challengeById(id) || challengeById(manifest.current);
  if (!challenge) return;

  activeId = challenge.id;
  syncTabs();
  if (els.shell) {
    els.shell.dataset.challenge = challenge.id;
    els.shell.dataset.loading = 'true';
  }
  if (els.board) els.board.setAttribute('aria-labelledby', `tab-${challenge.id}`);
  if (updateHash) {
    const hash = challenge.id === manifest.current ? '' : `#${challenge.id}`;
    history.replaceState(null, '', `${window.location.pathname}${window.location.search}${hash}`);
  }
  if (els.dataStatus) els.dataStatus.textContent = 'Loading leaderboard...';

  const token = ++loadToken;
  try {
    const data = await loadChallengeData(challenge);
    if (token !== loadToken) return;
    const goalReached = render(data);
    if (els.shell) {
      els.shell.dataset.loading = 'false';
      delete els.shell.dataset.error;
    }
    if (els.dataStatus) els.dataStatus.textContent = 'Latest leaderboard loaded';
    if (goalReached && !celebrated.has(challenge.id)) {
      celebrated.add(challenge.id);
      celebrate();
    }
  } catch {
    if (token !== loadToken) return;
    if (els.shell) {
      els.shell.dataset.loading = 'false';
      els.shell.dataset.error = 'true';
    }
    if (els.dataStatus) els.dataStatus.textContent = 'Unable to refresh total';
  }
}

void refreshServiceWorker();
manifest = await loadManifest();
buildTabs();
const requested = window.location.hash.slice(1);
await selectChallenge(challengeById(requested) ? requested : manifest.current);
