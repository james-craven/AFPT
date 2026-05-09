import fs from 'node:fs';
import path from 'node:path';

function toSeconds(value) {
  if (typeof value === 'number') return value;
  const normalized = value.startsWith(':') ? `0${value}` : value;
  const [minutes, seconds] = normalized.split(':').map(Number);
  return minutes * 60 + seconds;
}

function comparePerformance(performance, cell, higherIsBetter, unit) {
  const performanceValue = unit === 'min:sec' ? toSeconds(performance) : Number(performance);
  const thresholdValue = unit === 'min:sec' ? toSeconds(cell.value) : Number(cell.value);

  if (cell.atLeast) return performanceValue >= thresholdValue;
  if (cell.atMost) return performanceValue <= thresholdValue;
  if (higherIsBetter) return performanceValue >= thresholdValue;
  return performanceValue <= thresholdValue;
}

export function loadTable(tablePath) {
  return JSON.parse(fs.readFileSync(tablePath, 'utf8'));
}

export function scoreFromTable(table, { ageGroup, sex, performance }) {
  for (const row of table.rows) {
    const cell = row.values?.[ageGroup]?.[sex];
    if (!cell) {
      throw new Error(`Missing table cell for ${ageGroup}/${sex}`);
    }

    if (comparePerformance(performance, cell, table.higherIsBetter, table.unit)) {
      return {
        points: row.points,
        matchedCell: cell,
      };
    }
  }

  return {
    points: 0,
    matchedCell: null,
  };
}

export function tablePathFromId(tableId, rootDir = process.cwd()) {
  return path.join(rootDir, 'standards/extracted/tables', `${tableId}.json`);
}
