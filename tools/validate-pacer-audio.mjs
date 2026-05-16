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

const percentSchedule = createPacerCueSchedule(fourteenMinutes, {
  courseMode: 'percent',
  cueFrequency: '100m',
});
assert.deepEqual(
  percentSchedule.map((cue) => cue.percent),
  [25, 50, 75, 100],
  'percent mode creates quarter-point cues',
);
assert.match(
  formatCueText(percentSchedule[1], { courseMode: 'percent' }),
  /Halfway\. Target 7:00\./,
  'percent halfway cue is human-readable',
);

const outBackSchedule = createPacerCueSchedule(fourteenMinutes, {
  courseMode: 'out-back',
  cueFrequency: '400m',
  outBackSegmentMeters: 800,
});
assert.deepEqual(
  outBackSchedule.filter((cue) => cue.turn).map((cue) => cue.distanceMeters),
  [800, 1600, 2400],
  'out-and-back 800m preset adds turn cues before finish',
);
assert.match(
  formatCueText(outBackSchedule.find((cue) => cue.distanceMeters === 800), {
    courseMode: 'out-back',
    cueFrequency: '400m',
    outBackSegmentMeters: 800,
  }),
  /Turn\. 800 meters\. Target 3:30\./,
  'out-and-back turn cue announces turn, distance, and target time',
);

assert.deepEqual(
  normalizePacerAudioSettings({
    enabled: true,
    cueStyle: 'loud',
    courseMode: 'mystery',
    cueFrequency: 'lots',
    outBackSegmentMeters: 123,
  }),
  {
    enabled: true,
    cueStyle: 'beep-voice',
    courseMode: 'track',
    cueFrequency: '100m',
    outBackSegmentMeters: 1600,
  },
  'invalid persisted settings normalize to safe defaults',
);

console.log('Validated pacer audio cue schedules');
