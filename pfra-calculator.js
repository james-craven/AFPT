(async function () {
  const [domModule, pfraScoring, standardsData, pfraState, pfraUi] = await Promise.all([
    import('./src/pfra/dom.mjs'),
    import('./src/pfra/scoring.mjs'),
    import('./src/pfra/standards.mjs'),
    import('./src/pfra/state.mjs'),
    import('./src/pfra/ui.mjs'),
  ]);
  const { loadPfraStandards, walkMaximumTime: standardsWalkMaximumTime } = standardsData;
  const {
    cardioEventForLegacy,
    componentExemptionsFromLegacy,
    coreEventForLegacy,
    eventDefaults,
    eventLabels,
    legacyAgeToPfraAgeGroup,
    legacySexToPfraSex,
    strengthEventForLegacy,
  } = pfraState;
  const {
    ageSelect,
    altitudeSelect,
    body,
    bodyScoreText,
    cardioEvent,
    cardioLabel,
    cardioPerformance,
    cardioScoreText,
    coreEvent,
    coreLabel,
    corePerformance,
    coreScoreText,
    legacyCardioSelect,
    legacyCardioText,
    legacyCoreText,
    legacyHamrOption,
    legacyLapText,
    legacyPlankMinuteInput,
    legacyPushInput,
    legacyPushSelect,
    legacyPushSlider,
    legacyRunMinuteInput,
    legacyRunSecondInput,
    legacyRunSlider,
    legacySitInput,
    legacySitSelect,
    legacySitSlider,
    legacyStrengthText,
    legacyTwoMileOption,
    legacyWalkOption,
    pfraResult,
    pfraStatus,
    sexSelect,
    standardsMode,
    strengthEvent,
    strengthLabel,
    strengthPerformance,
    strengthScoreText,
    totalScoreParagraph,
    whtrInput,
  } = domModule.getPfraDom();
  let pfraStandards = null;
  let pfraTables = {};
  let altitudeTables = {};
  let lastStandardsMode = standardsMode?.value || 'legacy';
  let pfraCardioTracksStartingValue = false;

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
    return componentExemptionsFromLegacy({
      strength: legacyPushSelect?.value,
      core: legacySitSelect?.value,
      cardio: legacyCardioSelect?.value,
    });
  }

  function setMainScore(total) {
    if (!totalScoreParagraph || !isPfraMode()) return;

    pfraUi.renderPfraMainScore(totalScoreParagraph, total, categoryForTotal(total));
  }

  function restoreLegacyMainScore() {
    const updateScore = window.afptLegacy?.updateScoreMinMaxText || window.updateScoreMinMaxText;
    if (isPfraMode() || typeof updateScore !== 'function') return;
    updateScore();
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

  function currentAltitudeGroup() {
    const value = altitudeSelect?.value || '';
    if (value.startsWith('Group 1')) return 1;
    if (value.startsWith('Group 2')) return 2;
    if (value.startsWith('Group 3')) return 3;
    if (value.startsWith('Group 4')) return 4;
    return 0;
  }

  function altitudeAdjustedCardioPerformance(cardioEventValue, rawPerformance, altGroup) {
    if (!altGroup || altGroup <= 0 || !rawPerformance) return rawPerformance;

    if (cardioEventValue === 'two-mile-run') {
      if (!altitudeTables.run) return rawPerformance;
      const perfSec = toSeconds(rawPerformance);
      if (!Number.isFinite(perfSec)) return rawPerformance;
      const adjSec = pfraScoring.applyRunAltitudeAdjustment(perfSec, altGroup, altitudeTables.run);
      return secondsToTimeString(adjSec);
    }

    if (cardioEventValue === 'hamr-20-meter') {
      const adjShuttles = pfraScoring.applyHamrAltitudeAdjustment(Number(rawPerformance), altGroup);
      return String(Math.round(adjShuttles));
    }

    if (cardioEventValue === 'two-kilometer-walk') {
      const ageGroup = currentAgeGroup();
      const sex = currentSex();
      const walkAgeGroup = pfraScoring.pfraAgeToWalkAgeGroup(ageGroup);
      const walkTable = sex === 'male' ? altitudeTables.walkMale : altitudeTables.walkFemale;
      if (!walkTable) return rawPerformance;
      const altMaxTime = pfraScoring.applyWalkAltitudeAdjustment(walkTable, walkAgeGroup, altGroup);
      const seaLevelMaxTime = walkMaximumTime(ageGroup, sex);
      if (!altMaxTime || !seaLevelMaxTime) return rawPerformance;
      const bonus = toSeconds(altMaxTime) - toSeconds(seaLevelMaxTime);
      if (!Number.isFinite(bonus) || bonus <= 0) return rawPerformance;
      const perfSec = toSeconds(rawPerformance);
      if (!Number.isFinite(perfSec)) return rawPerformance;
      return secondsToTimeString(Math.max(0, perfSec - bonus));
    }

    return rawPerformance;
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
    pfraUi.renderCardioModeText({
      body,
      isPfraMode: isPfraMode(),
      legacyHamrOption,
      legacyTwoMileOption,
      legacyWalkOption,
    });
  }

  function updatePfraLapTimes() {
    pfraUi.renderPfraLapTimes({
      cardioEventValue: cardioEvent.value,
      cardioPerformance: cardioPerformance.value,
      isPfraMode: isPfraMode(),
      legacyCardioValue: legacyCardioSelect?.value,
      legacyLapText,
    });
  }

  function numericPerformanceValue(value, table) {
    return table?.unit === 'min:sec' ? toSeconds(value) : Number(value);
  }

  function setSliderPassState(slider, isPassing, isExempt) {
    pfraUi.setSliderPassState(slider, isPassing, isExempt);
  }

  function updateThresholdTick(tickId, slider, thresholdValue, label, isVisible = true) {
    const tick = document.getElementById(tickId);
    const bindTick = window.afptLegacy?.bindSliderTickClick || window.bindSliderTickClick || ((element, handler) => {
      element.sliderTickHandler = handler;
      if (element.dataset.sliderTickBound !== 'true') {
        element.addEventListener('click', () => {
          element.sliderTickHandler?.();
        });
        element.dataset.sliderTickBound = 'true';
      }
      return element;
    });

    pfraUi.updateThresholdTick({
      bindTick,
      isVisible,
      label,
      slider,
      thresholdValue,
      tick,
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
    const nextStrengthEvent = strengthEventForLegacy(legacyPushSelect?.value);
    const nextCoreEvent = coreEventForLegacy(legacySitSelect?.value);
    const nextCardioEvent = cardioEventForLegacy(legacyCardioSelect?.value);

    if (nextStrengthEvent) strengthEvent.value = nextStrengthEvent;
    if (nextCoreEvent) coreEvent.value = nextCoreEvent;
    if (nextCardioEvent) cardioEvent.value = nextCardioEvent;
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

    const syncLegacyAgeSex = window.afptLegacy?.ageSexChange || window.ageSexChange;
    if (!isPfraMode() && typeof syncLegacyAgeSex === 'function') {
      pfraCardioTracksStartingValue = false;
      syncLegacyAgeSex();
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

    const altGroup = currentAltitudeGroup();
    const adjustedCardioPerformance = !exemptions.cardio
      ? altitudeAdjustedCardioPerformance(cardioEvent.value, cardioPerformance.value.trim(), altGroup)
      : cardioPerformance.value.trim();

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
      cardioPerformance: adjustedCardioPerformance,
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
      const [loaded, runTable, walkMaleTable, walkFemaleTable] = await Promise.all([
        loadPfraStandards({
          cacheBust: true,
          onProgress: ({ loaded: loadedCount, total }) => {
            pfraStatus.innerText = `Loading standards... ${loadedCount}/${total}`;
          },
        }),
        fetch('./standards/extracted/tables/altitude-run-2-mile.json').then((r) => r.json()),
        fetch('./standards/extracted/tables/altitude-walk-2km-male.json').then((r) => r.json()),
        fetch('./standards/extracted/tables/altitude-walk-2km-female.json').then((r) => r.json()),
      ]);

      pfraStandards = loaded.standards;
      pfraTables = loaded.tables;
      altitudeTables = { run: runTable, walkMale: walkMaleTable, walkFemale: walkFemaleTable };
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
    altitudeSelect?.addEventListener('change', updatePfraCalculator);

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
