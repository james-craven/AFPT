const IMPLEMENTED_STRENGTH_VARIANTS = new Set([
  'light-clean',
  'tactical-dense',
  'stencil-clipped',
  'blues-polished',
  'fitness-gradient-card',
]);

function currentStrengthVariant() {
  const resolved = window.afptTheme?.getActiveThemePreset?.();
  const variant = resolved?.variants?.strengthCard || 'light-clean';
  return IMPLEMENTED_STRENGTH_VARIANTS.has(variant) ? variant : 'light-clean';
}

function setVariant(card, variant) {
  card.dataset.cardVariant = variant;
  card.classList.remove(
    'strength-card--light-clean',
    'strength-card--tactical-dense',
    'strength-card--stencil-clipped',
    'strength-card--blues-polished',
    'strength-card--fitness-gradient-card',
  );
  card.classList.add(`strength-card--${variant}`);
}

function updateStrengthCard(card) {
  setVariant(card, currentStrengthVariant());
}

function initStrengthCard() {
  const card = document.getElementById('strength-card');
  if (!card) return;

  const update = () => updateStrengthCard(card);
  document.addEventListener('afpt:themechange', update);
  update();

  window.afptStrengthCard = Object.freeze({
    implementedVariants: Array.from(IMPLEMENTED_STRENGTH_VARIANTS),
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initStrengthCard, { once: true });
} else {
  initStrengthCard();
}
