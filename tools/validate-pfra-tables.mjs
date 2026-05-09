import assert from 'node:assert/strict';
import { loadTable, scoreFromTable, tablePathFromId } from './pfra-score.mjs';

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

console.log(`Validated ${cases.length} PFRA scoring examples`);
