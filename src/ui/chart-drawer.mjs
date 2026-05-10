const IMPLEMENTED_CHART_VARIANTS = new Set([
  'blues-chart-drawer',
  'fitness-glass-chart',
  'light-chart-drawer',
  'stencil-drawer',
  'tactical-drawer',
]);

const CHART_TITLES = [
  { token: 'runAltitudeAdjust', title: 'Run Altitude Adjustment' },
  { token: 'walkAltitudeAdjust', title: 'Walk/Shuttle Altitude Adjustment' },
  { token: 'shuttleScores', title: 'Shuttle Score Card' },
  { token: 'Strength_Abs', title: 'Strength/Core Score Chart' },
  { token: 'Run_Shuttle', title: 'Cardio Score Chart' },
  { token: 'cardio', title: 'Cardio Score Chart' },
];

function currentChartVariant() {
  const resolved = window.afptTheme?.getActiveThemePreset?.();
  const variant = resolved?.variants?.chartDisplay || 'light-chart-drawer';
  return IMPLEMENTED_CHART_VARIANTS.has(variant) ? variant : 'light-chart-drawer';
}

function chartTitleForSrc(src = '') {
  const match = CHART_TITLES.find(({ token }) => src.includes(token));
  return match?.title || 'Score Chart';
}

function setVariant(drawer, variant) {
  drawer.dataset.chartVariant = variant;
  drawer.classList.remove(
    'chart-drawer--blues-chart-drawer',
    'chart-drawer--fitness-glass-chart',
    'chart-drawer--light-chart-drawer',
    'chart-drawer--stencil-drawer',
    'chart-drawer--tactical-drawer',
  );
  drawer.classList.add(`chart-drawer--${variant}`);
}

function setOpenState(drawer, open) {
  drawer.dataset.chartOpen = String(open);
  document.body.classList.toggle('chart-drawer-open', open);
}

function syncDrawer(drawer, image, title, closeButton) {
  setVariant(drawer, currentChartVariant());
  setOpenState(drawer, !drawer.hidden);

  const imageSrc = image.getAttribute('src') || '';
  const chartTitle = chartTitleForSrc(imageSrc);
  title.innerText = chartTitle;
  drawer.dataset.chartTitle = chartTitle;
  drawer.dataset.chartSrc = imageSrc;
  image.alt = chartTitle;

  if (!drawer.hidden) {
    closeButton.focus({ preventScroll: true });
  }
}

function closeDrawer(drawer) {
  drawer.hidden = true;
  setOpenState(drawer, false);
}

function initChartDrawer() {
  const drawer = document.getElementById('modal');
  const image = document.getElementById('modal-img');
  const title = document.getElementById('chart-drawer-title');
  const closeButton = document.getElementById('close-btn');
  const scrim = document.getElementById('chart-drawer-scrim');

  if (!drawer || !image || !title || !closeButton || !scrim) return;

  const sync = () => syncDrawer(drawer, image, title, closeButton);
  const observer = new MutationObserver(sync);
  observer.observe(drawer, { attributes: true, attributeFilter: ['hidden'] });
  observer.observe(image, { attributes: true, attributeFilter: ['src'] });

  scrim.addEventListener('click', () => closeDrawer(drawer));
  closeButton.addEventListener('click', () => closeDrawer(drawer));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !drawer.hidden) {
      closeDrawer(drawer);
    }
  });
  document.addEventListener('afpt:themechange', sync);

  window.afptChartDrawer = Object.freeze({
    close: () => closeDrawer(drawer),
    sync,
  });

  sync();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initChartDrawer, { once: true });
} else {
  initChartDrawer();
}
