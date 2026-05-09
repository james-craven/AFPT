(async function () {
  const [pfraScoring, standardsData] = await Promise.all([
    import('./src/pfra/scoring.mjs'),
    import('./src/pfra/standards.mjs'),
  ]);
  const { loadPfraStandards, walkMaximumTime: standardsWalkMaximumTime } = standardsData;
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
  let pfraStandards = null;
  let pfraTables = {};
  let lastStandardsMode = standardsMode?.value || 'legacy';
  let pfraCardioTracksStartingValue = false;

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
    return pfraScoring.toSeconds(value);
  }

  function walkMaximumTime(ageGroup, sex) {
    return standardsWalkMaximumTime(pfraStandards, ageGroup, sex);
  }

  function categoryForTotal(total) {
    return pfraScoring.categoryForTotal(total);
  }

  function formatScore(score) {
    return pfraScoring.formatScore(score);
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
    return pfraScoring.topCellValue(table, ageGroup, sex);
  }

  function firstScoringCellValue(table, ageGroup, sex) {
    return pfraScoring.firstScoringCellValue(table, ageGroup, sex);
  }

  function formatPerformance(value, table) {
    return pfraScoring.formatPerformance(value, table);
  }

  function secondsToTimeString(totalSeconds) {
    return pfraScoring.secondsToTimeString(totalSeconds);
  }

  function currentAgeGroup() {
    return legacyAgeToPfraAgeGroup(ageSelect.value);
  }

  function currentSex() {
    return legacySexToPfraSex(sexSelect.value);
  }

  function defaultPerformanceForEvent(eventId) {
    const ageGroup = currentAgeGroup();
    const sex = currentSex();

    if (eventId === 'two-kilometer-walk') {
      return walkMaximumTime(ageGroup, sex) || eventDefaults[eventId];
    }

    const table = pfraTables[eventId];
    const defaultValue = table ? topCellValue(table, ageGroup, sex) : undefined;
    return formatPerformance(defaultValue, table) || eventDefaults[eventId];
  }

  function startingCardioPerformanceForEvent(eventId) {
    const ageGroup = currentAgeGroup();
    const sex = currentSex();

    if (eventId === 'two-kilometer-walk') {
      return walkMaximumTime(ageGroup, sex) || eventDefaults[eventId];
    }

    const table = pfraTables[eventId];
    const startingValue = table ? firstScoringCellValue(table, ageGroup, sex) : undefined;
    return formatPerformance(startingValue, table) || defaultPerformanceForEvent(eventId);
  }

  function setTimeInputsFromSeconds(totalSeconds) {
    if (!legacyRunMinuteInput || !legacyRunSecondInput) return;
    legacyRunMinuteInput.value = Math.floor(totalSeconds / 60);
    legacyRunSecondInput.value = String(totalSeconds % 60).padStart(2, '0');
  }

  function setPlankInputsFromSeconds(totalSeconds) {
    if (!legacySitInput || !legacyPlankMinuteInput) return;
    legacySitInput.value = Math.floor(totalSeconds / 60);
    legacyPlankMinuteInput.value = String(totalSeconds % 60).padStart(2, '0');
  }

  function setSliderRange(slider, maxValue, minValue = 0) {
    if (!slider || maxValue === undefined) return undefined;

    const numericMax = Number(maxValue);
    const numericMin = Number(minValue);
    if (!Number.isFinite(numericMax) || !Number.isFinite(numericMin)) return undefined;

    slider.min = numericMin;
    slider.max = numericMax;

    if (Number(slider.value) > numericMax) {
      slider.value = numericMax;
    }

    if (Number(slider.value) < numericMin) {
      slider.value = numericMin;
    }

    return Number(slider.value);
  }

  function updateLegacySliderRanges() {
    if (!isPfraMode()) return;

    const ageGroup = currentAgeGroup();
    const sex = currentSex();

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
        setPlankInputsFromSeconds(Number(legacySitSlider.value));
      } else {
        legacySitInput.value = legacySitSlider.value;
      }
    }

    if (legacyRunSlider && legacyCardioSelect?.value !== 'Exempt') {
      if (legacyCardioSelect.value === 'Shuttle Run') {
        legacyRunSecondInput.value = legacyRunSlider.value;
      } else {
        setTimeInputsFromSeconds(Number(legacyRunSlider.value));
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

    if (legacyCardioSelect?.value === 'Exempt' || cardioEvent.value === 'hamr-20-meter' || cardioEvent.value === 'two-kilometer-walk') {
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
      text += `<br>Lap ${lap}: ≤ ${secondsToTimeString(Math.floor((totalSeconds * lap) / lapCount))}`;
    }

    legacyLapText.innerHTML = text;
  }

  function numericPerformanceValue(value, table) {
    return table?.unit === 'min:sec' ? toSeconds(value) : Number(value);
  }

  function setSliderPassState(slider, isPassing, isExempt) {
    if (!slider) return;

    if (isExempt) {
      slider.classList.remove('slider-green', 'slider-red');
      return;
    }

    slider.classList.toggle('slider-green', isPassing);
    slider.classList.toggle('slider-red', !isPassing);
  }

  function updateThresholdTick(tickId, slider, thresholdValue, label, isVisible = true) {
    const tick = document.getElementById(tickId);
    if (!tick || !slider || !isVisible) {
      if (tick) tick.style.display = 'none';
      return;
    }

    const min = Number(slider.min);
    const max = Number(slider.max);
    const threshold = Number(thresholdValue);
    if (!Number.isFinite(min) || !Number.isFinite(max) || !Number.isFinite(threshold) || max === min) {
      tick.style.display = 'none';
      return;
    }

    tick.innerText = label;
    const percent = Math.min(1, Math.max(0, (threshold - min) / (max - min)));
    const sliderWidth = slider.getBoundingClientRect().width;
    const tickWidth = tick.getBoundingClientRect().width;
    const handleSize = 45;
    const left = percent * (sliderWidth - handleSize) + handleSize / 2 - tickWidth / 2;

    tick.style.display = 'block';
    tick.style.left = `${left}px`;
    tick.style.cursor = 'pointer';
    const bindTick = window.bindSliderTickClick || ((element, handler) => {
      element.sliderTickHandler = handler;
      if (element.dataset.sliderTickBound !== 'true') {
        element.addEventListener('click', () => {
          element.sliderTickHandler?.();
        });
        element.dataset.sliderTickBound = 'true';
      }
      return element;
    });

    bindTick(tick, () => {
      slider.value = threshold;
      slider.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }

  function updatePfraSliderFeedback(scores, tables, exemptions) {
    const ageGroup = currentAgeGroup();
    const sex = currentSex();
    const strengthMin = tables.strength ? firstScoringCellValue(tables.strength, ageGroup, sex) : undefined;
    const coreMin = tables.core ? firstScoringCellValue(tables.core, ageGroup, sex) : undefined;
    const cardioMin = tables.cardio ? firstScoringCellValue(tables.cardio, ageGroup, sex) : undefined;

    setSliderPassState(legacyPushSlider, scores.strength > 0, exemptions.strength);
    updateThresholdTick(
      'push-tick',
      legacyPushSlider,
      numericPerformanceValue(strengthMin, tables.strength),
      formatPerformance(strengthMin, tables.strength),
      !exemptions.strength,
    );

    setSliderPassState(legacySitSlider, scores.core > 0, exemptions.core);
    updateThresholdTick(
      'sit-tick',
      legacySitSlider,
      numericPerformanceValue(coreMin, tables.core),
      formatPerformance(coreMin, tables.core),
      !exemptions.core,
    );

    setSliderPassState(legacyRunSlider, scores.cardio > 0, exemptions.cardio);
    updateThresholdTick(
      'run-tick',
      legacyRunSlider,
      numericPerformanceValue(cardioMin, tables.cardio),
      formatPerformance(cardioMin, tables.cardio),
      !exemptions.cardio && cardioEvent.value === 'hamr-20-meter',
    );
  }

  function updateLegacyComponentText(scores, tables, exemptions) {
    if (!isPfraMode()) return;

    const ageGroup = currentAgeGroup();
    const sex = currentSex();
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

    updatePfraSliderFeedback(scores, tables, exemptions);
  }

  function updateLabelsAndDefaults(changedSelect) {
    if (changedSelect === strengthEvent) strengthPerformance.value = defaultPerformanceForEvent(strengthEvent.value);
    if (changedSelect === coreEvent) corePerformance.value = defaultPerformanceForEvent(coreEvent.value);
    if (changedSelect === cardioEvent) cardioPerformance.value = defaultPerformanceForEvent(cardioEvent.value);

    strengthLabel.innerText = eventLabels[strengthEvent.value];
    coreLabel.innerText = eventLabels[coreEvent.value];
    cardioLabel.innerText = eventLabels[cardioEvent.value];

    corePerformance.inputMode = coreEvent.value === 'forearm-plank' ? 'numeric' : 'numeric';
    cardioPerformance.inputMode = cardioEvent.value === 'two-mile-run' ? 'numeric' : 'numeric';
  }

  function setEventControlsFromLegacySelections() {
    if (legacyPushSelect?.value === 'Pushups') {
      strengthEvent.value = 'push-up';
    } else if (legacyPushSelect?.value === 'Hand-Release') {
      strengthEvent.value = 'hand-release-push-up';
    }

    if (legacySitSelect?.value === 'Situps') {
      coreEvent.value = 'sit-up';
    } else if (legacySitSelect?.value === 'Reverse Crunch') {
      coreEvent.value = 'cross-leg-reverse-crunch';
    } else if (legacySitSelect?.value === 'Plank') {
      coreEvent.value = 'forearm-plank';
    }

    if (legacyCardioSelect?.value === 'Shuttle Run') {
      cardioEvent.value = 'hamr-20-meter';
    } else if (legacyCardioSelect?.value === 'Walk') {
      cardioEvent.value = 'two-kilometer-walk';
    } else if (legacyCardioSelect?.value === '1.5 Mile') {
      cardioEvent.value = 'two-mile-run';
    }
  }

  function syncPfraPerformancesFromLegacyControls() {
    if (legacyPushSelect?.value !== 'Exempt') {
      strengthPerformance.value = legacyPushSlider.value || defaultPerformanceForEvent(strengthEvent.value);
    }

    if (legacySitSelect?.value !== 'Exempt') {
      if (legacySitSelect?.value === 'Plank') {
        corePerformance.value = secondsToTimeString(Number(legacySitSlider.value || 0));
      } else {
        corePerformance.value = legacySitSlider.value || defaultPerformanceForEvent(coreEvent.value);
      }
    }

    if (legacyCardioSelect?.value !== 'Exempt') {
      if (legacyCardioSelect?.value === 'Shuttle Run') {
        cardioPerformance.value = legacyRunSlider.value || defaultPerformanceForEvent(cardioEvent.value);
      } else {
        cardioPerformance.value = secondsToTimeString(Number(legacyRunSlider.value || 0));
      }
    }
  }

  function applyPfraCardioStartingValueToLegacyControls() {
    const startingPerformance = startingCardioPerformanceForEvent(cardioEvent.value);

    if (legacyCardioSelect?.value === 'Shuttle Run') {
      legacyRunSlider.value = Number(startingPerformance);
      legacyRunSecondInput.value = legacyRunSlider.value;
      return;
    }

    const totalSeconds = toSeconds(startingPerformance);
    if (!Number.isFinite(totalSeconds)) return;

    legacyRunSlider.value = totalSeconds;
    setTimeInputsFromSeconds(Number(legacyRunSlider.value));
  }

  function setLegacyRunSliderFromTextInputs() {
    if (!legacyRunSlider || legacyCardioSelect?.value === 'Exempt') return;

    if (legacyCardioSelect?.value === 'Shuttle Run') {
      const shuttles = Number(legacyRunSecondInput?.value || 0);
      if (Number.isFinite(shuttles)) legacyRunSlider.value = shuttles;
      return;
    }

    const minutes = Number(legacyRunMinuteInput?.value || 0);
    const seconds = Number(legacyRunSecondInput?.value || 0);
    const totalSeconds = (minutes * 60) + seconds;

    if (Number.isFinite(totalSeconds)) legacyRunSlider.value = totalSeconds;
  }

  function syncFromLegacyCalculator({ usePfraCardioStartingValue = pfraCardioTracksStartingValue } = {}) {
    updateCardioModeText();

    if (!isPfraMode()) {
      updatePfraCalculator();
      return;
    }

    setEventControlsFromLegacySelections();
    updateLegacySliderRanges();

    if (usePfraCardioStartingValue && legacyCardioSelect?.value !== 'Exempt') {
      pfraCardioTracksStartingValue = true;
      applyPfraCardioStartingValueToLegacyControls();
    }

    syncLegacyInputsFromSliders();
    syncPfraPerformancesFromLegacyControls();

    updateLabelsAndDefaults();
    updatePfraCalculator();
  }

  function standardsModeChange() {
    const enteringPfraMode = standardsMode?.value === 'pfra' && lastStandardsMode !== 'pfra';
    const legacyRunWasUntouchedDefault = legacyCardioSelect?.value === '1.5 Mile'
      && Number(legacyRunSlider?.value) === Number(legacyRunSlider?.max);
    pfraCardioTracksStartingValue = enteringPfraMode && legacyRunWasUntouchedDefault;

    updateCardioModeText();

    if (!isPfraMode() && typeof window.ageSexChange === 'function') {
      pfraCardioTracksStartingValue = false;
      window.ageSexChange();
      lastStandardsMode = standardsMode?.value || 'legacy';
      return;
    }

    syncFromLegacyCalculator({
      usePfraCardioStartingValue: pfraCardioTracksStartingValue,
    });
    lastStandardsMode = standardsMode?.value || 'legacy';
  }

  window.syncPfraFromLegacy = syncFromLegacyCalculator;

  function handleLegacyControlChange(event) {
    const syncAfterLegacyHandlers = typeof queueMicrotask === 'function'
      ? queueMicrotask
      : (callback) => Promise.resolve().then(callback);

    if (isPfraMode()) {
      if (
        event?.currentTarget === legacyRunMinuteInput
        || event?.currentTarget === legacyRunSecondInput
        || event?.currentTarget === legacyRunSlider
      ) {
        pfraCardioTracksStartingValue = false;

        if (
          event?.currentTarget === legacyRunMinuteInput
          || event?.currentTarget === legacyRunSecondInput
        ) {
          setLegacyRunSliderFromTextInputs();
        }
      }

      if (event?.currentTarget === legacyCardioSelect) {
        pfraCardioTracksStartingValue = legacyCardioSelect.value !== 'Exempt';
      }
    }

    syncAfterLegacyHandlers(syncFromLegacyCalculator);
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

    const result = pfraScoring.scorePfraAssessment({
      ageGroup,
      sex,
      standards: pfraStandards,
      tables: pfraTables,
      whtr: whtrInput.value,
      strengthEvent: strengthEvent.value,
      strengthPerformance: strengthPerformance.value.trim(),
      coreEvent: coreEvent.value,
      corePerformance: corePerformance.value.trim(),
      cardioEvent: cardioEvent.value,
      cardioPerformance: cardioPerformance.value.trim(),
      exemptions,
    });
    const { body: bodyScore, strength: strengthScore, core: coreScore, cardio: cardioScore } = result.scores;
    const { total } = result;

    bodyScoreText.innerText = formatScore(bodyScore);
    strengthScoreText.innerText = exemptions.strength ? 'EXEMPT' : formatScore(strengthScore);
    coreScoreText.innerText = exemptions.core ? 'EXEMPT' : formatScore(coreScore);
    cardioScoreText.innerText = exemptions.cardio ? 'EXEMPT' : formatScore(cardioScore);
    pfraResult.innerText = `PFRA Total: ${total.toFixed(1)} - ${categoryForTotal(total)}`;
    setMainScore(total);
    restoreLegacyMainScore();
    updateLegacyComponentText(
      { strength: strengthScore, core: coreScore, cardio: cardioScore },
      result.tables,
      exemptions,
    );
    updatePfraLapTimes();
  }

  async function loadTables() {
    if (!pfraStatus) return;

    try {
      const loaded = await loadPfraStandards({
        cacheBust: true,
        onProgress: ({ loaded: loadedCount, total }) => {
          pfraStatus.innerText = `Loading standards... ${loadedCount}/${total}`;
        },
      });

      pfraStandards = loaded.standards;
      pfraTables = loaded.tables;
      pfraStatus.innerText = 'Standards loaded from PFRA 2026 tables.';
      syncFromLegacyCalculator();
    } catch (error) {
      pfraStatus.innerText = `Unable to load PFRA standards: ${error.message}`;
    }
  }

  if (pfraStatus && whtrInput && strengthEvent && coreEvent && cardioEvent) {
    pfraStatus.innerText = 'Loading standards...';

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
      control?.addEventListener('change', handleLegacyControlChange);
      control?.addEventListener('input', handleLegacyControlChange);
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
