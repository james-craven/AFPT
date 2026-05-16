import { secondsToTimeString } from './scoring.mjs';

export const PACER_AUDIO_STORAGE_KEY = 'afpt.pacerAudio.v1';
export const PACER_TOTAL_DISTANCE_METERS = 3200;
export const PACER_TRACK_LAP_METERS = 400;

export const DEFAULT_PACER_AUDIO_SETTINGS = Object.freeze({
  enabled: false,
  courseMode: 'track',
  cueFrequency: '100m',
  vibration: false,
});

const COURSE_MODES = new Set(['track', 'route', 'out-back']);
const CUE_FREQUENCIES = new Set(['100m', '200m', '400m', 'quarter']);
const PACER_AUDIO_SESSION_TYPE = 'transient';

function safeStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function normalizePacerAudioSettings(settings = {}) {
  const merged = { ...DEFAULT_PACER_AUDIO_SETTINGS, ...(settings || {}) };

  return {
    enabled: Boolean(merged.enabled),
    courseMode: COURSE_MODES.has(merged.courseMode) ? merged.courseMode : DEFAULT_PACER_AUDIO_SETTINGS.courseMode,
    cueFrequency: CUE_FREQUENCIES.has(merged.cueFrequency) ? merged.cueFrequency : DEFAULT_PACER_AUDIO_SETTINGS.cueFrequency,
    vibration: Boolean(merged.vibration),
  };
}

export function loadPacerAudioSettings(storage = safeStorage()) {
  if (!storage) return { ...DEFAULT_PACER_AUDIO_SETTINGS };
  try {
    return normalizePacerAudioSettings(JSON.parse(storage.getItem(PACER_AUDIO_STORAGE_KEY) || '{}'));
  } catch {
    return { ...DEFAULT_PACER_AUDIO_SETTINGS };
  }
}

export function savePacerAudioSettings(settings, storage = safeStorage()) {
  const normalized = normalizePacerAudioSettings(settings);
  if (!storage) return normalized;
  try {
    storage.setItem(PACER_AUDIO_STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    // localStorage can fail in private contexts; the feature still works for this session.
  }
  return normalized;
}

function cueDistances(settings) {
  const normalized = normalizePacerAudioSettings(settings);
  if (normalized.cueFrequency === 'quarter') {
    return [800, 1600, 2400, 3200];
  }

  const interval = Number(normalized.cueFrequency.replace('m', ''));
  const distances = [];
  for (let distance = interval; distance <= PACER_TOTAL_DISTANCE_METERS; distance += interval) {
    distances.push(distance);
  }
  if (distances[distances.length - 1] !== PACER_TOTAL_DISTANCE_METERS) distances.push(PACER_TOTAL_DISTANCE_METERS);
  return distances;
}

export function createPacerCueSchedule(goalSeconds, settings = {}) {
  const normalized = normalizePacerAudioSettings(settings);
  const totalSeconds = Number(goalSeconds);
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return [];

  return cueDistances(normalized).map((distanceMeters) => {
    const ratio = distanceMeters / PACER_TOTAL_DISTANCE_METERS;
    const targetSeconds = Math.round(totalSeconds * ratio);
    const lap = Math.ceil(distanceMeters / PACER_TRACK_LAP_METERS);
    const lapDistanceMeters = distanceMeters % PACER_TRACK_LAP_METERS || PACER_TRACK_LAP_METERS;
    const percent = Math.round(ratio * 100);
    const turn = normalized.courseMode === 'out-back'
      && distanceMeters === PACER_TOTAL_DISTANCE_METERS / 2;

    return {
      atMs: Math.round(targetSeconds * 1000),
      distanceMeters,
      kind: distanceMeters === PACER_TOTAL_DISTANCE_METERS ? 'finish' : turn ? 'turn' : 'cue',
      lap,
      lapDistanceMeters,
      percent,
      targetSeconds,
      turn,
    };
  });
}

export function formatCueText(cue, settings = {}) {
  const normalized = normalizePacerAudioSettings(settings);
  const target = secondsToTimeString(cue.targetSeconds);

  if (cue.kind === 'finish') return `Finish. Target ${target}.`;

  if (normalized.courseMode === 'track') {
    if (cue.lapDistanceMeters === PACER_TRACK_LAP_METERS) {
      return `Lap ${cue.lap} complete. Target ${target}.`;
    }
    return `Lap ${cue.lap}, ${cue.lapDistanceMeters} meters. Target ${target}.`;
  }

  const distanceText = `${cue.distanceMeters} meters`;
  if (normalized.courseMode === 'out-back' && cue.turn) {
    return `Turn. ${distanceText}. Target ${target}.`;
  }
  return `${distanceText}. Target ${target}.`;
}

export class PacerAudioController {
  constructor({ root = globalThis } = {}) {
    this.root = root;
    this.goalSeconds = null;
    this.lastCueIndex = -1;
    this.running = false;
    this.schedule = [];
    this.scheduleKey = '';
    this.settings = { ...DEFAULT_PACER_AUDIO_SETTINGS };
    this.statusCallback = null;
    this.audioSessionReleaseTimer = 0;
    this.wakeLock = null;
  }

  setStatusCallback(callback) {
    this.statusCallback = typeof callback === 'function' ? callback : null;
  }

  status(message) {
    if (this.statusCallback) this.statusCallback(message);
  }

  hooks() {
    return this.root.__afptPacerAudioTestHooks || null;
  }

  getDebugState() {
    return {
      cueCount: this.schedule.length,
      enabled: this.settings.enabled,
      goalSeconds: this.goalSeconds,
      lastCueIndex: this.lastCueIndex,
      running: this.running,
      vibration: this.settings.vibration,
      wakeLockActive: Boolean(this.wakeLock),
    };
  }

  configure(goalSeconds, settings, { resetCueIndex = false } = {}) {
    const normalized = normalizePacerAudioSettings(settings);
    const scheduleKey = JSON.stringify({ goalSeconds, ...normalized });
    if (scheduleKey !== this.scheduleKey) {
      this.schedule = createPacerCueSchedule(goalSeconds, normalized);
      this.scheduleKey = scheduleKey;
      this.lastCueIndex = -1;
    } else if (resetCueIndex) {
      this.lastCueIndex = -1;
    }
    this.goalSeconds = goalSeconds;
    this.settings = normalized;
  }

  syncToElapsed(elapsedMs, goalSeconds, settings) {
    this.configure(goalSeconds, settings);
    this.lastCueIndex = this.findLatestDueCueIndex(elapsedMs);
  }

  reset() {
    this.running = false;
    this.goalSeconds = null;
    this.lastCueIndex = -1;
    this.schedule = [];
    this.scheduleKey = '';
    this.cancelSpeech();
    this.releaseAudioSessionNow();
    this.releaseWakeLock();
  }

  pause() {
    this.running = false;
    this.cancelSpeech();
    this.releaseAudioSessionNow();
    this.releaseWakeLock();
  }

  stop({ cancelSpeech = true } = {}) {
    this.running = false;
    if (cancelSpeech) this.cancelSpeech();
    this.releaseAudioSessionNow();
    this.releaseWakeLock();
  }

  start(goalSeconds, settings) {
    this.configure(goalSeconds, settings);
    this.running = true;
    if (this.settings.enabled) {
      this.armAudioFromUserGesture({ cue: 'start' });
    }
    void this.requestWakeLock();
  }

  update(elapsedMs, goalSeconds, settings) {
    this.configure(goalSeconds, settings);
    if (!this.settings.enabled || !this.running || !this.schedule.length) return;

    const latestDueIndex = this.findLatestDueCueIndex(elapsedMs);
    if (latestDueIndex <= this.lastCueIndex) return;

    this.lastCueIndex = latestDueIndex;
    this.playCue(this.schedule[latestDueIndex], this.settings);
  }

  testCue(settings, goalSeconds = 840) {
    const normalized = normalizePacerAudioSettings({ ...settings, enabled: true });
    this.configure(goalSeconds, normalized, { resetCueIndex: true });
    const cue = this.schedule[0] || createPacerCueSchedule(goalSeconds, normalized)[0];
    this.armAudioFromUserGesture({ cue: 'test', testCue: cue });
    this.status(`Test cue: ${cue ? formatCueText(cue, normalized) : 'Unavailable'}`);
  }

  findLatestDueCueIndex(elapsedMs) {
    let latest = -1;
    for (let i = 0; i < this.schedule.length; i += 1) {
      if (this.schedule[i].atMs <= elapsedMs) latest = i;
      else break;
    }
    return latest;
  }

  armAudioFromUserGesture({ cue = 'prime', testCue = null } = {}) {
    this.prepareCueAudioSession();

    if (cue === 'start') this.playStartCue();
    else if (cue === 'test' && testCue) this.playCue(testCue, this.settings);
    else if (cue === 'prime') this.primeAudibleCue();

    return true;
  }

  async unlockAudio() {
    const hooks = this.hooks();
    this.prepareCueAudioSession();
    if (hooks?.unlockAudio) return hooks.unlockAudio();
    return true;
  }

  setAudioSessionType(type) {
    const hooks = this.hooks();
    if (hooks?.setAudioSessionType) {
      hooks.setAudioSessionType(type);
      return true;
    }
    try {
      const session = this.root.navigator?.audioSession;
      if (session && 'type' in session) {
        session.type = type;
        return true;
      }
    } catch {
      // Audio Session API is experimental; ignore unsupported assignment failures.
    }
    return false;
  }

  prepareCueAudioSession() {
    this.clearAudioSessionReleaseTimer();
    return this.setAudioSessionType(PACER_AUDIO_SESSION_TYPE);
  }

  cueReleaseDelay(cueText = '') {
    if (!cueText) return 900;
    const estimatedSpeechMs = Math.max(1600, Math.min(5000, cueText.length * 70));
    return estimatedSpeechMs;
  }

  scheduleAudioSessionRelease(delayMs = 1800) {
    this.clearAudioSessionReleaseTimer();
    const setTimer = this.root.setTimeout || globalThis.setTimeout;
    this.audioSessionReleaseTimer = setTimer(() => {
      this.audioSessionReleaseTimer = 0;
      this.setAudioSessionType('auto');
    }, delayMs);
  }

  clearAudioSessionReleaseTimer() {
    if (!this.audioSessionReleaseTimer) return;
    const clearTimer = this.root.clearTimeout || globalThis.clearTimeout;
    clearTimer(this.audioSessionReleaseTimer);
    this.audioSessionReleaseTimer = 0;
  }

  releaseAudioSessionNow() {
    this.clearAudioSessionReleaseTimer();
    this.setAudioSessionType('auto');
  }

  playStartCue() {
    const cue = { kind: 'start', distanceMeters: 0, targetSeconds: 0 };
    const normalized = this.settings;
    const speechText = 'Pacer started.';
    this.prepareCueAudioSession();
    this.speak(speechText, cue);
    if (normalized.vibration) this.vibrate(cue);
    this.scheduleAudioSessionRelease(this.cueReleaseDelay(speechText));
    this.status('Pacer audio armed. Keep this screen awake for the most reliable cues.');
  }

  primeAudibleCue() {
    const cue = { kind: 'prime', distanceMeters: 0, targetSeconds: 0 };
    const speechText = 'Pacer audio ready.';
    this.prepareCueAudioSession();
    this.speak(speechText, cue);
    this.scheduleAudioSessionRelease(this.cueReleaseDelay(speechText));
  }

  playCue(cue, settings) {
    const normalized = normalizePacerAudioSettings(settings);
    const text = formatCueText(cue, normalized);
    this.prepareCueAudioSession();
    this.speak(text, cue);
    if (normalized.vibration) this.vibrate(cue);
    this.scheduleAudioSessionRelease(this.cueReleaseDelay(text));
  }

  vibrate(cue) {
    const hooks = this.hooks();
    const pattern = cue?.kind === 'finish' ? [180, 80, 180, 80, 260] : cue?.turn ? [220, 80, 220] : cue?.kind === 'start' ? [120, 60, 120] : [160];
    if (hooks?.vibrate) {
      hooks.vibrate(pattern, cue);
      return true;
    }
    try {
      return Boolean(this.root.navigator?.vibrate?.(pattern));
    } catch {
      return false;
    }
  }

  speak(text, cue) {
    const hooks = this.hooks();
    if (hooks?.speak) {
      hooks.speak(text, cue);
      return true;
    }

    const synth = this.root.speechSynthesis;
    const Utterance = this.root.SpeechSynthesisUtterance;
    if (!synth || !Utterance) return false;
    try {
      synth.cancel();
      const utterance = new Utterance(text);
      utterance.rate = 1.02;
      utterance.pitch = 1;
      utterance.volume = 1;
      synth.speak(utterance);
      return true;
    } catch {
      return false;
    }
  }

  cancelSpeech() {
    const hooks = this.hooks();
    if (hooks?.cancelSpeech) {
      hooks.cancelSpeech();
      return;
    }
    try {
      this.root.speechSynthesis?.cancel?.();
    } catch {
      // Ignore browser speech cancellation issues.
    }
  }

  async requestWakeLock() {
    const hooks = this.hooks();
    try {
      if (hooks?.requestWakeLock) {
        this.wakeLock = await hooks.requestWakeLock();
        return true;
      }
      if (!this.root.navigator?.wakeLock?.request) {
        this.status('Screen wake lock is unavailable. Keep your screen awake while running.');
        return false;
      }
      this.wakeLock = await this.root.navigator.wakeLock.request('screen');
      this.wakeLock.addEventListener?.('release', () => {
        this.wakeLock = null;
      });
      return true;
    } catch {
      this.status('Screen wake lock was not allowed. Keep your screen awake while running.');
      return false;
    }
  }

  async releaseWakeLock() {
    const lock = this.wakeLock;
    this.wakeLock = null;
    try {
      await lock?.release?.();
    } catch {
      // Releasing can fail if the browser already dropped the lock.
    }
  }
}
