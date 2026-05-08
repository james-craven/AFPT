import fs from 'node:fs';
import { execSync } from 'node:child_process';

function run(command) {
  try {
    return execSync(command, { encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

const buildInfo = {
  generatedAt: new Date().toISOString(),
  gitCommit: run('git rev-parse --short HEAD'),
  gitBranch: run('git branch --show-current'),
};

fs.writeFileSync('dev-build-info.json', `${JSON.stringify(buildInfo, null, 2)}\n`);
console.log(`Wrote dev-build-info.json for ${buildInfo.generatedAt}`);
