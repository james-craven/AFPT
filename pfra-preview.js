(function () {
  const pfraEvent = document.getElementById('pfra-event');
  const pfraPerformance = document.getElementById('pfra-performance');
  const pfraPerformanceLabel = document.getElementById('pfra-performance-label');
  const pfraResult = document.getElementById('pfra-result');
  const pfraStatus = document.getElementById('pfra-status');
  const ageSelect = document.getElementById('age-sel');
  const sexSelect = document.getElementById('sex-sel');
  const pfraTables = {};

  const pfraEventDefaults = {
    'push-up': '67',
    'hand-release-push-up': '52',
    'sit-up': '58',
    'cross-leg-reverse-crunch': '60',
    'forearm-plank': '3:40',
    'two-mile-run': '13:25',
    'hamr-20-meter': '87',
  };

  const pfraEventLabels = {
    'push-up': 'PERFORMANCE (reps):',
    'hand-release-push-up': 'PERFORMANCE (reps):',
    'sit-up': 'PERFORMANCE (reps):',
    'cross-leg-reverse-crunch': 'PERFORMANCE (reps):',
    'forearm-plank': 'PERFORMANCE (min:sec):',
    'two-mile-run': 'PERFORMANCE (min:sec):',
    'hamr-20-meter': 'PERFORMANCE (shuttles):',
  };

  function legacyAgeToPfraAgeGroup(age) {
    return {
      '< 25': 'under-25',
      '25-29': '25-29',
      '30-34': '30-34',
      '35-39': '35-39',
      '40-44': '40-44',
      '45-49': '45-49',
      '50-54': '50-54',
      '55-59': '55-59',
      '60+': '60-and-over',
    }[age];
  }

  function legacySexToPfraSex(sex) {
    return sex.toLowerCase();
  }

  function pfraToSeconds(value) {
    if (typeof value === 'number') return value;
    const normalized = value.startsWith(':') ? `0${value}` : value;
    const [minutes, seconds] = normalized.split(':').map(Number);
    return minutes * 60 + seconds;
  }

  function pfraComparePerformance(performance, cell, table) {
    const performanceValue = table.unit === 'min:sec' ? pfraToSeconds(performance) : Number(performance);
    const thresholdValue = table.unit === 'min:sec' ? pfraToSeconds(cell.value) : Number(cell.value);

    if (!Number.isFinite(performanceValue) || !Number.isFinite(thresholdValue)) return false;
    if (cell.atLeast) return performanceValue >= thresholdValue;
    if (cell.atMost) return performanceValue <= thresholdValue;
    if (table.higherIsBetter) return performanceValue >= thresholdValue;
    return performanceValue <= thresholdValue;
  }

  function pfraScoreFromTable(table, ageGroup, sex, performance) {
    for (const row of table.rows) {
      const cell = row.values?.[ageGroup]?.[sex];
      if (cell && pfraComparePerformance(performance, cell, table)) {
        return row.points;
      }
    }

    return 0;
  }

  function updatePfraPreview() {
    if (!pfraEvent || !pfraPerformance || !pfraPerformanceLabel || !pfraResult || !ageSelect || !sexSelect) return;

    const table = pfraTables[pfraEvent.value];
    const ageGroup = legacyAgeToPfraAgeGroup(ageSelect.value);
    const sex = legacySexToPfraSex(sexSelect.value);

    pfraPerformanceLabel.innerText = pfraEventLabels[pfraEvent.value] || 'PERFORMANCE:';

    if (!table) {
      pfraResult.innerText = 'Score: standards not loaded';
      return;
    }

    const points = pfraScoreFromTable(table, ageGroup, sex, pfraPerformance.value.trim());
    pfraResult.innerText = `Score: ${points.toFixed(1)} / ${table.rows[0].points.toFixed(1)}`;
  }

  async function loadPfraPreviewTables() {
    if (!pfraStatus) return;

    const tableIds = Object.keys(pfraEventDefaults);
    let loadedCount = 0;

    try {
      await Promise.all(tableIds.map(async (tableId) => {
        const response = await fetch(`./standards/extracted/tables/${tableId}.json?ts=${Date.now()}`, {
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error(`${tableId}.json returned ${response.status}`);
        }

        pfraTables[tableId] = await response.json();
        loadedCount += 1;
        pfraStatus.innerText = `Loading standards... ${loadedCount}/${tableIds.length}`;
      }));

      pfraStatus.innerText = 'Standards loaded from PFRA 2026 tables.';
      updatePfraPreview();
    } catch (error) {
      pfraStatus.innerText = `Unable to load PFRA standards: ${error.message}`;
    }
  }

  if (pfraEvent && pfraPerformance) {
    pfraStatus.innerText = 'Loading standards... 0/7';

    pfraEvent.addEventListener('change', () => {
      pfraPerformance.value = pfraEventDefaults[pfraEvent.value] || '';
      updatePfraPreview();
    });

    pfraPerformance.addEventListener('input', updatePfraPreview);
    ageSelect?.addEventListener('change', updatePfraPreview);
    sexSelect?.addEventListener('change', updatePfraPreview);
    loadPfraPreviewTables();
  }
}());
