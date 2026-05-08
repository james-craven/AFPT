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
    pageNumber: 2,
    unit: 'reps',
    higherIsBetter: true,
  },
  {
    id: 'hand-release-push-up',
    eventKey: 'handReleasePushUp',
    title: 'HAND RELEASE PUSH-UP SCORING STANDARDS (reps)',
    pageNumber: 3,
    unit: 'reps',
    higherIsBetter: true,
  },
  {
    id: 'sit-up',
    eventKey: 'sitUp',
    title: 'SIT-UP SCORING STANDARDS (reps)',
    pageNumber: 4,
    unit: 'reps',
    higherIsBetter: true,
  },
  {
    id: 'cross-leg-reverse-crunch',
    eventKey: 'crossLegReverseCrunch',
    title: 'CROSS-LEG REVERSE CRUNCH SCORING STANDARDS (reps)',
    pageNumber: 5,
    unit: 'reps',
    higherIsBetter: true,
  },
  {
    id: 'forearm-plank',
    eventKey: 'forearmPlank',
    title: 'FOREARM PLANK SCORING STANDARDS (min:sec)',
    pageNumber: 6,
    unit: 'min:sec',
    higherIsBetter: true,
  },
  {
    id: 'two-mile-run',
    eventKey: 'twoMileRun',
    title: '2 MILE RUN SCORING STANDARDS (min:sec)',
    pageNumber: 7,
    unit: 'min:sec',
    higherIsBetter: false,
  },
  {
    id: 'hamr-20-meter',
    eventKey: 'hamr20Meter',
    title: '20-METER HAMR SCORING STANDARDS (SHUTTLES)',
    pageNumber: 8,
    unit: 'shuttles',
    higherIsBetter: true,
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

function extractTable(pageLines, table) {
  const rows = pageLines
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
      pdfPage: table.pageNumber,
    },
    needsReview: table.needsReview || false,
    ageGroups,
    sexes,
    rows,
  };
}

const text = fs.readFileSync(sourcePath, 'utf8');
const pageTexts = text.split('\f');

fs.mkdirSync(outputDir, { recursive: true });

for (const table of tables) {
  const pageText = pageTexts[table.pageNumber - 1];
  if (!pageText) {
    throw new Error(`Could not find extracted text for PDF page ${table.pageNumber}`);
  }

  const extracted = extractTable(pageText.split(/\r?\n/), table);
  const outputPath = path.join(outputDir, `${table.id}.json`);
  fs.writeFileSync(outputPath, `${JSON.stringify(extracted, null, 2)}\n`);
  console.log(`Wrote ${path.relative(rootDir, outputPath)} (${extracted.rows.length} rows)`);
}
