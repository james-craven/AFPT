import { DEFAULT_THEME_PRESET, THEME_PRESETS, THEME_STORAGE_KEY } from './layout-variants.mjs';

const STRIP_ID = 'component-summary-strip';
const SUMMARY_BUTTONS = {
  strength: 'summary-strength',
  core: 'summary-core',
  cardio: 'summary-cardio',
};
const EDITOR_PANELS = {
  strength: 'strength-editor',
  core: 'core-editor',
  cardio: 'cardio-editor',
};

let selectedComponent = 'strength';

function getPresetId() {
  return localStorage.getItem(THEME_STORAGE_KEY) || DEFAULT_THEME_PRESET;
}

function getStripVariant() {
  const presetId = getPresetId();
  const p = THEME_PRESETS[presetId] ?? THEME_PRESETS[DEFAULT_THEME_PRESET];
  return p.variants.componentSummaryStrip ?? 'tactical-dense-strip';
}

function applyVariant() {
  const strip = document.getElementById(STRIP_ID);
  if (!strip) return;
  const variant = getStripVariant();
  strip.className = `component-summary-strip component-summary-strip--${variant}`;
  strip.dataset.stripVariant = variant;
}

export function selectComponent(component) {
  selectedComponent = component;
  for (const [comp, id] of Object.entries(SUMMARY_BUTTONS)) {
    const btn = document.getElementById(id);
    if (btn) btn.setAttribute('aria-pressed', String(comp === component));
  }
  const editorContainer = document.getElementById('active-component-editor');
  if (editorContainer) editorContainer.dataset.activeComponent = component;
  for (const [comp, id] of Object.entries(EDITOR_PANELS)) {
    const panel = document.getElementById(id);
    if (panel) {
      if (comp === component) {
        panel.removeAttribute('hidden');
      } else {
        panel.setAttribute('hidden', '');
      }
    }
  }
  document.dispatchEvent(new CustomEvent('afpt:componentchange', { bubbles: true, detail: { component } }));
}

function init() {
  for (const [component, id] of Object.entries(SUMMARY_BUTTONS)) {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', () => selectComponent(component));
  }
  applyVariant();
  selectComponent(selectedComponent);
  document.addEventListener('afpt:themechange', applyVariant);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

window.afptComponentEditor = {
  getSelectedComponent: () => selectedComponent,
  selectComponent,
};
