import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.resolve(__dirname, '../14WS-500/data.json');
const [totalArg, ...noteParts] = process.argv.slice(2);

if (!totalArg) {
  console.error('Usage: npm run update:14ws-500 -- <totalMiles> [status note]');
  process.exit(1);
}

const totalMiles = Number(totalArg);
if (!Number.isFinite(totalMiles) || totalMiles < 0) {
  console.error('totalMiles must be a non-negative number.');
  process.exit(1);
}

const raw = await fs.readFile(dataPath, 'utf8');
const data = JSON.parse(raw);

data.totalMiles = Math.round(totalMiles * 10) / 10;
data.updatedAt = new Date().toISOString();

const note = noteParts.join(' ').trim();
if (note) data.statusNote = note;

await fs.writeFile(dataPath, `${JSON.stringify(data, null, 2)}\n`);

console.log(`Updated 14WS 500-Mile Challenge total to ${data.totalMiles} miles.`);
