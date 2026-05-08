import fs from 'node:fs';
const buildInfo = {
  generatedAt: new Date().toISOString(),
};

fs.writeFileSync('dev-build-info.json', `${JSON.stringify(buildInfo, null, 2)}\n`);
console.log(`Wrote dev-build-info.json for ${buildInfo.generatedAt}`);
