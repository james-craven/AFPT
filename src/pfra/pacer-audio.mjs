import { secondsToTimeString } from './scoring.mjs';

export const PACER_AUDIO_STORAGE_KEY = 'afpt.pacerAudio.v1';
export const PACER_TOTAL_DISTANCE_METERS = 3200;
export const PACER_TRACK_LAP_METERS = 400;

export const DEFAULT_PACER_AUDIO_SETTINGS = Object.freeze({
  enabled: false,
  cueStyle: 'beep-voice',
  courseMode: 'track',
  cueFrequency: '100m',
  outBackSegmentMeters: 1600,
  cueIntensity: 'loud',
  vibration: false,
});

const CUE_STYLES = new Set(['beep-voice', 'beep', 'voice']);
const COURSE_MODES = new Set(['track', 'route', 'out-back', 'percent']);
const CUE_FREQUENCIES = new Set(['100m', '200m', '400m', 'quarter']);
const CUE_INTENSITIES = new Set(['normal', 'loud', 'max']);
const OUT_BACK_SEGMENTS = new Set([100, 200, 400, 800, 1600]);

function safeStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function normalizePacerAudioSettings(settings = {}) {
  const merged = { ...DEFAULT_PACER_AUDIO_SETTINGS, ...(settings || {}) };
  const segment = Number(merged.outBackSegmentMeters);

  return {
    enabled: Boolean(merged.enabled),
    cueStyle: CUE_STYLES.has(merged.cueStyle) ? merged.cueStyle : DEFAULT_PACER_AUDIO_SETTINGS.cueStyle,
    courseMode: COURSE_MODES.has(merged.courseMode) ? merged.courseMode : DEFAULT_PACER_AUDIO_SETTINGS.courseMode,
    cueFrequency: CUE_FREQUENCIES.has(merged.cueFrequency) ? merged.cueFrequency : DEFAULT_PACER_AUDIO_SETTINGS.cueFrequency,
    outBackSegmentMeters: OUT_BACK_SEGMENTS.has(segment) ? segment : DEFAULT_PACER_AUDIO_SETTINGS.outBackSegmentMeters,
    cueIntensity: CUE_INTENSITIES.has(merged.cueIntensity) ? merged.cueIntensity : DEFAULT_PACER_AUDIO_SETTINGS.cueIntensity,
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
  if (normalized.courseMode === 'percent' || normalized.cueFrequency === 'quarter') {
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

function percentLabel(percent) {
  if (percent === 50) return 'Halfway';
  if (percent === 100) return 'Finish';
  return `${percent} percent`;
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
      && distanceMeters < PACER_TOTAL_DISTANCE_METERS
      && distanceMeters % normalized.outBackSegmentMeters === 0;

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

  if (normalized.courseMode === 'percent') {
    return `${percentLabel(cue.percent)}. Target ${target}.`;
  }

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
    this.audioContext = null;
    this.goalSeconds = null;
    this.lastCueIndex = -1;
    this.running = false;
    this.schedule = [];
    this.scheduleKey = '';
    this.settings = { ...DEFAULT_PACER_AUDIO_SETTINGS };
    this.statusCallback = null;
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
      cueIntensity: this.settings.cueIntensity,
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
    this.releaseWakeLock();
  }

  pause() {
    this.running = false;
    this.cancelSpeech();
    this.releaseWakeLock();
  }

  stop({ cancelSpeech = true } = {}) {
    this.running = false;
    if (cancelSpeech) this.cancelSpeech();
    this.releaseWakeLock();
  }

  async start(goalSeconds, settings) {
    this.configure(goalSeconds, settings);
    this.running = true;
    if (this.settings.enabled) await this.unlockAudio();
    await this.requestWakeLock();
  }

  update(elapsedMs, goalSeconds, settings) {
    this.configure(goalSeconds, settings);
    if (!this.settings.enabled || !this.running || !this.schedule.length) return;

    const latestDueIndex = this.findLatestDueCueIndex(elapsedMs);
    if (latestDueIndex <= this.lastCueIndex) return;

    this.lastCueIndex = latestDueIndex;
    this.playCue(this.schedule[latestDueIndex], this.settings);
  }

  async testCue(settings, goalSeconds = 840) {
    const normalized = normalizePacerAudioSettings({ ...settings, enabled: true });
    this.configure(goalSeconds, normalized, { resetCueIndex: true });
    await this.unlockAudio();
    const cue = this.schedule[0] || createPacerCueSchedule(goalSeconds, normalized)[0];
    if (cue) this.playCue(cue, normalized);
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

  async unlockAudio() {
    const hooks = this.hooks();
    if (hooks?.unlockAudio) return hooks.unlockAudio();

    const AudioCtor = this.root.AudioContext || this.root.webkitAudioContext;
    if (!AudioCtor) return false;
    if (!this.audioContext) this.audioContext = new AudioCtor();
    if (this.audioContext.state === 'suspended') await this.audioContext.resume();
    return true;
  }

  playCue(cue, settings) {
    const normalized = normalizePacerAudioSettings(settings);
    const text = formatCueText(cue, normalized);
    if (normalized.cueStyle === 'beep' || normalized.cueStyle === 'beep-voice') this.beep(cue);
    if (normalized.cueStyle === 'voice' || normalized.cueStyle === 'beep-voice') this.speak(text, cue);
    if (normalized.vibration) this.vibrate(cue);
  }

  beep(cue) {
    const hooks = this.hooks();
    if (hooks?.beep) {
      hooks.beep(cue);
      return true;
    }

    if (!this.audioContext) return false;
    const now = this.audioContext.currentTime;
    const profile = {
      normal: { volume: 0.18, duration: 0.22, gap: 0.07, count: 1 },
      loud: { volume: 0.36, duration: 0.24, gap: 0.07, count: cue?.kind === 'finish' ? 3 : 2 },
      max: { volume: 0.64, duration: 0.28, gap: 0.06, count: cue?.kind === 'finish' ? 4 : 3 },
    }[this.settings.cueIntensity] || { volume: 0.36, duration: 0.24, gap: 0.07, count: 2 };
    const baseFrequency = cue?.turn ? 740 : cue?.kind === 'finish' ? 880 : 660;

    for (let i = 0; i < profile.count; i += 1) {
      const oscillator = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      const start = now + i * (profile.duration + profile.gap);
      oscillator.type = cue?.kind === 'finish' ? 'triangle' : 'square';
      oscillator.frequency.setValueAtTime(baseFrequency + i * 60, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(profile.volume, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + profile.duration);
      oscillator.connect(gain).connect(this.audioContext.destination);
      oscillator.start(start);
      oscillator.stop(start + profile.duration + 0.02);
    }
    return true;
  }

  vibrate(cue) {
    const hooks = this.hooks();
    const pattern = cue?.kind === 'finish' ? [180, 80, 180, 80, 260] : cue?.turn ? [220, 80, 220] : [160];
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
