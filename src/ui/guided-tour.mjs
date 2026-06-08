const DISMISSED_KEY = 'pfra.guidedTour.dismissed.v1';
const PROMPT_SESSION_KEY = 'pfra.guidedTour.promptSeen.v1';
const DESKTOP_QUERY = '(min-width: 980px)';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

const steps = [
  {
    title: 'Choose your standard',
    body: 'Use Standard for the regular PFRA tables. AFSPECWAR/EOD locks the calculator to the matching standard while the reference charts stay available.',
    selectors: ['.profile-standard-toggle', '.app-header-controls', '.demographics-row'],
  },
  {
    title: 'Set your profile',
    body: 'Pick sex and age group before comparing scores. The app updates the standards, minimums, and charts around that profile.',
    selectors: ['.app-header-controls', '.demographics-row'],
  },
  {
    title: 'Watch the total',
    body: 'Your total score and category update as each event changes. Use the pass and excellent markers to see how much room you have.',
    selectors: ['#app-header-score-pill', '.score-section'],
  },
  {
    title: 'Compare each area',
    body: 'These score summaries show strength, core, cardio, and body composition together so you can spot the area that moves your total fastest.',
    selectors: ['.desktop-score-breakdown', '.component-strip'],
  },
  {
    title: 'Adjust strength',
    body: 'Switch between push-ups, hand-release push-ups, or exempt status. Use the field, slider, min/max buttons, or chart to compare options.',
    selectors: ['#strength-editor', '#summary-strength'],
    component: 'strength',
  },
  {
    title: 'Adjust core',
    body: 'Choose the core event you plan to test. Reps and plank time use different tables, so the chart is useful when comparing variants.',
    selectors: ['#core-editor', '#summary-core'],
    component: 'core',
  },
  {
    title: 'Plan cardio',
    body: 'Set your run time, HAMR shuttles, walk option, or exemption. Cardio carries the most points, so small improvements can matter.',
    selectors: ['#cardio-editor', '#summary-cardio'],
    component: 'cardio',
  },
  {
    title: 'Check WHtR',
    body: 'Enter waist-to-height ratio directly or calculate it from height and waist. The step buttons make small measurement changes easier to test.',
    selectors: ['#body-editor', '#summary-body'],
    component: 'body',
  },
  {
    title: 'Use the pace plan',
    body: 'Pick a goal run time and review the lap-by-lap splits. Practicing the pace helps you start controlled and finish with intent.',
    selectors: ['.pace-plan-section', '#run-lap-times'],
    component: 'cardio',
  },
  {
    title: 'Open charts and references',
    body: 'Use score charts when you want the full table, and use Controls for official references, altitude adjustments, audio, updates, and this tour.',
    selectors: ['#settings-hub-toggle', '#push-btn', '#run-btn'],
  },
];

let elements;
let currentIndex = 0;
let active = false;
let lastFocusedElement = null;
let resizeObserver = null;
let stepRequest = 0;

function byId(id) {
  return document.getElementById(id);
}

function safeStorage(storage, key, value) {
  try {
    if (arguments.length === 3) {
      storage.setItem(key, value);
      return value;
    }
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function isDesktop() {
  return window.matchMedia(DESKTOP_QUERY).matches;
}

function prefersReducedMotion() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function waitForFrame() {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => window.requestAnimationFrame(resolve));
  });
}

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function isVisible(element) {
  if (!element) return false;
  const style = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return (
    style.display !== 'none'
    && style.visibility !== 'hidden'
    && rect.width > 0
    && rect.height > 0
  );
}

function getTarget(selectors) {
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (isVisible(element)) return element;
  }
  return null;
}

function activateComponent(component) {
  if (!component || isDesktop()) return;
  const chip = document.querySelector(`[data-component="${component}"]`);
  if (chip && isVisible(chip)) {
    chip.click();
  }
}

function preventBackgroundScroll(event) {
  if (!elements || elements.root.hidden) return;
  if (event.target.closest('.guided-tour-card, .guided-tour-prompt-card')) return;
  event.preventDefault();
}

function ensureElements() {
  if (elements) return elements;

  const root = document.createElement('div');
  root.id = 'guided-tour-root';
  root.className = 'guided-tour-root';
  root.hidden = true;
  root.innerHTML = `
    <div class="guided-tour-highlight" aria-hidden="true"></div>
    <section class="guided-tour-card" role="dialog" aria-modal="true" aria-labelledby="guided-tour-title" aria-describedby="guided-tour-body" hidden>
      <p id="guided-tour-progress" class="guided-tour-progress"></p>
      <h2 id="guided-tour-title"></h2>
      <p id="guided-tour-body"></p>
      <div class="guided-tour-actions">
        <button id="guided-tour-back" class="guided-tour-secondary" type="button">Back</button>
        <button id="guided-tour-skip" class="guided-tour-secondary" type="button">Skip</button>
        <button id="guided-tour-next" class="guided-tour-primary" type="button">Next</button>
      </div>
    </section>
    <section class="guided-tour-prompt" role="dialog" aria-modal="true" aria-labelledby="guided-tour-prompt-title" aria-describedby="guided-tour-prompt-body" hidden>
      <div class="guided-tour-prompt-card">
        <p class="guided-tour-progress">Quick orientation</p>
        <h2 id="guided-tour-prompt-title">Take a quick tour?</h2>
        <p id="guided-tour-prompt-body">Walk through the score, event controls, charts, references, and pace plan in about a minute.</p>
        <label class="guided-tour-check">
          <input id="guided-tour-dont-show" type="checkbox">
          <span>Don't show this again</span>
        </label>
        <div class="guided-tour-actions">
          <button id="guided-tour-prompt-skip" class="guided-tour-secondary" type="button">Skip</button>
          <button id="guided-tour-prompt-start" class="guided-tour-primary" type="button">Start Tour</button>
        </div>
      </div>
    </section>
  `;

  document.body.append(root);

  elements = {
    root,
    highlight: root.querySelector('.guided-tour-highlight'),
    card: root.querySelector('.guided-tour-card'),
    prompt: root.querySelector('.guided-tour-prompt'),
    title: byId('guided-tour-title'),
    body: byId('guided-tour-body'),
    progress: byId('guided-tour-progress'),
    back: byId('guided-tour-back'),
    skip: byId('guided-tour-skip'),
    next: byId('guided-tour-next'),
    promptStart: byId('guided-tour-prompt-start'),
    promptSkip: byId('guided-tour-prompt-skip'),
    promptCheck: byId('guided-tour-dont-show'),
  };

  elements.back.addEventListener('click', () => showStep(currentIndex - 1));
  elements.next.addEventListener('click', () => {
    if (currentIndex >= steps.length - 1) {
      finishTour();
      return;
    }
    showStep(currentIndex + 1);
  });
  elements.skip.addEventListener('click', finishTour);
  elements.promptStart.addEventListener('click', () => {
    rememberPromptChoice();
    startTour();
  });
  elements.promptSkip.addEventListener('click', () => {
    rememberPromptChoice();
    closePrompt();
  });

  root.addEventListener('wheel', preventBackgroundScroll, { passive: false });
  root.addEventListener('touchmove', preventBackgroundScroll, { passive: false });

  return elements;
}

function rememberPromptChoice() {
  safeStorage(window.sessionStorage, PROMPT_SESSION_KEY, 'true');
  if (elements?.promptCheck?.checked) {
    safeStorage(window.localStorage, DISMISSED_KEY, 'true');
  }
}

function setRootMode(mode) {
  const ui = ensureElements();
  ui.root.hidden = false;
  ui.root.classList.toggle('guided-tour-root--prompt', mode === 'prompt');
  ui.root.classList.toggle('guided-tour-root--active', mode === 'tour');
  ui.prompt.hidden = mode !== 'prompt';
  ui.card.hidden = mode !== 'tour';
  ui.highlight.hidden = mode !== 'tour';
}

function showPrompt() {
  if (active) return;
  if (elements && !elements.root.hidden) return;
  if (safeStorage(window.localStorage, DISMISSED_KEY) === 'true') return;
  if (safeStorage(window.sessionStorage, PROMPT_SESSION_KEY) === 'true') return;

  active = false;
  lastFocusedElement = document.activeElement;
  setRootMode('prompt');
  safeStorage(window.sessionStorage, PROMPT_SESSION_KEY, 'true');
  elements.promptStart.focus({ preventScroll: true });
}

function closePrompt() {
  const ui = ensureElements();
  ui.root.hidden = true;
  ui.root.classList.remove('guided-tour-root--prompt');
  ui.prompt.hidden = true;
  ui.promptCheck.checked = false;
  if (lastFocusedElement instanceof HTMLElement) {
    lastFocusedElement.focus({ preventScroll: true });
  }
}

async function showStep(index) {
  if (!active) return;
  const requestId = ++stepRequest;
  currentIndex = clamp(index, 0, steps.length - 1);
  const step = steps[currentIndex];

  activateComponent(step.component);
  await waitForFrame();
  if (!active || requestId !== stepRequest) return;

  const target = getTarget(step.selectors);
  if (target) {
    target.scrollIntoView({
      block: 'center',
      inline: 'nearest',
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
    if (!prefersReducedMotion()) {
      await sleep(260);
    }
  }
  if (!active || requestId !== stepRequest) return;

  positionTour(target || getTarget(step.selectors));

  elements.title.textContent = step.title;
  elements.body.textContent = step.body;
  elements.progress.textContent = `Step ${currentIndex + 1} of ${steps.length}`;
  elements.back.disabled = currentIndex === 0;
  elements.next.textContent = currentIndex === steps.length - 1 ? 'Finish' : 'Next';

  await waitForFrame();
  if (!active || requestId !== stepRequest) return;
  positionTour(target || getTarget(step.selectors));
}

function positionTour(target) {
  if (!active || !target) return;

  const rect = target.getBoundingClientRect();
  const padding = 8;
  const safe = 14;
  const top = clamp(rect.top - padding, safe, window.innerHeight - safe);
  const left = clamp(rect.left - padding, safe, window.innerWidth - safe);
  const width = clamp(rect.width + padding * 2, 44, window.innerWidth - safe * 2);
  const height = clamp(rect.height + padding * 2, 44, window.innerHeight - safe * 2);

  elements.highlight.style.setProperty('--tour-top', `${top}px`);
  elements.highlight.style.setProperty('--tour-left', `${left}px`);
  elements.highlight.style.setProperty('--tour-width', `${width}px`);
  elements.highlight.style.setProperty('--tour-height', `${height}px`);

  const card = elements.card;
  const cardWidth = card.offsetWidth;
  const cardHeight = card.offsetHeight;
  const targetMidpoint = left + width / 2;
  const spaceBelow = window.innerHeight - (top + height);
  const belowTop = top + height + 14;
  const aboveTop = top - cardHeight - 14;
  const verticalCenter = Math.max(safe, (window.innerHeight - cardHeight) / 2);

  const cardTop = spaceBelow >= cardHeight + 28
    ? belowTop
    : aboveTop >= safe
      ? aboveTop
      : verticalCenter;
  const cardLeft = clamp(targetMidpoint - cardWidth / 2, safe, window.innerWidth - cardWidth - safe);

  card.style.setProperty('--tour-card-top', `${clamp(cardTop, safe, window.innerHeight - cardHeight - safe)}px`);
  card.style.setProperty('--tour-card-left', `${cardLeft}px`);
}

function updatePosition() {
  if (!active) return;
  const step = steps[currentIndex];
  positionTour(getTarget(step.selectors));
}

function startTour() {
  const ui = ensureElements();
  const focusedElement = document.activeElement;

  active = true;
  safeStorage(window.sessionStorage, PROMPT_SESSION_KEY, 'true');
  if (focusedElement instanceof HTMLElement && !ui.root.contains(focusedElement)) {
    lastFocusedElement = focusedElement;
  }
  currentIndex = 0;
  setRootMode('tour');
  document.documentElement.classList.add('guided-tour-active');
  document.body.classList.add('guided-tour-active');

  window.addEventListener('resize', updatePosition);
  window.addEventListener('scroll', updatePosition, { passive: true });

  if ('ResizeObserver' in window) {
    resizeObserver = new ResizeObserver(updatePosition);
    resizeObserver.observe(document.body);
  }

  showStep(0);
  ui.next.focus({ preventScroll: true });
}

function finishTour() {
  const ui = ensureElements();
  active = false;
  ui.root.hidden = true;
  ui.root.classList.remove('guided-tour-root--active', 'guided-tour-root--prompt');
  ui.card.hidden = true;
  ui.prompt.hidden = true;
  ui.promptCheck.checked = false;
  document.documentElement.classList.remove('guided-tour-active');
  document.body.classList.remove('guided-tour-active');
  window.removeEventListener('resize', updatePosition);
  window.removeEventListener('scroll', updatePosition);
  resizeObserver?.disconnect();
  resizeObserver = null;
  stepRequest += 1;

  if (lastFocusedElement instanceof HTMLElement) {
    lastFocusedElement.focus({ preventScroll: true });
  }
}

function handleDocumentKeydown(event) {
  if (!active && (!elements || elements.root.hidden)) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    if (active) {
      finishTour();
    } else {
      closePrompt();
    }
  }
}

function scheduleFirstRunPrompt() {
  if (safeStorage(window.localStorage, DISMISSED_KEY) === 'true') return;
  if (safeStorage(window.sessionStorage, PROMPT_SESSION_KEY) === 'true') return;

  const showWhenSettled = () => {
    window.setTimeout(() => {
      if (active) return;
      const anyModalOpen = document.querySelector('.modal-overlay:not([hidden]), .chart-drawer:not([hidden]), .desktop-references-modal:not([hidden]), .settings-hub-panel:not([hidden])');
      if (!anyModalOpen) {
        showPrompt();
      }
    }, 900);
  };

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(showWhenSettled, { timeout: 3500 });
  } else {
    window.setTimeout(showWhenSettled, 3500);
  }
}

function initGuidedTour() {
  const menuItem = byId('start-app-tour-menu');
  menuItem?.addEventListener('click', () => {
    closePrompt();
    startTour();
  });

  document.addEventListener('keydown', handleDocumentKeydown);
  scheduleFirstRunPrompt();

  window.pfraGuidedTour = {
    start: startTour,
    showPrompt,
    dismiss() {
      safeStorage(window.localStorage, DISMISSED_KEY, 'true');
    },
    reset() {
      try {
        window.localStorage.removeItem(DISMISSED_KEY);
        window.sessionStorage.removeItem(PROMPT_SESSION_KEY);
      } catch {
        // Storage can be disabled in private browsing; the tour still works.
      }
    },
  };
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGuidedTour, { once: true });
} else {
  initGuidedTour();
}
