export function toSeconds(value) {
  if (value === undefined || value === null || value === '') return NaN;
  if (typeof value === 'number') return value;

  const normalized = value.startsWith(':') ? `0${value}` : value;
  const [minutes, seconds] = normalized.split(':').map(Number);
  return (minutes * 60) + seconds;
}

export function secondsToTimeString(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function formatScore(score) {
  return Number.isInteger(score) ? score.toFixed(0) : score.toFixed(1);
}

export function truncateWhtr(value) {
  const ratio = Number(value);
  if (!Number.isFinite(ratio)) return NaN;
  return Math.trunc((ratio + Number.EPSILON) * 100) / 100;
}

export function formatWhtr(value) {
  const truncated = truncateWhtr(value);
  return Number.isFinite(truncated) ? truncated.toFixed(2) : '';
}

export function categoryForTotal(total) {
  if (total < 75) return 'Unsatisfactory';
  if (total < 90) return 'Satisfactory';
  return 'Excellent';
}

export function formatPerformance(value, table) {
  if (value === undefined) return '--';
  if (table?.unit === 'min:sec' && typeof value === 'number') {
    return secondsToTimeString(value);
  }

  return value;
}

export function comparePerformance(performance, cell, table) {
  const performanceValue = table.unit === 'min:sec' ? toSeconds(performance) : Number(performance);
  const thresholdValue = table.unit === 'min:sec' ? toSeconds(cell.value) : Number(cell.value);

  if (!Number.isFinite(performanceValue) || !Number.isFinite(thresholdValue)) return false;
  if (cell.atLeast) return performanceValue >= thresholdValue;
  if (cell.atMost) return performanceValue <= thresholdValue;
  if (table.higherIsBetter) return performanceValue >= thresholdValue;
  return performanceValue <= thresholdValue;
}

export function scoreFromTable(table, { ageGroup, sex, performance }) {
  for (const row of table.rows) {
    const cell = row.values?.[ageGroup]?.[sex];
    if (!cell) {
      throw new Error(`Missing table cell for ${table.id || 'PFRA table'} ${ageGroup}/${sex}`);
    }

    if (comparePerformance(performance, cell, table)) {
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

export function topCellValue(table, ageGroup, sex) {
  return table?.rows?.[0]?.values?.[ageGroup]?.[sex]?.value;
}

export function firstScoringCellValue(table, ageGroup, sex) {
  for (let index = table.rows.length - 1; index >= 0; index -= 1) {
    const cell = table.rows[index].values?.[ageGroup]?.[sex];
    if (cell?.value !== undefined) return cell.value;
  }

  return undefined;
}

export function scoreWhtr(value, standards) {
  const ratio = Number(value);
  if (!Number.isFinite(ratio)) return 0;

  const rules = standards?.components?.bodyComposition?.events?.waistToHeightRatio?.scoring || [];
  const truncated = truncateWhtr(ratio);

  for (const rule of rules) {
    if (rule.maxInclusive !== undefined && truncated <= rule.maxInclusive) return rule.points;
    if (rule.minInclusive !== undefined && truncated >= rule.minInclusive) return rule.points;
    if (rule.exact !== undefined && truncated === rule.exact) return rule.points;
  }

  return 0;
}

export function pfraAgeToWalkAgeGroup(ageGroup) {
  return {
    'under-25': 'under-30',
    '25-29': 'under-30',
    '30-34': '30-39',
    '35-39': '30-39',
    '40-44': '40-49',
    '45-49': '40-49',
    '50-54': '50-59',
    '55-59': '50-59',
    '60-and-over': '60-and-over',
  }[ageGroup];
}

export function walkMaximumTime(standards, ageGroup, sex) {
  const walkAgeGroup = pfraAgeToWalkAgeGroup(ageGroup);
  return standards?.components
    ?.cardiorespiratoryFitness
    ?.events
    ?.twoKilometerWalk
    ?.maximumTimes
    ?.[sex]
    ?.[walkAgeGroup];
}

export function scoreWalk(standards, { ageGroup, sex, performance }) {
  const maxTime = walkMaximumTime(standards, ageGroup, sex);
  const performanceValue = toSeconds(performance);
  const maxValue = toSeconds(maxTime);

  if (!Number.isFinite(performanceValue) || !Number.isFinite(maxValue)) return 0;
  return performanceValue <= maxValue ? 50 : 0;
}

export function getAltitudeGroup(altitudeFt) {
  if (altitudeFt >= 6600) return 4;
  if (altitudeFt >= 6000) return 3;
  if (altitudeFt >= 5500) return 2;
  if (altitudeFt >= 5250) return 1;
  return 0;
}

export function applyHamrAltitudeAdjustment(performance, altitudeGroup) {
  if (!altitudeGroup || altitudeGroup <= 0) return performance;
  return Number(performance) + altitudeGroup;
}

export function applyWalkAltitudeAdjustment(altitudeWalkTable, walkAgeGroup, altitudeGroup) {
  return altitudeWalkTable?.maximumTimes?.[walkAgeGroup]?.[altitudeGroup ?? 0] ?? null;
}

export function applyRunAltitudeAdjustment(performanceSeconds, altitudeGroup, runAltitudeTable) {
  if (!altitudeGroup || altitudeGroup <= 0) return performanceSeconds;
  if (!runAltitudeTable?.rows?.length) return performanceSeconds;

  const groupKey = `group${altitudeGroup}`;
  const rows = runAltitudeTable.rows;

  let correctionRow = rows[rows.length - 1];
  for (const row of rows) {
    if (performanceSeconds <= toSeconds(row.runTime)) {
      correctionRow = row;
      break;
    }
  }

  const correctionSec = toSeconds(correctionRow[groupKey]);
  if (!Number.isFinite(correctionSec) || correctionSec <= 0) return performanceSeconds;
  return Math.max(0, performanceSeconds - correctionSec);
}

export function scorePfraAssessment({
  ageGroup,
  cardioEvent,
  cardioPerformance,
  coreEvent,
  corePerformance,
  exemptions = {},
  sex,
  standards,
  strengthEvent,
  strengthPerformance,
  tables,
  whtr,
}) {
  const strengthTable = tables[strengthEvent];
  const coreTable = tables[coreEvent];
  const cardioTable = cardioEvent === 'two-kilometer-walk' ? null : tables[cardioEvent];

  const bodyScore = scoreWhtr(whtr, standards);
  const strengthScore = exemptions.strength
    ? 0
    : scoreFromTable(strengthTable, { ageGroup, sex, performance: strengthPerformance }).points;
  const coreScore = exemptions.core
    ? 0
    : scoreFromTable(coreTable, { ageGroup, sex, performance: corePerformance }).points;
  const cardioScore = exemptions.cardio
    ? 0
    : cardioEvent === 'two-kilometer-walk'
      ? scoreWalk(standards, { ageGroup, sex, performance: cardioPerformance })
      : scoreFromTable(cardioTable, { ageGroup, sex, performance: cardioPerformance }).points;

  const componentMax = standards?.components || {};
  const totalPossible = Object.values(componentMax).reduce(
    (sum, component) => sum + Number(component.maxPoints || 0),
    0,
  );
  const availablePoints = totalPossible
    - (exemptions.strength ? Number(componentMax.muscularStrength?.maxPoints || 0) : 0)
    - (exemptions.core ? Number(componentMax.coreEndurance?.maxPoints || 0) : 0)
    - (exemptions.cardio ? Number(componentMax.cardiorespiratoryFitness?.maxPoints || 0) : 0);
  const rawTotal = bodyScore + strengthScore + coreScore + cardioScore;
  const total = availablePoints > 0 ? (rawTotal / availablePoints) * 100 : rawTotal;

  return {
    availablePoints,
    rawTotal,
    scores: {
      body: bodyScore,
      strength: strengthScore,
      core: coreScore,
      cardio: cardioScore,
    },
    total,
    category: categoryForTotal(total),
    tables: {
      strength: strengthTable,
      core: coreTable,
      cardio: cardioTable,
    },
  };
}
