const IMPLEMENTED_SCORE_HEADER_VARIANTS = new Set([
  'tactical-score-number',
  'stencil-score-block',
  'blues-ring',
  'light-card',
  'fitness-gradient-ring',
]);

const STATUS_TYPES = {
  excellent: 'pass',
  satisfactory: 'pass',
  unsatisfactory: 'fail',
  minimumNotMet: 'fail',
  unknown: 'neutral',
};

function normalizeText(text) {
  return text.replace(/\s+/g, ' ').trim();
}

function displayMode() {
  return document.getElementById('standards-mode')?.value === 'pfra' ? 'PFRA 2026' : 'Legacy';
}

function currentScoreVariant() {
  const resolved = window.afptTheme?.getActiveThemePreset?.();
  const variant = resolved?.variants?.scoreHeader || 'light-card';
  return IMPLEMENTED_SCORE_HEADER_VARIANTS.has(variant) ? variant : 'light-card';
}

function statusFromText(text) {
  const lower = text.toLowerCase();

  if (lower.includes('excellent')) {
    return { label: 'Excellent', type: STATUS_TYPES.excellent };
  }
  if (lower.includes('satisfactory') && !lower.includes('unsatisfactory')) {
    return { label: 'Satisfactory', type: STATUS_TYPES.satisfactory };
  }
  if (lower.includes('unsatisfactory')) {
    return { label: 'Unsatisfactory', type: STATUS_TYPES.unsatisfactory };
  }
  if (lower.includes('minimum not met') || lower.includes('fail')) {
    return { label: 'Minimum Not Met', type: STATUS_TYPES.minimumNotMet };
  }

  return { label: 'Pending', type: STATUS_TYPES.unknown };
}

function parseScoreSource(source) {
  const rawText = normalizeText(source?.innerText || source?.textContent || '');
  const value = rawText.match(/(?:PFRA Total Score|Total Score):\s*([0-9]+(?:\.[0-9]+)?)/i)?.[1] || '--';
  const isPfraOutput = /^PFRA Total Score:/i.test(rawText);
  const status = statusFromText(rawText);

  return {
    label: isPfraOutput ? 'PFRA Total' : 'Total Score',
    mode: displayMode(),
    rawText,
    status,
    value,
  };
}

function setVariant(header, variant) {
  header.dataset.scoreVariant = variant;
  header.classList.remove(
    'score-header--tactical-score-number',
    'score-header--stencil-score-block',
    'score-header--blues-ring',
    'score-header--light-card',
    'score-header--fitness-gradient-ring',
  );
  header.classList.add(`score-header--${variant}`);
}

function renderScoreHeader(header, score) {
  header.querySelector('#score-header-mode').innerText = score.mode;
  header.querySelector('#score-header-status').innerText = score.status.label;
  header.querySelector('.score-header__label').innerText = score.label;
  header.querySelector('#score-header-value').innerText = score.value;
  header.dataset.scoreStatus = score.status.type;
  header.dataset.scoreRaw = score.rawText;
  header.setAttribute('aria-label', `${score.mode} ${score.label}: ${score.value}, ${score.status.label}`);
}

function updateScoreHeader({ header, source }) {
  setVariant(header, currentScoreVariant());
  renderScoreHeader(header, parseScoreSource(source));
}

function initScoreHeader() {
  const header = document.getElementById('score-header');
  const source = document.getElementById('score-txt');
  if (!header || !source) return;

  const update = () => updateScoreHeader({ header, source });
  const observer = new MutationObserver(update);
  observer.observe(source, {
    characterData: true,
    childList: true,
    subtree: true,
  });

  document.addEventListener('afpt:themechange', update);
  document.getElementById('standards-mode')?.addEventListener('change', () => {
    window.requestAnimationFrame(update);
  });

  update();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initScoreHeader, { once: true });
} else {
  initScoreHeader();
}
