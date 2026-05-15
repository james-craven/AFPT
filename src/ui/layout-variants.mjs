export const DEFAULT_THEME_PRESET = 'tactical';
export const THEME_STORAGE_KEY = 'afpt.themePreset';

export const LAYOUT_SLOTS = Object.freeze([
  'appShell',
  'scoreHeader',
  'demographicsControls',
  'standardsSwitcher',
  'settingsPanel',
  'bodyCompositionCard',
  'componentSummaryStrip',
  'componentSummaryCard',
  'activeComponentEditor',
  'strengthCard',
  'coreCard',
  'cardioCard',
  'lapDisplay',
  'chartDisplay',
  'inputControls',
  'componentScoreDisplay',
  'navigationPattern',
]);

const COMPONENT_CARD_SLOTS = Object.freeze([
  'bodyCompositionCard',
  'strengthCard',
  'coreCard',
  'cardioCard',
]);

const SUMMARY_CARD_SLOTS = Object.freeze(['componentSummaryStrip', 'componentSummaryCard']);

function defineVariant(id, slot, label, compatibleSlots = [slot]) {
  return Object.freeze({
    id,
    label,
    slot,
    compatibleSlots: Object.freeze(compatibleSlots),
    status: 'foundation',
  });
}

export const VARIANT_REGISTRY = Object.freeze({
  'legacy-shell': defineVariant('legacy-shell', 'appShell', 'Current app shell'),
  'tactical-shell': defineVariant('tactical-shell', 'appShell', 'Tactical shell'),
  'stencil-shell': defineVariant('stencil-shell', 'appShell', 'Stencil shell'),
  'blues-shell': defineVariant('blues-shell', 'appShell', 'AF Blues shell'),
  'light-shell': defineVariant('light-shell', 'appShell', 'Contrast shell'),
  'fitness-shell': defineVariant('fitness-shell', 'appShell', 'Fitness shell'),

  'tactical-score-number': defineVariant('tactical-score-number', 'scoreHeader', 'Tactical score number'),
  'stencil-score-block': defineVariant('stencil-score-block', 'scoreHeader', 'Stencil score block'),
  'blues-ring': defineVariant('blues-ring', 'scoreHeader', 'Blues score ring'),
  'light-card': defineVariant('light-card', 'scoreHeader', 'Contrast score card'),
  'fitness-gradient-ring': defineVariant('fitness-gradient-ring', 'scoreHeader', 'Gradiant score ring'),

  'visible-compact-selects': defineVariant('visible-compact-selects', 'demographicsControls', 'Compact visible selects'),
  'visible-shared-row': defineVariant('visible-shared-row', 'demographicsControls', 'Shared visible row'),
  'visible-glass-selects': defineVariant('visible-glass-selects', 'demographicsControls', 'Glass visible selects'),

  'current-standards-select': defineVariant('current-standards-select', 'standardsSwitcher', 'Current standards select'),

  'tactical-panel': defineVariant('tactical-panel', 'settingsPanel', 'Tactical settings panel'),
  'stencil-compact-panel': defineVariant('stencil-compact-panel', 'settingsPanel', 'Stencil compact panel'),
  'blues-drawer': defineVariant('blues-drawer', 'settingsPanel', 'Blues drawer'),
  'light-drawer': defineVariant('light-drawer', 'settingsPanel', 'Contrast drawer'),
  'fitness-glass-drawer': defineVariant('fitness-glass-drawer', 'settingsPanel', 'Fitness glass drawer'),

  'tactical-dense': defineVariant('tactical-dense', 'componentCard', 'Tactical dense card', COMPONENT_CARD_SLOTS),
  'stencil-clipped': defineVariant('stencil-clipped', 'componentCard', 'Stencil clipped card', COMPONENT_CARD_SLOTS),
  'blues-polished': defineVariant('blues-polished', 'componentCard', 'Blues polished card', COMPONENT_CARD_SLOTS),
  'light-clean': defineVariant('light-clean', 'componentCard', 'Contrast clean card', COMPONENT_CARD_SLOTS),
  'fitness-gradient-card': defineVariant('fitness-gradient-card', 'componentCard', 'Gradiant card', COMPONENT_CARD_SLOTS),

  'tactical-horizontal-bars': defineVariant('tactical-horizontal-bars', 'lapDisplay', 'Tactical horizontal bars'),
  'stencil-vertical-bars': defineVariant('stencil-vertical-bars', 'lapDisplay', 'Stencil vertical bars'),
  'blues-table': defineVariant('blues-table', 'lapDisplay', 'Blues table'),
  'light-rows': defineVariant('light-rows', 'lapDisplay', 'Contrast rows'),
  'fitness-tiles': defineVariant('fitness-tiles', 'lapDisplay', 'Fitness tiles'),

  'tactical-drawer': defineVariant('tactical-drawer', 'chartDisplay', 'Tactical chart drawer'),
  'stencil-drawer': defineVariant('stencil-drawer', 'chartDisplay', 'Stencil chart drawer'),
  'blues-chart-drawer': defineVariant('blues-chart-drawer', 'chartDisplay', 'Blues chart drawer'),
  'light-chart-drawer': defineVariant('light-chart-drawer', 'chartDisplay', 'Contrast chart drawer'),
  'fitness-glass-chart': defineVariant('fitness-glass-chart', 'chartDisplay', 'Fitness glass chart'),

  'slider-plus-field': defineVariant('slider-plus-field', 'inputControls', 'Slider plus field'),
  'tap-edit-plus-slider': defineVariant('tap-edit-plus-slider', 'inputControls', 'Tap edit plus slider'),
  'stepper-plus-slider': defineVariant('stepper-plus-slider', 'inputControls', 'Stepper plus slider'),
  'numeric-field-plus-slider': defineVariant('numeric-field-plus-slider', 'inputControls', 'Numeric field plus slider'),

  'hud-chip': defineVariant('hud-chip', 'componentScoreDisplay', 'HUD score chip'),
  'stencil-points': defineVariant('stencil-points', 'componentScoreDisplay', 'Stencil points'),
  'progress-strip': defineVariant('progress-strip', 'componentScoreDisplay', 'Progress strip'),
  'clean-chip': defineVariant('clean-chip', 'componentScoreDisplay', 'Clean score chip'),
  'gradient-chip': defineVariant('gradient-chip', 'componentScoreDisplay', 'Gradiant score chip'),

  'tactical-dense-strip': defineVariant('tactical-dense-strip', 'componentSummaryStrip', 'Tactical dense summary strip', SUMMARY_CARD_SLOTS),
  'stencil-clipped-strip': defineVariant('stencil-clipped-strip', 'componentSummaryStrip', 'Stencil clipped summary strip', SUMMARY_CARD_SLOTS),
  'blues-polished-strip': defineVariant('blues-polished-strip', 'componentSummaryStrip', 'Blues polished summary strip', SUMMARY_CARD_SLOTS),
  'light-clean-strip': defineVariant('light-clean-strip', 'componentSummaryStrip', 'Contrast clean summary strip', SUMMARY_CARD_SLOTS),
  'fitness-gradient-strip': defineVariant('fitness-gradient-strip', 'componentSummaryStrip', 'Gradiant summary strip', SUMMARY_CARD_SLOTS),

  'tactical-editor-panel': defineVariant('tactical-editor-panel', 'activeComponentEditor', 'Tactical editor panel'),
  'stencil-editor-panel': defineVariant('stencil-editor-panel', 'activeComponentEditor', 'Stencil editor panel'),
  'blues-editor-panel': defineVariant('blues-editor-panel', 'activeComponentEditor', 'Blues editor panel'),
  'light-editor-panel': defineVariant('light-editor-panel', 'activeComponentEditor', 'Contrast editor panel'),
  'fitness-editor-panel': defineVariant('fitness-editor-panel', 'activeComponentEditor', 'Fitness editor panel'),

  'current-navigation': defineVariant('current-navigation', 'navigationPattern', 'Current navigation'),
});

function preset(id, label, variants) {
  return Object.freeze({
    id,
    label,
    variants: Object.freeze(variants),
  });
}

export const THEME_PRESETS = Object.freeze({
  tactical: preset('tactical', 'Tactical', {
    appShell: 'tactical-shell',
    scoreHeader: 'tactical-score-number',
    demographicsControls: 'visible-compact-selects',
    standardsSwitcher: 'current-standards-select',
    settingsPanel: 'tactical-panel',
    bodyCompositionCard: 'tactical-dense',
    componentSummaryStrip: 'tactical-dense-strip',
    componentSummaryCard: 'tactical-dense-strip',
    activeComponentEditor: 'tactical-editor-panel',
    strengthCard: 'tactical-dense',
    coreCard: 'tactical-dense',
    cardioCard: 'tactical-dense',
    lapDisplay: 'tactical-horizontal-bars',
    chartDisplay: 'tactical-drawer',
    inputControls: 'slider-plus-field',
    componentScoreDisplay: 'hud-chip',
    navigationPattern: 'current-navigation',
  }),
  stencil: preset('stencil', 'Stencil', {
    appShell: 'stencil-shell',
    scoreHeader: 'stencil-score-block',
    demographicsControls: 'visible-shared-row',
    standardsSwitcher: 'current-standards-select',
    settingsPanel: 'stencil-compact-panel',
    bodyCompositionCard: 'stencil-clipped',
    componentSummaryStrip: 'stencil-clipped-strip',
    componentSummaryCard: 'stencil-clipped-strip',
    activeComponentEditor: 'stencil-editor-panel',
    strengthCard: 'stencil-clipped',
    coreCard: 'stencil-clipped',
    cardioCard: 'stencil-clipped',
    lapDisplay: 'stencil-vertical-bars',
    chartDisplay: 'stencil-drawer',
    inputControls: 'tap-edit-plus-slider',
    componentScoreDisplay: 'stencil-points',
    navigationPattern: 'current-navigation',
  }),
  blues: preset('blues', 'Dress Blues', {
    appShell: 'blues-shell',
    scoreHeader: 'blues-ring',
    demographicsControls: 'visible-shared-row',
    standardsSwitcher: 'current-standards-select',
    settingsPanel: 'blues-drawer',
    bodyCompositionCard: 'blues-polished',
    componentSummaryStrip: 'blues-polished-strip',
    componentSummaryCard: 'blues-polished-strip',
    activeComponentEditor: 'blues-editor-panel',
    strengthCard: 'blues-polished',
    coreCard: 'blues-polished',
    cardioCard: 'blues-polished',
    lapDisplay: 'blues-table',
    chartDisplay: 'blues-chart-drawer',
    inputControls: 'stepper-plus-slider',
    componentScoreDisplay: 'progress-strip',
    navigationPattern: 'current-navigation',
  }),
  light: preset('light', 'Contrast', {
    appShell: 'light-shell',
    scoreHeader: 'light-card',
    demographicsControls: 'visible-shared-row',
    standardsSwitcher: 'current-standards-select',
    settingsPanel: 'light-drawer',
    bodyCompositionCard: 'light-clean',
    componentSummaryStrip: 'light-clean-strip',
    componentSummaryCard: 'light-clean-strip',
    activeComponentEditor: 'light-editor-panel',
    strengthCard: 'light-clean',
    coreCard: 'light-clean',
    cardioCard: 'light-clean',
    lapDisplay: 'light-rows',
    chartDisplay: 'light-chart-drawer',
    inputControls: 'numeric-field-plus-slider',
    componentScoreDisplay: 'clean-chip',
    navigationPattern: 'current-navigation',
  }),
  fitness: preset('fitness', 'Gradiant', {
    appShell: 'fitness-shell',
    scoreHeader: 'fitness-gradient-ring',
    demographicsControls: 'visible-glass-selects',
    standardsSwitcher: 'current-standards-select',
    settingsPanel: 'fitness-glass-drawer',
    bodyCompositionCard: 'fitness-gradient-card',
    componentSummaryStrip: 'fitness-gradient-strip',
    componentSummaryCard: 'fitness-gradient-strip',
    activeComponentEditor: 'fitness-editor-panel',
    strengthCard: 'fitness-gradient-card',
    coreCard: 'fitness-gradient-card',
    cardioCard: 'fitness-gradient-card',
    lapDisplay: 'fitness-tiles',
    chartDisplay: 'fitness-glass-chart',
    inputControls: 'tap-edit-plus-slider',
    componentScoreDisplay: 'gradient-chip',
    navigationPattern: 'current-navigation',
  }),
});

export function themePresetOptions() {
  return Object.values(THEME_PRESETS).map(({ id, label }) => ({ id, label }));
}

export function isKnownThemePreset(id) {
  return Object.hasOwn(THEME_PRESETS, id);
}

export function validateThemePreset(preset = THEME_PRESETS[DEFAULT_THEME_PRESET]) {
  const missingSlots = LAYOUT_SLOTS.filter((slot) => !preset.variants[slot]);
  const unknownVariants = Object.entries(preset.variants)
    .filter(([, variantId]) => !VARIANT_REGISTRY[variantId])
    .map(([slot, variantId]) => `${slot}:${variantId}`);
  const incompatibleVariants = Object.entries(preset.variants)
    .filter(([slot, variantId]) => {
      const variant = VARIANT_REGISTRY[variantId];
      return variant && !variant.compatibleSlots.includes(slot);
    })
    .map(([slot, variantId]) => `${slot}:${variantId}`);

  return {
    isValid: missingSlots.length === 0 && unknownVariants.length === 0 && incompatibleVariants.length === 0,
    incompatibleVariants,
    missingSlots,
    unknownVariants,
  };
}

export function resolveThemePreset(presetId = DEFAULT_THEME_PRESET, overrides = {}) {
  const preset = THEME_PRESETS[presetId] || THEME_PRESETS[DEFAULT_THEME_PRESET];
  const variants = {
    ...preset.variants,
    ...overrides,
  };

  return Object.freeze({
    id: preset.id,
    label: preset.label,
    variants: Object.freeze(variants),
    validation: validateThemePreset({ variants }),
  });
}
