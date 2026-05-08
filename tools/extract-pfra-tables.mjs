import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const sourcePath = path.join(rootDir, 'standards/extracted/PFRA-Scoring-Charts.txt');
const outputDir = path.join(rootDir, 'standards/extracted/tables');

const ageGroups = [
  'under-25',
  '25-29',
  '30-34',
  '35-39',
  '40-44',
  '45-49',
  '50-54',
  '55-59',
  '60-and-over',
];

const sexes = ['male', 'female'];

const tables = [
  {
    id: 'push-up',
    eventKey: 'pushUp',
    title: 'PUSH-UP SCORING STANDARDS (reps)',
    nextTitle: 'HAND RELEASE PUSH-UP SCORING STANDARDS (reps)',
    unit: 'reps',
    higherIsBetter: true,
  },
  {
    id: 'hand-release-push-up',
    eventKey: 'handReleasePushUp',
    title: 'HAND RELEASE PUSH-UP SCORING STANDARDS (reps)',
    nextTitle: 'SIT-UP SCORING STANDARDS (reps)',
    unit: 'reps',
    higherIsBetter: true,
  },
  {
    id: 'sit-up',
    eventKey: 'sitUp',
    title: 'SIT-UP SCORING STANDARDS (reps)',
    nextTitle: 'CROSS-LEG REVERSE CRUNCH SCORING STANDARDS (reps)',
    unit: 'reps',
    higherIsBetter: true,
  },
  {
    id: 'cross-leg-reverse-crunch',
    eventKey: 'crossLegReverseCrunch',
    title: 'CROSS-LEG REVERSE CRUNCH SCORING STANDARDS (reps)',
    nextTitle: 'FOREARM PLANK SCORING STANDARDS (min:sec)',
    unit: 'min:sec',
    higherIsBetter: true,
    needsReview:
      'PDF text title says reps/cross-leg reverse crunch, but extracted values are min:sec. Verify visually before calculator use.',
  },
  {
    id: 'two-mile-run',
    eventKey: 'twoMileRun',
    title: 'FOREARM PLANK SCORING STANDARDS (min:sec)',
    nextTitle: '2 MILE RUN SCORING STANDARDS (min:sec)',
    unit: 'min:sec',
    higherIsBetter: false,
    needsReview:
      'PDF text title appears offset; values match 2-mile run scoring shape. Verify visually before calculator use.',
  },
];

function parseCell(raw) {
  const clean = raw.replace(/\*/g, '');
  const minimum = raw.includes('*');
  const atLeast = clean.startsWith('≥');
  const atMost = clean.startsWith('≤');
  const value = clean.replace(/^[≥≤]\s*/, '');
  const numericValue = Number(value);

  return {
    value: Number.isFinite(numericValue) ? numericValue : value,
    atLeast,
    atMost,
    minimum,
  };
}

function tokenizeScoreRow(line) {
  const rawTokens = line.trim().split(/\s+/);
  const tokens = [];

  for (let index = 0; index < rawTokens.length; index += 1) {
    const token = rawTokens[index];
    if ((token === '≥' || token === '≤') && rawTokens[index + 1]) {
      tokens.push(`${token}${rawTokens[index + 1]}`);
      index += 1;
    } else {
      tokens.push(token);
    }
  }

  return tokens;
}

function parseScoreRow(line) {
  const tokens = tokenizeScoreRow(line);
  const points = Number(tokens[0]);
  const trailingPoints = Number(tokens[tokens.length - 1]);

  if (!Number.isFinite(points) || points !== trailingPoints) {
    return null;
  }

  const rawValues = tokens.slice(1, -1);
  if (rawValues.length !== ageGroups.length * sexes.length) {
    return null;
  }

  const values = {};
  let index = 0;

  for (const ageGroup of ageGroups) {
    values[ageGroup] = {};
    for (const sex of sexes) {
      values[ageGroup][sex] = parseCell(rawValues[index]);
      index += 1;
    }
  }

  return { points, values };
}

function extractTable(lines, table) {
  const start = lines.findIndex(line => line.includes(table.title));
  const end = lines.findIndex((line, index) => index > start && line.includes(table.nextTitle));

  if (start === -1) {
    throw new Error(`Could not find table title: ${table.title}`);
  }

  if (end === -1) {
    throw new Error(`Could not find next table title: ${table.nextTitle}`);
  }

  const rows = lines
    .slice(start + 1, end)
    .map(parseScoreRow)
    .filter(Boolean);

  if (rows.length === 0) {
    throw new Error(`No score rows parsed for ${table.title}`);
  }

  return {
    id: table.id,
    eventKey: table.eventKey,
    title: table.title,
    unit: table.unit,
    higherIsBetter: table.higherIsBetter,
    source: {
      file: 'standards/extracted/PFRA-Scoring-Charts.txt',
      startLine: start + 1,
      endLine: end + 1,
    },
    needsReview: table.needsReview || false,
    ageGroups,
    sexes,
    rows,
  };
}

const text = fs.readFileSync(sourcePath, 'utf8');
const lines = text.split(/\r?\n/);

fs.mkdirSync(outputDir, { recursive: true });

for (const table of tables) {
  const extracted = extractTable(lines, table);
  const outputPath = path.join(outputDir, `${table.id}.json`);
  fs.writeFileSync(outputPath, `${JSON.stringify(extracted, null, 2)}\n`);
  console.log(`Wrote ${path.relative(rootDir, outputPath)} (${extracted.rows.length} rows)`);
}
