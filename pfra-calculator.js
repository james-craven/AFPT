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
  const legacyStrengthText = document.getElementById('push-txt-p');
  const legacyCoreText = document.getElementById('sit-txt-p');
  const legacyCardioText = document.getElementById('run-txt-p');
  const legacyPushSelect = document.getElementById('push-sel');
  const legacyPushInput = document.getElementById('push-txt');
  const legacyPushSlider = document.getElementById('push-slider');
  const legacySitSelect = document.getElementById('sit-sel');
  const legacySitInput = document.getElementById('sit-txt');
  const legacySitSlider = document.getElementById('sit-slider');
  const legacyPlankMinuteInput = document.getElementById('plankmintxt');
  const legacyCardioSelect = document.getElementById('cardio-sel');
  const legacyTwoMileOption = legacyCardioSelect?.querySelector('option[value="1.5 Mile"]');
  const legacyHamrOption = legacyCardioSelect?.querySelector('option[value="Shuttle Run"]');
  const legacyWalkOption = legacyCardioSelect?.querySelector('option[value="Walk"]');
  const legacyRunMinuteInput = document.getElementById('run-mintxt');
  const legacyRunSecondInput = document.getElementById('run-sectxt');
  const legacyRunSlider = document.getElementById('run-slider');
  const legacyLapText = document.getElementById('run-lap-times');
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
    'two-kilometer-walk': '16:16',
  };

  const eventLabels = {
    'push-up': 'STRENGTH REPS:',
    'hand-release-push-up': 'STRENGTH REPS:',
    'sit-up': 'CORE REPS:',
    'cross-leg-reverse-crunch': 'CORE REPS:',
    'forearm-plank': 'CORE TIME:',
    'two-mile-run': 'CARDIO TIME:',
    'hamr-20-meter': 'CARDIO SHUTTLES:',
    'two-kilometer-walk': 'CARDIO WALK TIME:',
  };

  const walkMaximumTimes = {
    male: {
      'under-30': '16:16',
      '30-39': '16:18',
      '40-49': '16:23',
      '50-59': '16:40',
      '60-and-over': '16:58',
    },
    female: {
      'under-30': '17:22',
      '30-39': '17:28',
      '40-49': '17:49',
      '50-59': '18:11',
      '60-and-over': '18:53',
    },
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

  function pfraAgeToWalkAgeGroup(ageGroup) {
    return {
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

  function walkMaximumTime(ageGroup, sex) {
    const walkAgeGroup = pfraAgeToWalkAgeGroup(ageGroup);
    return walkMaximumTimes[sex]?.[walkAgeGroup];
  }

  function scoreWalk(ageGroup, sex, performance) {
    const maxTime = walkMaximumTime(ageGroup, sex);
    const performanceValue = toSeconds(performance);
    const maxValue = toSeconds(maxTime);

    if (!Number.isFinite(performanceValue) || !Number.isFinite(maxValue)) return 0;
    return performanceValue <= maxValue ? 50 : 0;
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

  function componentExemptions() {
    return {
      strength: legacyPushSelect?.value === 'Exempt',
      core: legacySitSelect?.value === 'Exempt',
      cardio: legacyCardioSelect?.value === 'Exempt',
    };
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

  function formatPerformance(value, table) {
    if (value === undefined) return '--';
    if (table?.unit === 'min:sec' && typeof value === 'number') {
      const minutes = Math.floor(value / 60);
      const seconds = value % 60;
      return `${minutes}:${String(seconds).padStart(2, '0')}`;
    }

    return value;
  }

  function secondsToTimeString(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
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
    if (!isPfraMode()) return;

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
    } else if (legacyCardioSelect?.value === '1.5 Mile') {
      setSliderRange(
        legacyRunSlider,
        toSeconds(firstScoringCellValue(pfraTables['two-mile-run'], ageGroup, sex)),
        toSeconds(topCellValue(pfraTables['two-mile-run'], ageGroup, sex)),
      );
    } else if (legacyCardioSelect?.value === 'Walk') {
      setSliderRange(
        legacyRunSlider,
        toSeconds(walkMaximumTime(ageGroup, sex)),
        0,
      );
    }
  }

  function syncLegacyInputsFromSliders() {
    if (!isPfraMode()) return;

    if (legacyPushInput && legacyPushSlider && legacyPushSelect?.value !== 'Exempt') {
      legacyPushInput.value = legacyPushSlider.value;
    }

    if (legacySitInput && legacySitSlider && legacySitSelect?.value !== 'Exempt') {
      if (legacySitSelect.value === 'Plank') {
        legacySitInput.value = Math.floor(Number(legacySitSlider.value) / 60);
        legacyPlankMinuteInput.value = String(Number(legacySitSlider.value) % 60).padStart(2, '0');
      } else {
        legacySitInput.value = legacySitSlider.value;
      }
    }

    if (legacyRunSlider && legacyCardioSelect?.value !== 'Exempt') {
      if (legacyCardioSelect.value === 'Shuttle Run') {
        legacyRunSecondInput.value = legacyRunSlider.value;
      } else {
        legacyRunMinuteInput.value = Math.floor(Number(legacyRunSlider.value) / 60);
        legacyRunSecondInput.value = String(Number(legacyRunSlider.value) % 60).padStart(2, '0');
      }
    }
  }

  function updateCardioModeText() {
    document.body.classList.toggle('pfra-mode', isPfraMode());

    if (legacyTwoMileOption) legacyTwoMileOption.innerText = isPfraMode() ? '2 Mile' : '1.5 Mile';
    if (legacyHamrOption) legacyHamrOption.innerText = isPfraMode() ? '20m HAMR' : 'Shuttle Run';
    if (legacyWalkOption) legacyWalkOption.innerText = isPfraMode() ? '2 km Walk' : 'Walk';
  }

  function updatePfraLapTimes() {
    if (!isPfraMode() || !legacyLapText) return;

    if (cardioEvent.value === 'hamr-20-meter' || cardioEvent.value === 'two-kilometer-walk') {
      legacyLapText.innerHTML = '';
      return;
    }

    const totalSeconds = toSeconds(cardioPerformance.value);
    if (!Number.isFinite(totalSeconds)) {
      legacyLapText.innerHTML = '';
      return;
    }

    const lapCount = 8;
    const lapSeconds = Math.floor(totalSeconds / lapCount);
    let text = `Req'd 8 Lap Time: ~${secondsToTimeString(lapSeconds)}`;

    for (let lap = 1; lap <= lapCount; lap += 1) {
      text += `<br>Lap ${lap}: ≤ ${secondsToTimeString(lapSeconds * lap)}`;
    }

    legacyLapText.innerHTML = text;
  }

  function applyPfraCardioToLegacyControls() {
    if (!isPfraMode()) return;

    if (legacyCardioSelect?.value === '1.5 Mile' && cardioEvent.value === 'two-mile-run') {
      const totalSeconds = toSeconds(cardioPerformance.value || eventDefaults['two-mile-run']);
      if (!Number.isFinite(totalSeconds)) return;

      legacyRunSlider.value = totalSeconds;
      legacyRunMinuteInput.value = Math.floor(totalSeconds / 60);
      legacyRunSecondInput.value = String(totalSeconds % 60).padStart(2, '0');
    } else if (legacyCardioSelect?.value === 'Shuttle Run' && cardioEvent.value === 'hamr-20-meter') {
      const shuttles = Number(cardioPerformance.value || eventDefaults['hamr-20-meter']);
      if (!Number.isFinite(shuttles)) return;

      legacyRunSlider.value = shuttles;
      legacyRunSecondInput.value = shuttles;
    } else if (legacyCardioSelect?.value === 'Walk' && cardioEvent.value === 'two-kilometer-walk') {
      const totalSeconds = toSeconds(cardioPerformance.value || eventDefaults['two-kilometer-walk']);
      if (!Number.isFinite(totalSeconds)) return;

      legacyRunSlider.value = totalSeconds;
      legacyRunMinuteInput.value = Math.floor(totalSeconds / 60);
      legacyRunSecondInput.value = String(totalSeconds % 60).padStart(2, '0');
    }
  }

  function updateLegacyComponentText(scores, tables, exemptions) {
    if (!isPfraMode()) return;

    const ageGroup = legacyAgeToPfraAgeGroup(ageSelect.value);
    const sex = legacySexToPfraSex(sexSelect.value);
    const strengthMin = tables.strength ? firstScoringCellValue(tables.strength, ageGroup, sex) : undefined;
    const strengthMax = tables.strength ? topCellValue(tables.strength, ageGroup, sex) : undefined;
    const coreMin = tables.core ? firstScoringCellValue(tables.core, ageGroup, sex) : undefined;
    const coreMax = tables.core ? topCellValue(tables.core, ageGroup, sex) : undefined;
    const cardioMin = tables.cardio
      ? firstScoringCellValue(tables.cardio, ageGroup, sex)
      : undefined;
    const cardioMax = tables.cardio
      ? topCellValue(tables.cardio, ageGroup, sex)
      : walkMaximumTime(ageGroup, sex);

    if (legacyStrengthText && exemptions.strength) {
      legacyStrengthText.innerHTML = 'Strength Score: EXEMPT';
    } else if (legacyStrengthText) {
      legacyStrengthText.innerHTML = `Strength Score: ${formatScore(scores.strength)} | Min: ${formatPerformance(strengthMin, tables.strength)} | Max: ${formatPerformance(strengthMax, tables.strength)}`;
    }

    if (legacyCoreText && exemptions.core) {
      legacyCoreText.innerHTML = 'Core Score: EXEMPT';
    } else if (legacyCoreText) {
      legacyCoreText.innerHTML = `Core Score: ${formatScore(scores.core)} | Min: ${formatPerformance(coreMin, tables.core)} | Max: ${formatPerformance(coreMax, tables.core)}`;
    }

    if (legacyCardioText && exemptions.cardio) {
      legacyCardioText.innerHTML = 'Cardio Score: EXEMPT';
    } else if (legacyCardioText && cardioEvent.value === 'hamr-20-meter') {
      legacyCardioText.innerHTML = `Cardio Score: ${formatScore(scores.cardio)} | Min: ${formatPerformance(cardioMin, tables.cardio)} | Max: ${formatPerformance(cardioMax, tables.cardio)}`;
    } else if (legacyCardioText && cardioEvent.value === 'two-mile-run') {
      legacyCardioText.innerHTML = `Cardio Score: ${formatScore(scores.cardio)} | Min: ${formatPerformance(cardioMin, tables.cardio)} | Max: ${formatPerformance(cardioMax, tables.cardio)}`;
    } else if (legacyCardioText && cardioEvent.value === 'two-kilometer-walk') {
      const result = scores.cardio === 50 ? 'Pass' : 'Fail';
      legacyCardioText.innerHTML = `Cardio Score: ${formatScore(scores.cardio)} (${result}) | Max: ${cardioMax}`;
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

  function syncFromLegacyCalculator({ preserveCardio = false } = {}) {
    updateCardioModeText();

    if (!isPfraMode()) {
      updatePfraCalculator();
      return;
    }

    updateLegacySliderRanges();
    syncLegacyInputsFromSliders();

    if (legacyPushSelect?.value === 'Pushups') {
      strengthEvent.value = 'push-up';
      strengthPerformance.value = legacyPushSlider.value || eventDefaults[strengthEvent.value];
    } else if (legacyPushSelect?.value === 'Hand-Release') {
      strengthEvent.value = 'hand-release-push-up';
      strengthPerformance.value = legacyPushSlider.value || eventDefaults[strengthEvent.value];
    }

    if (legacySitSelect?.value === 'Situps') {
      coreEvent.value = 'sit-up';
      corePerformance.value = legacySitSlider.value || eventDefaults[coreEvent.value];
    } else if (legacySitSelect?.value === 'Reverse Crunch') {
      coreEvent.value = 'cross-leg-reverse-crunch';
      corePerformance.value = legacySitSlider.value || eventDefaults[coreEvent.value];
    } else if (legacySitSelect?.value === 'Plank') {
      coreEvent.value = 'forearm-plank';
      corePerformance.value = secondsToTimeString(Number(legacySitSlider.value || 0));
    }

    if (preserveCardio) {
      if (legacyCardioSelect?.value === 'Shuttle Run') {
        cardioEvent.value = 'hamr-20-meter';
      } else if (legacyCardioSelect?.value === '1.5 Mile') {
        cardioEvent.value = 'two-mile-run';
      } else if (legacyCardioSelect?.value === 'Walk') {
        cardioEvent.value = 'two-kilometer-walk';
      }

      applyPfraCardioToLegacyControls();
    } else if (legacyCardioSelect?.value === 'Shuttle Run') {
      cardioEvent.value = 'hamr-20-meter';
      cardioPerformance.value = legacyRunSlider.value || eventDefaults[cardioEvent.value];
    } else if (legacyCardioSelect?.value === 'Walk') {
      cardioEvent.value = 'two-kilometer-walk';
      cardioPerformance.value = secondsToTimeString(Number(legacyRunSlider.value || 0));
    } else if (legacyCardioSelect?.value === '1.5 Mile' && cardioEvent.value === 'hamr-20-meter') {
      cardioEvent.value = 'two-mile-run';
      cardioPerformance.value = eventDefaults[cardioEvent.value];
    } else if (legacyCardioSelect?.value === '1.5 Mile' && cardioEvent.value === 'two-mile-run') {
      const totalSeconds = Number(legacyRunSlider.value || 0);
      if (Number.isFinite(totalSeconds) && totalSeconds > 0) {
        cardioPerformance.value = secondsToTimeString(totalSeconds);
      }
    }

    updateLabelsAndDefaults();
    updatePfraCalculator();
  }

  function standardsModeChange() {
    updateCardioModeText();

    if (!isPfraMode() && typeof window.ageSexChange === 'function') {
      window.ageSexChange();
      return;
    }

    syncFromLegacyCalculator({ preserveCardio: true });
  }

  function updatePfraCalculator() {
    if (!pfraResult || !ageSelect || !sexSelect) return;

    updateLabelsAndDefaults();

    const ageGroup = legacyAgeToPfraAgeGroup(ageSelect.value);
    const sex = legacySexToPfraSex(sexSelect.value);
    const exemptions = componentExemptions();
    const strengthTable = pfraTables[strengthEvent.value];
    const coreTable = pfraTables[coreEvent.value];
    const cardioTable = cardioEvent.value === 'two-kilometer-walk'
      ? null
      : pfraTables[cardioEvent.value];

    if ((!strengthTable && !exemptions.strength) || (!coreTable && !exemptions.core) || (!cardioTable && cardioEvent.value !== 'two-kilometer-walk' && !exemptions.cardio)) {
      pfraResult.innerText = 'PFRA Total: standards not loaded';
      return;
    }

    const bodyScore = scoreWhtr(whtrInput.value);
    const strengthScore = exemptions.strength
      ? 0
      : scoreFromTable(strengthTable, ageGroup, sex, strengthPerformance.value.trim());
    const coreScore = exemptions.core
      ? 0
      : scoreFromTable(coreTable, ageGroup, sex, corePerformance.value.trim());
    const cardioScore = exemptions.cardio
      ? 0
      : cardioEvent.value === 'two-kilometer-walk'
      ? scoreWalk(ageGroup, sex, cardioPerformance.value.trim())
      : scoreFromTable(cardioTable, ageGroup, sex, cardioPerformance.value.trim());
    const availablePoints = 100
      - (exemptions.strength ? 15 : 0)
      - (exemptions.core ? 15 : 0)
      - (exemptions.cardio ? 50 : 0);
    const rawTotal = bodyScore + strengthScore + coreScore + cardioScore;
    const total = availablePoints > 0 ? (rawTotal / availablePoints) * 100 : rawTotal;

    bodyScoreText.innerText = formatScore(bodyScore);
    strengthScoreText.innerText = exemptions.strength ? 'EXEMPT' : formatScore(strengthScore);
    coreScoreText.innerText = exemptions.core ? 'EXEMPT' : formatScore(coreScore);
    cardioScoreText.innerText = exemptions.cardio ? 'EXEMPT' : formatScore(cardioScore);
    pfraResult.innerText = `PFRA Total: ${total.toFixed(1)} - ${categoryForTotal(total)}`;
    setMainScore(total);
    restoreLegacyMainScore();
    updateLegacyComponentText(
      { strength: strengthScore, core: coreScore, cardio: cardioScore },
      { strength: strengthTable, core: coreTable, cardio: cardioTable },
      exemptions,
    );
    updatePfraLapTimes();
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

    standardsMode?.addEventListener('change', standardsModeChange);

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
