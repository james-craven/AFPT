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
  const standardsMode = document.getElementById('standards-mode');
  const totalScoreParagraph = document.getElementById('score-txt');
  const legacyPushSelect = document.getElementById('push-sel');
  const legacyPushInput = document.getElementById('push-txt');
  const legacyPushSlider = document.getElementById('push-slider');
  const legacySitSelect = document.getElementById('sit-sel');
  const legacySitInput = document.getElementById('sit-txt');
  const legacySitSlider = document.getElementById('sit-slider');
  const legacyPlankMinuteInput = document.getElementById('plankmintxt');
  const legacyCardioSelect = document.getElementById('cardio-sel');
  const legacyRunMinuteInput = document.getElementById('run-mintxt');
  const legacyRunSecondInput = document.getElementById('run-sectxt');
  const legacyRunSlider = document.getElementById('run-slider');
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

  function isPfraMode() {
    return standardsMode?.value === 'pfra';
  }

  function setMainScore(total) {
    if (!totalScoreParagraph || !isPfraMode()) return;

    const category = categoryForTotal(total);
    const failText = total < 75 ? 'Unsatisfactory!' : `${category}!`;
    totalScoreParagraph.innerHTML = `PFRA Total Score: <span id="t">${total.toFixed(1)}<br>${failText}</span>`;

    const totalText = document.getElementById('t');
    if (!totalText) return;

    if (total < 75) {
      totalText.classList.add('score-txt-red');
      totalText.classList.remove('score-txt-green');
    } else {
      totalText.classList.add('score-txt-green');
      totalText.classList.remove('score-txt-red');
    }
  }

  function restoreLegacyMainScore() {
    if (isPfraMode() || typeof window.updateScoreMinMaxText !== 'function') return;
    window.updateScoreMinMaxText();
  }

  function topCellValue(table, ageGroup, sex) {
    return table?.rows?.[0]?.values?.[ageGroup]?.[sex]?.value;
  }

  function firstScoringCellValue(table, ageGroup, sex) {
    for (let index = table.rows.length - 1; index >= 0; index -= 1) {
      const cell = table.rows[index].values?.[ageGroup]?.[sex];
      if (cell?.value !== undefined) return cell.value;
    }

    return undefined;
  }

  function setSliderRange(slider, maxValue, minValue = 0) {
    if (!slider || maxValue === undefined) return;

    const numericMax = Number(maxValue);
    const numericMin = Number(minValue);
    if (!Number.isFinite(numericMax) || !Number.isFinite(numericMin)) return;

    slider.min = numericMin;
    slider.max = numericMax;

    if (Number(slider.value) > numericMax) {
      slider.value = numericMax;
    }

    if (Number(slider.value) < numericMin) {
      slider.value = numericMin;
    }
  }

  function updateLegacySliderRanges() {
    const ageGroup = legacyAgeToPfraAgeGroup(ageSelect.value);
    const sex = legacySexToPfraSex(sexSelect.value);

    if (legacyPushSelect?.value === 'Pushups') {
      setSliderRange(legacyPushSlider, topCellValue(pfraTables['push-up'], ageGroup, sex));
    } else if (legacyPushSelect?.value === 'Hand-Release') {
      setSliderRange(legacyPushSlider, topCellValue(pfraTables['hand-release-push-up'], ageGroup, sex));
    }

    if (legacySitSelect?.value === 'Situps') {
      setSliderRange(legacySitSlider, topCellValue(pfraTables['sit-up'], ageGroup, sex));
    } else if (legacySitSelect?.value === 'Reverse Crunch') {
      setSliderRange(legacySitSlider, topCellValue(pfraTables['cross-leg-reverse-crunch'], ageGroup, sex));
    } else if (legacySitSelect?.value === 'Plank') {
      setSliderRange(
        legacySitSlider,
        toSeconds(topCellValue(pfraTables['forearm-plank'], ageGroup, sex)),
        toSeconds(firstScoringCellValue(pfraTables['forearm-plank'], ageGroup, sex)),
      );
    }

    if (legacyCardioSelect?.value === 'Shuttle Run') {
      setSliderRange(
        legacyRunSlider,
        topCellValue(pfraTables['hamr-20-meter'], ageGroup, sex),
        firstScoringCellValue(pfraTables['hamr-20-meter'], ageGroup, sex),
      );
    }
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

  function syncFromLegacyCalculator() {
    updateLegacySliderRanges();

    if (legacyPushSelect?.value === 'Pushups') {
      strengthEvent.value = 'push-up';
      strengthPerformance.value = legacyPushInput.value || eventDefaults[strengthEvent.value];
    } else if (legacyPushSelect?.value === 'Hand-Release') {
      strengthEvent.value = 'hand-release-push-up';
      strengthPerformance.value = legacyPushInput.value || eventDefaults[strengthEvent.value];
    }

    if (legacySitSelect?.value === 'Situps') {
      coreEvent.value = 'sit-up';
      corePerformance.value = legacySitInput.value || eventDefaults[coreEvent.value];
    } else if (legacySitSelect?.value === 'Reverse Crunch') {
      coreEvent.value = 'cross-leg-reverse-crunch';
      corePerformance.value = legacySitInput.value || eventDefaults[coreEvent.value];
    } else if (legacySitSelect?.value === 'Plank') {
      coreEvent.value = 'forearm-plank';
      corePerformance.value = `${Number(legacySitInput.value || 0)}:${String(Number(legacyPlankMinuteInput.value || 0)).padStart(2, '0')}`;
    }

    if (legacyCardioSelect?.value === 'Shuttle Run') {
      cardioEvent.value = 'hamr-20-meter';
      cardioPerformance.value = legacyRunSecondInput.value || eventDefaults[cardioEvent.value];
    } else if (cardioEvent.value === 'hamr-20-meter') {
      cardioEvent.value = 'two-mile-run';
      cardioPerformance.value = eventDefaults[cardioEvent.value];
    } else if (legacyCardioSelect?.value === '1.5 Mile' && cardioEvent.value === 'two-mile-run') {
      const minutes = Number(legacyRunMinuteInput.value || 0);
      const seconds = Number(legacyRunSecondInput.value || 0);
      if (minutes >= 12) {
        cardioPerformance.value = `${minutes}:${String(seconds).padStart(2, '0')}`;
      }
    }

    updateLabelsAndDefaults();
    updatePfraCalculator();
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
    setMainScore(total);
    restoreLegacyMainScore();
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
      syncFromLegacyCalculator();
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
      select?.addEventListener('change', syncFromLegacyCalculator);
    });

    standardsMode?.addEventListener('change', syncFromLegacyCalculator);

    [
      legacyPushSelect,
      legacyPushInput,
      legacyPushSlider,
      legacySitSelect,
      legacySitInput,
      legacySitSlider,
      legacyPlankMinuteInput,
      legacyCardioSelect,
      legacyRunMinuteInput,
      legacyRunSecondInput,
      legacyRunSlider,
    ].forEach((control) => {
      control?.addEventListener('change', syncFromLegacyCalculator);
      control?.addEventListener('input', syncFromLegacyCalculator);
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
