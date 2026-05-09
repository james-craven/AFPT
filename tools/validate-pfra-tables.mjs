import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  loadTable,
  scoreFromTable,
  scorePfraAssessment,
  scoreWalk,
  scoreWhtr,
  tablePathFromId,
} from './pfra-score.mjs';

const cases = [
  {
    tableId: 'push-up',
    ageGroup: 'under-25',
    sex: 'male',
    performance: 67,
    expectedPoints: 15,
  },
  {
    tableId: 'push-up',
    ageGroup: '60-and-over',
    sex: 'female',
    performance: 3,
    expectedPoints: 2.5,
  },
  {
    tableId: 'hand-release-push-up',
    ageGroup: '25-29',
    sex: 'female',
    performance: 40,
    expectedPoints: 15,
  },
  {
    tableId: 'sit-up',
    ageGroup: '50-54',
    sex: 'male',
    performance: 34,
    expectedPoints: 9,
  },
  {
    tableId: 'cross-leg-reverse-crunch',
    ageGroup: '60-and-over',
    sex: 'female',
    performance: 17,
    expectedPoints: 2.5,
  },
  {
    tableId: 'forearm-plank',
    ageGroup: 'under-25',
    sex: 'male',
    performance: '3:40',
    expectedPoints: 15,
  },
  {
    tableId: 'two-mile-run',
    ageGroup: 'under-25',
    sex: 'male',
    performance: '13:25',
    expectedPoints: 50,
  },
  {
    tableId: 'two-mile-run',
    ageGroup: '60-and-over',
    sex: 'female',
    performance: '29:40',
    expectedPoints: 35,
  },
  {
    tableId: 'hamr-20-meter',
    ageGroup: 'under-25',
    sex: 'male',
    performance: 87,
    expectedPoints: 50,
  },
  {
    tableId: 'hamr-20-meter',
    ageGroup: '60-and-over',
    sex: 'female',
    performance: 11,
    expectedPoints: 35,
  },
];

for (const testCase of cases) {
  const table = loadTable(tablePathFromId(testCase.tableId));
  const result = scoreFromTable(table, testCase);

  assert.equal(
    result.points,
    testCase.expectedPoints,
    `${testCase.tableId} ${testCase.ageGroup}/${testCase.sex} ${testCase.performance}`,
  );
}

const standards = JSON.parse(fs.readFileSync('standards/af-pfra-2026.json', 'utf8'));
const tables = Object.fromEntries(
  [
    'push-up',
    'hand-release-push-up',
    'sit-up',
    'cross-leg-reverse-crunch',
    'forearm-plank',
    'two-mile-run',
    'hamr-20-meter',
  ].map((tableId) => [tableId, loadTable(tablePathFromId(tableId))]),
);

assert.equal(scoreWhtr('0.49', standards), 20, 'WHtR max score');
assert.equal(scoreWhtr('0.55', standards), 12.5, 'WHtR midpoint score');
assert.equal(scoreWhtr('0.60', standards), 0, 'WHtR zero score');

assert.equal(
  scoreWalk(standards, {
    ageGroup: 'under-25',
    sex: 'female',
    performance: '17:22',
  }),
  50,
  '2 km walk pass threshold',
);
assert.equal(
  scoreWalk(standards, {
    ageGroup: 'under-25',
    sex: 'female',
    performance: '17:23',
  }),
  0,
  '2 km walk fail threshold',
);

const fullAssessment = scorePfraAssessment({
  ageGroup: 'under-25',
  sex: 'male',
  standards,
  tables,
  whtr: '0.49',
  strengthEvent: 'push-up',
  strengthPerformance: '67',
  coreEvent: 'sit-up',
  corePerformance: '58',
  cardioEvent: 'two-mile-run',
  cardioPerformance: '13:25',
});

assert.equal(fullAssessment.total, 100, 'full PFRA max assessment');
assert.deepEqual(
  fullAssessment.scores,
  {
    body: 20,
    strength: 15,
    core: 15,
    cardio: 50,
  },
  'full PFRA component scores',
);

console.log(`Validated ${cases.length + 6} PFRA scoring examples`);
