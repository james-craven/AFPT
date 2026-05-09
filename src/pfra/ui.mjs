import { secondsToTimeString, toSeconds } from './scoring.mjs';

export function renderCardioModeText({
  body,
  isPfraMode,
  legacyHamrOption,
  legacyTwoMileOption,
  legacyWalkOption,
}) {
  body?.classList.toggle('pfra-mode', isPfraMode);

  if (legacyTwoMileOption) legacyTwoMileOption.innerText = isPfraMode ? '2 Mile' : '1.5 Mile';
  if (legacyHamrOption) legacyHamrOption.innerText = isPfraMode ? '20m HAMR' : 'Shuttle Run';
  if (legacyWalkOption) legacyWalkOption.innerText = isPfraMode ? '2 km Walk' : 'Walk';
}

export function renderPfraMainScore(totalScoreParagraph, total, category) {
  if (!totalScoreParagraph) return;

  const failText = total < 75 ? 'Unsatisfactory!' : `${category}!`;
  totalScoreParagraph.innerHTML = `PFRA Total Score: <span id="t">${total.toFixed(1)}<br>${failText}</span>`;

  const totalText = document.getElementById('t');
  if (!totalText) return;

  totalText.classList.toggle('score-txt-red', total < 75);
  totalText.classList.toggle('score-txt-green', total >= 75);
}

export function renderPfraLapTimes({
  cardioEventValue,
  cardioPerformance,
  isPfraMode,
  legacyCardioValue,
  legacyLapText,
}) {
  if (!isPfraMode || !legacyLapText) return;

  if (legacyCardioValue === 'Exempt' || cardioEventValue === 'hamr-20-meter' || cardioEventValue === 'two-kilometer-walk') {
    legacyLapText.innerHTML = '';
    return;
  }

  const totalSeconds = toSeconds(cardioPerformance);
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

export function setSliderPassState(slider, isPassing, isExempt) {
  if (!slider) return;

  if (isExempt) {
    slider.classList.remove('slider-green', 'slider-red');
    return;
  }

  slider.classList.toggle('slider-green', isPassing);
  slider.classList.toggle('slider-red', !isPassing);
}

export function updateThresholdTick({
  bindTick,
  isVisible = true,
  label,
  slider,
  thresholdValue,
  tick,
}) {
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

  bindTick(tick, () => {
    slider.value = threshold;
    slider.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

