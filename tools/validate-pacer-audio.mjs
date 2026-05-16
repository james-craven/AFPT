import assert from 'node:assert/strict';
import {
  createPacerCueSchedule,
  formatCueText,
  normalizePacerAudioSettings,
} from '../src/pfra/pacer-audio.mjs';

const fourteenMinutes = 14 * 60;

const hundredMeterSchedule = createPacerCueSchedule(fourteenMinutes, {
  courseMode: 'track',
  cueFrequency: '100m',
});
assert.equal(hundredMeterSchedule.length, 32, '14:00 goal with 100m cues creates 32 cue points');
assert.equal(hundredMeterSchedule[0].distanceMeters, 100, 'first 100m cue is at 100m');
assert.equal(hundredMeterSchedule.at(-1).distanceMeters, 3200, 'last 100m cue is finish');
assert.equal(hundredMeterSchedule.at(-1).kind, 'finish', 'final 100m cue is finish');

const fourHundredSchedule = createPacerCueSchedule(fourteenMinutes, {
  courseMode: 'track',
  cueFrequency: '400m',
});
assert.equal(fourHundredSchedule[0].distanceMeters, 400, 'first 400m cue is at 400m');
assert.equal(fourHundredSchedule[0].targetSeconds, 105, '400m target for 14:00 is 1:45');
assert.match(
  formatCueText(fourHundredSchedule[0], { courseMode: 'track', cueFrequency: '400m' }),
  /Lap 1 complete\. Target 1:45\./,
  'track lap boundary cue is descriptive',
);

const quarterSchedule = createPacerCueSchedule(fourteenMinutes, {
  courseMode: 'route',
  cueFrequency: 'quarter',
});
assert.deepEqual(
  quarterSchedule.map((cue) => cue.percent),
  [25, 50, 75, 100],
  'quarter cue frequency creates quarter-point cues',
);
assert.match(
  formatCueText(quarterSchedule[1], { courseMode: 'route' }),
  /1600 meters\. Target 7:00\./,
  'route halfway cue is human-readable',
);

const outBackSchedule = createPacerCueSchedule(fourteenMinutes, {
  courseMode: 'out-back',
  cueFrequency: '400m',
});
assert.deepEqual(
  outBackSchedule.filter((cue) => cue.turn).map((cue) => cue.distanceMeters),
  [1600],
  'out-and-back mode adds a single halfway turn cue',
);
assert.match(
  formatCueText(outBackSchedule.find((cue) => cue.distanceMeters === 1600), {
    courseMode: 'out-back',
    cueFrequency: '400m',
  }),
  /Turn\. 1600 meters\. Target 7:00\./,
  'out-and-back turn cue announces turn, distance, and target time',
);

assert.deepEqual(
  normalizePacerAudioSettings({
    enabled: true,
    courseMode: 'percent',
    cueFrequency: 'lots',
  }),
  {
    enabled: true,
    courseMode: 'track',
    cueFrequency: '100m',
    vibration: false,
  },
  'invalid persisted settings normalize to safe defaults',
);

console.log('Validated pacer audio cue schedules');
