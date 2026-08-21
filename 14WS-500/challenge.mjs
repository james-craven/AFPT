const DATA_URL = '/14ws-500/data.json';
const SERVICE_WORKER_URL = '/sw.js';

const els = {
  shell: document.querySelector('.challenge-shell'),
  title: document.getElementById('challenge-title'),
  dateRange: document.getElementById('challenge-date-range'),
  totalMiles: document.getElementById('total-miles'),
  statusNote: document.getElementById('status-note'),
  progressRing: document.getElementById('progress-ring'),
  progressPercent: document.getElementById('progress-percent'),
  progressFill: document.getElementById('progress-fill'),
  goalMiles: document.getElementById('goal-miles'),
  remainingMiles: document.getElementById('remaining-miles'),
  neededPace: document.getElementById('needed-pace'),
  paceLabel: document.getElementById('pace-label'),
  updatedAt: document.getElementById('updated-at'),
  dataStatus: document.getElementById('data-status'),
};

const milesFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
});

const wholeFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
});

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
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

function formatMiles(value) {
  return milesFormatter.format(toFiniteNumber(value));
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

function challengeTiming(data) {
  const start = parseLocalDate(data.startDate);
  const end = parseLocalDate(data.endDate);
  if (!start || !end) return { label: 'mi/day', daysForPace: 1 };

  const now = new Date();
  const startsIn = daysUntil(start, now);
  if (startsIn > 0) {
    const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1);
    return { label: 'mi/day', daysForPace: totalDays, status: `Starts in ${startsIn} day${startsIn === 1 ? '' : 's'}` };
  }

  const endsIn = daysUntil(end, now);
  if (endsIn >= 0) {
    return { label: 'mi/day left', daysForPace: endsIn + 1, status: `${endsIn + 1} day${endsIn === 0 ? '' : 's'} left` };
  }

  return { label: 'final pace', daysForPace: 1, status: 'Challenge complete' };
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
  const total = Math.max(0, toFiniteNumber(data.totalMiles));
  const goal = Math.max(1, toFiniteNumber(data.goalMiles, 500));
  const remaining = Math.max(0, goal - total);
  const percent = clamp((total / goal) * 100, 0, 100);
  const timing = challengeTiming(data);
  const neededPace = remaining > 0 ? remaining / Math.max(1, timing.daysForPace) : 0;

  document.title = data.challengeName || '14WS 500-Mile Challenge';
  if (els.title) els.title.textContent = data.challengeName || '14WS 500-Mile Challenge';
  if (els.dateRange) els.dateRange.textContent = formatDateRange(data.startDate, data.endDate) || 'September unit challenge';
  if (els.totalMiles) els.totalMiles.textContent = formatMiles(total);
  if (els.statusNote) els.statusNote.textContent = data.statusNote || timing.status || 'Unit mileage total';
  if (els.goalMiles) els.goalMiles.textContent = wholeFormatter.format(goal);
  if (els.remainingMiles) els.remainingMiles.textContent = formatMiles(remaining);
  if (els.neededPace) els.neededPace.textContent = formatMiles(neededPace);
  if (els.paceLabel) els.paceLabel.textContent = timing.label;
  if (els.progressPercent) els.progressPercent.textContent = `${percentFormatter.format(percent)}%`;
  if (els.progressFill) els.progressFill.style.width = `${percent}%`;
  if (els.progressRing) {
    els.progressRing.style.setProperty('--progress', `${percent * 3.6}deg`);
    els.progressRing.setAttribute('aria-valuemax', String(goal));
    els.progressRing.setAttribute('aria-valuenow', String(total));
  }

  const updated = data.updatedAt ? new Date(data.updatedAt) : null;
  if (els.updatedAt) {
    els.updatedAt.textContent = updated && !Number.isNaN(updated.getTime())
      ? `Updated ${dateTimeFormatter.format(updated)}`
      : 'Updated recently';
  }
}

async function loadData() {
  try {
    const response = await fetch(`${DATA_URL}?v=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Data request failed: ${response.status}`);
    const data = await response.json();
    render(data);
    if (els.shell) {
      els.shell.dataset.loading = 'false';
      delete els.shell.dataset.error;
    }
    if (els.dataStatus) els.dataStatus.textContent = 'Latest total loaded';
  } catch (error) {
    if (els.shell) {
      els.shell.dataset.loading = 'false';
      els.shell.dataset.error = 'true';
    }
    if (els.dataStatus) els.dataStatus.textContent = 'Unable to refresh total';
  }
}

void refreshServiceWorker();
await loadData();
