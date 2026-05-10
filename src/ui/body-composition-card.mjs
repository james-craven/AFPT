const IMPLEMENTED_BODY_COMP_VARIANTS = new Set([
  'light-clean',
  'tactical-dense',
  'stencil-clipped',
  'blues-polished',
  'fitness-gradient-card',
]);

function currentBodyCompVariant() {
  const resolved = window.afptTheme?.getActiveThemePreset?.();
  const variant = resolved?.variants?.bodyCompositionCard || 'light-clean';
  return IMPLEMENTED_BODY_COMP_VARIANTS.has(variant) ? variant : 'light-clean';
}

function setVariant(card, variant) {
  card.dataset.cardVariant = variant;
  card.classList.remove(
    'body-composition-card--light-clean',
    'body-composition-card--tactical-dense',
    'body-composition-card--stencil-clipped',
    'body-composition-card--blues-polished',
    'body-composition-card--fitness-gradient-card',
  );
  card.classList.add(`body-composition-card--${variant}`);
}

function updateBodyCompositionCard(card) {
  setVariant(card, currentBodyCompVariant());
}

function initBodyCompositionCard() {
  const card = document.getElementById('body-composition-card');
  if (!card) return;

  const update = () => updateBodyCompositionCard(card);
  document.addEventListener('afpt:themechange', update);
  update();

  window.afptBodyCompositionCard = Object.freeze({
    implementedVariants: Array.from(IMPLEMENTED_BODY_COMP_VARIANTS),
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBodyCompositionCard, { once: true });
} else {
  initBodyCompositionCard();
}
