(function () {
  const pfraStatus = document.getElementById('pfra-status');
  const ageSelect = document.getElementById('age-sel');
  const sexSelect = document.getElementById('sex-sel');
  const whtrInput = document.getElementById('pfra-whtr');
  const strengthEvent = document.getElementById('pfra-strength-event');
  const strengthPerformance = document.getElementById('pfra-strength-performance');
  const strengthLabel = document.getElementById('pfra-strength-label');
  const coreEvent = document.getElementById('pfra-core-event');
  const corePerformance = document.getElementById('pfra-core-performance');
  const coreLabel = document.getElementById('pfra-core-label');
  const cardioEvent = document.getElementById('pfra-cardio-event');
  const cardioPerformance = document.getElementById('pfra-cardio-performance');
  const cardioLabel = document.getElementById('pfra-cardio-label');
  const bodyScoreText = document.getElementById('pfra-body-score');
  const strengthScoreText = document.getElementById('pfra-strength-score');
  const coreScoreText = document.getElementById('pfra-core-score');
  const cardioScoreText = document.getElementById('pfra-cardio-score');
  const pfraResult = document.getElementById('pfra-result');
  const pfraTables = {};

  const tableIds = [
    'push-up',
    'hand-release-push-up',
    'sit-up',
    'cross-leg-reverse-crunch',
    'forearm-plank',
    'two-mile-run',
    'hamr-20-meter',
  ];

  const eventDefaults = {
    'push-up': '67',
    'hand-release-push-up': '52',
    'sit-up': '58',
    'cross-leg-reverse-crunch': '60',
    'forearm-plank': '3:40',
    'two-mile-run': '13:25',
    'hamr-20-meter': '87',
  };

  const eventLabels = {
    'push-up': 'STRENGTH REPS:',
    'hand-release-push-up': 'STRENGTH REPS:',
    'sit-up': 'CORE REPS:',
    'cross-leg-reverse-crunch': 'CORE REPS:',
    'forearm-plank': 'CORE TIME:',
    'two-mile-run': 'CARDIO TIME:',
    'hamr-20-meter': 'CARDIO SHUTTLES:',
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

  function toSeconds(value) {
    if (typeof value === 'number') return value;
    const normalized = value.startsWith(':') ? `0${value}` : value;
    const [minutes, seconds] = normalized.split(':').map(Number);
    return minutes * 60 + seconds;
  }

  function comparePerformance(performance, cell, table) {
    const performanceValue = table.unit === 'min:sec' ? toSeconds(performance) : Number(performance);
    const thresholdValue = table.unit === 'min:sec' ? toSeconds(cell.value) : Number(cell.value);

    if (!Number.isFinite(performanceValue) || !Number.isFinite(thresholdValue)) return false;
    if (cell.atLeast) return performanceValue >= thresholdValue;
    if (cell.atMost) return performanceValue <= thresholdValue;
    if (table.higherIsBetter) return performanceValue >= thresholdValue;
    return performanceValue <= thresholdValue;
  }

  function scoreFromTable(table, ageGroup, sex, performance) {
    for (const row of table.rows) {
      const cell = row.values?.[ageGroup]?.[sex];
      if (cell && comparePerformance(performance, cell, table)) {
        return row.points;
      }
    }

    return 0;
  }

  function scoreWhtr(value) {
    const ratio = Number(value);
    if (!Number.isFinite(ratio)) return 0;
    if (ratio <= 0.49) return 20;
    if (ratio >= 0.60) return 0;

    const rounded = Math.round(ratio * 100) / 100;
    return {
      0.50: 19,
      0.51: 18,
      0.52: 17,
      0.53: 16,
      0.54: 15,
      0.55: 12.5,
      0.56: 10,
      0.57: 7.5,
      0.58: 5,
      0.59: 2.5,
    }[rounded] ?? 0;
  }

  function categoryForTotal(total) {
    if (total < 75) return 'Unsatisfactory';
    if (total < 90) return 'Satisfactory';
    return 'Excellent';
  }

  function formatScore(score) {
    return Number.isInteger(score) ? score.toFixed(0) : score.toFixed(1);
  }

  function updateLabelsAndDefaults(changedSelect) {
    if (changedSelect === strengthEvent) strengthPerformance.value = eventDefaults[strengthEvent.value];
    if (changedSelect === coreEvent) corePerformance.value = eventDefaults[coreEvent.value];
    if (changedSelect === cardioEvent) cardioPerformance.value = eventDefaults[cardioEvent.value];

    strengthLabel.innerText = eventLabels[strengthEvent.value];
    coreLabel.innerText = eventLabels[coreEvent.value];
    cardioLabel.innerText = eventLabels[cardioEvent.value];

    corePerformance.inputMode = coreEvent.value === 'forearm-plank' ? 'numeric' : 'numeric';
    cardioPerformance.inputMode = cardioEvent.value === 'two-mile-run' ? 'numeric' : 'numeric';
  }

  function updatePfraCalculator() {
    if (!pfraResult || !ageSelect || !sexSelect) return;

    updateLabelsAndDefaults();

    const ageGroup = legacyAgeToPfraAgeGroup(ageSelect.value);
    const sex = legacySexToPfraSex(sexSelect.value);
    const strengthTable = pfraTables[strengthEvent.value];
    const coreTable = pfraTables[coreEvent.value];
    const cardioTable = pfraTables[cardioEvent.value];

    if (!strengthTable || !coreTable || !cardioTable) {
      pfraResult.innerText = 'PFRA Total: standards not loaded';
      return;
    }

    const bodyScore = scoreWhtr(whtrInput.value);
    const strengthScore = scoreFromTable(strengthTable, ageGroup, sex, strengthPerformance.value.trim());
    const coreScore = scoreFromTable(coreTable, ageGroup, sex, corePerformance.value.trim());
    const cardioScore = scoreFromTable(cardioTable, ageGroup, sex, cardioPerformance.value.trim());
    const total = bodyScore + strengthScore + coreScore + cardioScore;

    bodyScoreText.innerText = formatScore(bodyScore);
    strengthScoreText.innerText = formatScore(strengthScore);
    coreScoreText.innerText = formatScore(coreScore);
    cardioScoreText.innerText = formatScore(cardioScore);
    pfraResult.innerText = `PFRA Total: ${total.toFixed(1)} - ${categoryForTotal(total)}`;
  }

  async function loadTables() {
    if (!pfraStatus) return;

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
      updatePfraCalculator();
    } catch (error) {
      pfraStatus.innerText = `Unable to load PFRA standards: ${error.message}`;
    }
  }

  if (pfraStatus && whtrInput && strengthEvent && coreEvent && cardioEvent) {
    pfraStatus.innerText = `Loading standards... 0/${tableIds.length}`;

    [whtrInput, strengthPerformance, corePerformance, cardioPerformance].forEach((input) => {
      input.addEventListener('input', updatePfraCalculator);
    });

    [ageSelect, sexSelect].forEach((select) => {
      select?.addEventListener('change', updatePfraCalculator);
    });

    [strengthEvent, coreEvent, cardioEvent].forEach((select) => {
      select.addEventListener('change', () => {
        updateLabelsAndDefaults(select);
        updatePfraCalculator();
      });
    });

    updateLabelsAndDefaults();
    loadTables();
  }
}());
