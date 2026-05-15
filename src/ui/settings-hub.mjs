const CLOSE_ON_ACTION_IDS = new Set([
  'dev-version-menu',
  'install-app-menu',
  'pwa-update-check',
  'run-adjust-chart',
  'walk-adjust-chart',
  'shuttle-score-card',
]);

function byId(id) {
  return document.getElementById(id);
}

function isOpen(panel) {
  return panel && !panel.hidden;
}

function setHubOpen(open, elements) {
  const { closeButton, panel, scrim, toggle } = elements;
  if (!panel || !scrim || !toggle) return;

  panel.hidden = !open;
  scrim.hidden = !open;
  toggle.setAttribute('aria-expanded', String(open));
  document.body.classList.toggle('settings-hub-open', open);

  if (open) {
    closeButton?.focus({ preventScroll: true });
  } else {
    toggle.focus({ preventScroll: true });
  }
}

function handleKeyboardAction(event) {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  const target = event.target.closest('[role="button"]');
  if (!target) return;

  event.preventDefault();
  target.click();
}

function initSettingsHub() {
  const elements = {
    closeButton: byId('settings-hub-close'),
    panel: byId('settings-hub-panel'),
    scrim: byId('settings-hub-scrim'),
    toggle: byId('settings-hub-toggle'),
  };

  if (!elements.panel || !elements.scrim || !elements.toggle) return;

  elements.toggle.addEventListener('click', () => {
    setHubOpen(!isOpen(elements.panel), elements);
  });

  elements.closeButton?.addEventListener('click', () => {
    setHubOpen(false, elements);
  });

  elements.scrim.addEventListener('click', () => {
    setHubOpen(false, elements);
  });

  elements.panel.addEventListener('keydown', handleKeyboardAction);

  elements.panel.addEventListener('click', (event) => {
    const item = event.target.closest('li');
    if (!item || !CLOSE_ON_ACTION_IDS.has(item.id)) return;
    window.requestAnimationFrame(() => setHubOpen(false, elements));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen(elements.panel)) {
      setHubOpen(false, elements);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSettingsHub, { once: true });
} else {
  initSettingsHub();
}
