export const PFRA_STANDARDS_PATH = './standards/af-pfra-2026.json';

function cacheBusted(url, shouldBustCache) {
  if (!shouldBustCache) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}ts=${Date.now()}`;
}

function tableIdFromPath(tableFile) {
  return tableFile?.split('/').pop()?.replace(/\.json$/, '');
}

async function fetchJson(fetchImpl, url, options = {}) {
  const response = await fetchImpl(url, options);

  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`);
  }

  return response.json();
}

export function tableRefsFromStandards(standards) {
  const refs = [];
  const components = standards?.components || {};

  for (const component of Object.values(components)) {
    for (const event of Object.values(component.events || {})) {
      if (!event.tableFile) continue;

      refs.push({
        id: tableIdFromPath(event.tableFile),
        path: event.tableFile,
      });
    }
  }

  return refs;
}

export async function loadPfraStandards({
  cacheBust = false,
  fetchImpl = globalThis.fetch,
  onProgress,
  standardsPath = PFRA_STANDARDS_PATH,
} = {}) {
  if (typeof fetchImpl !== 'function') {
    throw new Error('A fetch implementation is required to load PFRA standards.');
  }

  const standards = await fetchJson(fetchImpl, cacheBusted(standardsPath, cacheBust), {
    cache: cacheBust ? 'no-store' : 'default',
  });
  const tableRefs = tableRefsFromStandards(standards);
  const tables = {};
  let loadedCount = 0;

  await Promise.all(tableRefs.map(async ({ id, path }) => {
    tables[id] = await fetchJson(fetchImpl, cacheBusted(`./${path}`, cacheBust), {
      cache: cacheBust ? 'no-store' : 'default',
    });
    loadedCount += 1;
    onProgress?.({
      loaded: loadedCount,
      total: tableRefs.length,
      tableId: id,
    });
  }));

  return {
    standards,
    tableRefs,
    tables,
  };
}

export function walkMaximumTime(standards, ageGroup, sex) {
  const walkAgeGroup = {
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

  return standards?.components
    ?.cardiorespiratoryFitness
    ?.events
    ?.twoKilometerWalk
    ?.maximumTimes
    ?.[sex]
    ?.[walkAgeGroup];
}

