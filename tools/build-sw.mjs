import { generateSW } from 'workbox-build';
import workboxConfig from '../workbox-config.js';

const { count, size, warnings } = await generateSW(workboxConfig);

for (const warning of warnings) {
  console.warn(warning);
}

console.log(`Generated sw.js with ${count} cached files (${size} bytes).`);
