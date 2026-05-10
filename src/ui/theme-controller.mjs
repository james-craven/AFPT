import {
  DEFAULT_THEME_PRESET,
  THEME_PRESETS,
  THEME_STORAGE_KEY,
  isKnownThemePreset,
  resolveThemePreset,
  themePresetOptions,
} from './layout-variants.mjs';

let activePreset = DEFAULT_THEME_PRESET;

function readStoredPreset(storage = window.localStorage) {
  try {
    const stored = storage.getItem(THEME_STORAGE_KEY);
    return isKnownThemePreset(stored) ? stored : null;
  } catch {
    return null;
  }
}

function storePreset(presetId, storage = window.localStorage) {
  try {
    storage.setItem(THEME_STORAGE_KEY, presetId);
  } catch {
    // Private browsing or storage restrictions should not block the app.
  }
}

function setThemeAttributes(presetId, root = document.documentElement) {
  const resolved = resolveThemePreset(presetId);
  root.dataset.theme = resolved.id;
  root.dataset.themePreset = resolved.id;
  document.body?.setAttribute('data-theme', resolved.id);
  document.body?.setAttribute('data-theme-preset', resolved.id);

  return resolved;
}

export function applyThemePreset(presetId, { persist = true } = {}) {
  const nextPreset = isKnownThemePreset(presetId) ? presetId : DEFAULT_THEME_PRESET;
  const resolved = setThemeAttributes(nextPreset);
  activePreset = resolved.id;

  if (persist) storePreset(activePreset);

  document.dispatchEvent(new CustomEvent('afpt:themechange', {
    detail: resolved,
  }));

  return resolved;
}

export function getActiveThemePreset() {
  return resolveThemePreset(activePreset);
}

function syncSelect(select, presetId) {
  if (!select) return;
  select.value = presetId;
}

function populateSelect(select) {
  if (!select) return;

  const existing = new Set(Array.from(select.options).map((option) => option.value));
  for (const { id, label } of themePresetOptions()) {
    if (existing.has(id)) continue;
    select.add(new Option(label, id));
  }
}

function initThemeController() {
  const select = document.getElementById('theme-preset-select');
  const initialPreset = readStoredPreset() || DEFAULT_THEME_PRESET;

  populateSelect(select);
  applyThemePreset(initialPreset, { persist: false });
  syncSelect(select, activePreset);

  select?.addEventListener('change', () => {
    const resolved = applyThemePreset(select.value);
    syncSelect(select, resolved.id);
  });
}

window.afptTheme = Object.freeze({
  DEFAULT_THEME_PRESET,
  THEME_PRESETS,
  THEME_STORAGE_KEY,
  applyThemePreset,
  getActiveThemePreset,
  isKnownThemePreset,
  resolveThemePreset,
  themePresetOptions,
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initThemeController, { once: true });
} else {
  initThemeController();
}
