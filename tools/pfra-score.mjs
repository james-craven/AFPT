import fs from 'node:fs';
import path from 'node:path';
export {
  categoryForTotal,
  comparePerformance,
  firstScoringCellValue,
  formatPerformance,
  formatScore,
  scoreFromTable,
  scorePfraAssessment,
  scoreWalk,
  scoreWhtr,
  secondsToTimeString,
  toSeconds,
  topCellValue,
  walkMaximumTime,
} from '../src/pfra/scoring.mjs';

export function loadTable(tablePath) {
  return JSON.parse(fs.readFileSync(tablePath, 'utf8'));
}

export function tablePathFromId(tableId, rootDir = process.cwd()) {
  return path.join(rootDir, 'standards/extracted/tables', `${tableId}.json`);
}
