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

const FIXTURE_PATH = 'tools/fixtures/pfra-scoring-examples.json';
const standards = JSON.parse(fs.readFileSync('standards/af-pfra-2026.json', 'utf8'));
const fixture = JSON.parse(fs.readFileSync(FIXTURE_PATH, 'utf8'));

function assertNear(actual, expected, message) {
  assert.ok(
    Math.abs(actual - expected) < 0.000001,
    `${message}: expected ${expected}, received ${actual}`,
  );
}

function fixtureCaseIds() {
  return [
    ...fixture.tableCases,
    ...fixture.whtrCases,
    ...fixture.walkCases,
    ...fixture.assessmentCases,
  ].map((testCase) => testCase.id);
}

function tableIdsFromFixture() {
  const tableIds = new Set(fixture.tableCases.map((testCase) => testCase.tableId));

  for (const testCase of fixture.assessmentCases) {
    for (const eventId of [
      testCase.strengthEvent,
      testCase.coreEvent,
      testCase.cardioEvent,
    ]) {
      if (eventId && eventId !== 'two-kilometer-walk') tableIds.add(eventId);
    }
  }

  return [...tableIds].sort();
}

const caseIds = fixtureCaseIds();
assert.equal(new Set(caseIds).size, caseIds.length, `${FIXTURE_PATH} case ids must be unique`);

const tables = Object.fromEntries(
  tableIdsFromFixture().map((tableId) => [tableId, loadTable(tablePathFromId(tableId))]),
);

for (const testCase of fixture.tableCases) {
  const table = tables[testCase.tableId];
  const result = scoreFromTable(table, testCase);
  const label = `${testCase.id}: ${testCase.tableId} ${testCase.ageGroup}/${testCase.sex} ${testCase.performance}`;

  assert.equal(result.points, testCase.expectedPoints, label);

  if (Object.hasOwn(testCase, 'expectedMatchedValue')) {
    assert.deepEqual(result.matchedCell?.value ?? null, testCase.expectedMatchedValue, label);
  }
}

for (const testCase of fixture.whtrCases) {
  assert.equal(
    scoreWhtr(testCase.value, standards),
    testCase.expectedPoints,
    `${testCase.id}: WHtR ${testCase.value}`,
  );
}

for (const testCase of fixture.walkCases) {
  assert.equal(
    scoreWalk(standards, testCase),
    testCase.expectedPoints,
    `${testCase.id}: walk ${testCase.ageGroup}/${testCase.sex} ${testCase.performance}`,
  );
}

for (const testCase of fixture.assessmentCases) {
  const result = scorePfraAssessment({
    ...testCase,
    standards,
    tables,
  });

  assert.deepEqual(result.scores, testCase.expectedScores, `${testCase.id}: component scores`);
  assertNear(result.rawTotal, testCase.expectedRawTotal, `${testCase.id}: raw total`);
  assertNear(result.availablePoints, testCase.expectedAvailablePoints, `${testCase.id}: available points`);
  assertNear(result.total, testCase.expectedTotal, `${testCase.id}: total`);
  assert.equal(result.category, testCase.expectedCategory, `${testCase.id}: category`);
}

const totalExamples = fixture.tableCases.length
  + fixture.whtrCases.length
  + fixture.walkCases.length
  + fixture.assessmentCases.length;

console.log(
  `Validated ${totalExamples} PFRA scoring examples `
  + `(${fixture.tableCases.length} table, `
  + `${fixture.whtrCases.length} WHtR, `
  + `${fixture.walkCases.length} walk, `
  + `${fixture.assessmentCases.length} assessment)`,
);
