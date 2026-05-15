(function () {
  const swPath = './sw.js';
  const params = new URLSearchParams(window.location.search);
  const localHosts = new Set(['localhost', '127.0.0.1', '[::1]', '']);
  const isLocal = localHosts.has(window.location.hostname);
  const forceLocalServiceWorker = params.get('sw') === '1';
  const disableServiceWorker = params.get('no-sw') === '1';
  let refreshing = false;
  let reloadOnControllerChange = false;
  let activeRegistration = null;
  let updateRegistration = null;
  let deferredInstallPrompt = null;

  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  }

  function platformName() {
    const ua = window.navigator.userAgent || '';
    const platform = window.navigator.platform || '';
    const isIos = /iPad|iPhone|iPod/.test(platform) || (/Macintosh/.test(platform) && navigator.maxTouchPoints > 1);
    if (isIos) return 'ios';
    if (/Android/i.test(ua)) return 'android';
    return 'desktop';
  }

  function shouldEnableServiceWorker() {
    if (disableServiceWorker || !('serviceWorker' in navigator)) return false;
    if (window.location.protocol === 'file:') return false;
    if (isLocal) return forceLocalServiceWorker;
    return window.location.protocol === 'https:';
  }

  async function unregisterLocalServiceWorkers() {
    if (!('serviceWorker' in navigator) || !isLocal || forceLocalServiceWorker) return;

    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  }

  function activateWaitingWorker(registration) {
    reloadOnControllerChange = true;
    try {
      window.sessionStorage.setItem('afpt.updateCompletePending', '1');
    } catch {
      // Storage restrictions should not block updates.
    }
    registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
  }

  function setUpdateModal({ actionLabel, message, showAction = false, title }) {
    const modal = document.getElementById('pwa-update-modal');
    const titleEl = document.getElementById('pwa-update-title');
    const messageEl = document.getElementById('pwa-update-message');
    const updateButton = document.getElementById('pwa-update-now');
    const laterButton = document.getElementById('pwa-update-later');

    if (titleEl) titleEl.textContent = title;
    if (messageEl) messageEl.textContent = message;
    if (updateButton) {
      updateButton.hidden = !showAction;
      updateButton.disabled = false;
      if (actionLabel) updateButton.textContent = actionLabel;
    }
    if (laterButton) laterButton.textContent = showAction ? 'Later' : 'Close';
    if (modal) modal.hidden = false;
  }

  function showUpdatePrompt(registration) {
    const updateButton = document.getElementById('pwa-update-now');
    const laterButton = document.getElementById('pwa-update-later');

    updateRegistration = registration;

    if (!updateButton || !laterButton) {
      activateWaitingWorker(registration);
      return;
    }

    setUpdateModal({
      actionLabel: 'Update Now',
      message: 'A new offline version is available. Update now to replace the cached app files.',
      showAction: true,
      title: 'Update Ready',
    });

    updateButton.onclick = () => {
      updateButton.disabled = true;
      activateWaitingWorker(updateRegistration);
    };

    laterButton.onclick = () => {
      document.getElementById('pwa-update-modal')?.setAttribute('hidden', '');
    };
  }

  function showUpdateMessage(title, message) {
    const updateButton = document.getElementById('pwa-update-now');
    const laterButton = document.getElementById('pwa-update-later');

    setUpdateModal({
      message,
      showAction: false,
      title,
    });

    if (updateButton) updateButton.onclick = null;
    if (laterButton) {
      laterButton.onclick = () => {
        document.getElementById('pwa-update-modal')?.setAttribute('hidden', '');
      };
    }
  }

  function waitForUpdateInstall(registration, timeoutMs = 4500) {
    return new Promise((resolve) => {
      let settled = false;
      const done = (value) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };
      const timer = window.setTimeout(() => done(false), timeoutMs);
      const watchWorker = (worker) => {
        if (!worker) return;
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed') {
            window.clearTimeout(timer);
            done(true);
          }
        });
      };

      if (registration.installing) watchWorker(registration.installing);
      registration.addEventListener('updatefound', () => watchWorker(registration.installing), { once: true });
    });
  }

  function watchForWaitingWorker(registration) {
    if (registration.waiting && navigator.serviceWorker.controller) {
      showUpdatePrompt(registration);
      return;
    }

    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      if (!worker) return;

      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          showUpdatePrompt(registration);
        }
      });
    });
  }

  async function registerServiceWorker() {
    if (!shouldEnableServiceWorker()) {
      await unregisterLocalServiceWorkers();
      return;
    }

    const registration = await navigator.serviceWorker.register(swPath);
    activeRegistration = registration;
    watchForWaitingWorker(registration);

    if (navigator.onLine) {
      registration.update().catch(() => {});
    }

    window.addEventListener('online', () => {
      registration.update().catch(() => {});
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        registration.update().catch(() => {});
      }
    });
  }

  async function checkForUpdates() {
    if (!activeRegistration) {
      showUpdateMessage(
        'Update Unavailable',
        'Automatic update checks are only available when the service worker is active. In local development, open with ?sw=1 to test this flow.',
      );
      return { checked: false, reason: 'service-worker-unavailable' };
    }

    if (!navigator.onLine) {
      showUpdateMessage('Offline', 'Connect to the internet, then check again for the newest offline version.');
      return { checked: false, reason: 'offline' };
    }

    if (activeRegistration.waiting && navigator.serviceWorker.controller) {
      showUpdatePrompt(activeRegistration);
      return { checked: true, updateAvailable: true };
    }

    showUpdateMessage('Checking for Updates', 'Checking for a newer offline version...');
    const updateInstalled = waitForUpdateInstall(activeRegistration);
    await activeRegistration.update();
    await updateInstalled;

    if (activeRegistration.waiting && navigator.serviceWorker.controller) {
      showUpdatePrompt(activeRegistration);
      return { checked: true, updateAvailable: true };
    }

    showUpdateMessage('Current Version', 'This app is already on the current cached version.');
    return { checked: true, updateAvailable: false };
  }

  function installInstructions() {
    const platform = platformName();
    if (isStandalone()) {
      return {
        status: 'This app is already installed and running in standalone mode.',
        steps: [],
      };
    }

    if (deferredInstallPrompt) {
      return {
        status: 'Your browser supports a native install prompt.',
        steps: ['Tap Install App to add this PWA to your Home Screen or app launcher.'],
      };
    }

    if (platform === 'ios') {
      return {
        status: 'iPhone and iPad do not allow websites to install PWAs automatically.',
        steps: [
          'Open this site in Safari.',
          'Tap the Share button.',
          'Choose Add to Home Screen.',
          'Tap Add.',
        ],
      };
    }

    if (platform === 'android') {
      return {
        status: 'If the native install prompt is not available, install from your browser menu.',
        steps: [
          'Open this site in Chrome or another PWA-capable browser.',
          'Tap the three-dot menu.',
          'Choose Install app or Add to Home screen.',
          'Confirm the install.',
        ],
      };
    }

    return {
      status: 'Install support depends on your desktop browser.',
      steps: [
        'Look for the install icon in the address bar.',
        'Or open the browser menu and choose Install app.',
        'If no install option is shown, keep the site bookmarked and try again after loading it over HTTPS.',
      ],
    };
  }

  function setInstallModalContent({ showNativeButton, status: statusText, steps }) {
    const modal = document.getElementById('install-modal');
    const status = document.getElementById('install-status');
    const instructions = document.getElementById('install-instructions');
    const installButton = document.getElementById('pwa-install-now');
    const closeButton = document.getElementById('install-close');

    if (status) status.textContent = statusText;
    if (instructions) {
      instructions.innerHTML = steps.length
        ? `<ol>${steps.map((step) => `<li>${step}</li>`).join('')}</ol>`
        : '';
    }
    if (installButton) {
      installButton.hidden = !showNativeButton;
      installButton.disabled = false;
      installButton.onclick = () => promptNativeInstall();
    }
    if (closeButton) {
      closeButton.onclick = () => {
        modal?.setAttribute('hidden', '');
      };
    }
    if (modal) modal.hidden = false;
  }

  function renderInstallModal() {
    const content = installInstructions();
    setInstallModalContent({
      showNativeButton: Boolean(deferredInstallPrompt && !isStandalone()),
      status: content.status,
      steps: content.steps,
    });
  }

  async function promptNativeInstall() {
    if (!deferredInstallPrompt || isStandalone()) {
      renderInstallModal();
      return { prompted: false };
    }

    const promptEvent = deferredInstallPrompt;
    deferredInstallPrompt = null;
    setInstallModalContent({
      showNativeButton: false,
      status: 'Opening the browser install prompt...',
      steps: [],
    });

    try {
      promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice.outcome === 'accepted') {
        setInstallModalContent({
          showNativeButton: false,
          status: 'Install started. The app should appear on your Home Screen or app launcher.',
          steps: [],
        });
      } else {
        const fallback = installInstructions();
        setInstallModalContent({
          showNativeButton: false,
          status: 'Install was dismissed. You can still install manually from your browser menu.',
          steps: fallback.steps,
        });
      }
      return { prompted: true, outcome: choice.outcome };
    } catch {
      const fallback = installInstructions();
      setInstallModalContent({
        showNativeButton: false,
        status: 'The browser install prompt could not be opened automatically.',
        steps: fallback.steps,
      });
      return { prompted: false, reason: 'prompt-failed' };
    }
  }

  function showInstallHelp(options = {}) {
    if (options.promptIfAvailable && deferredInstallPrompt && !isStandalone()) {
      void promptNativeInstall();
    } else {
      renderInstallModal();
    }
    return {
      canPrompt: Boolean(deferredInstallPrompt),
      installed: isStandalone(),
      platform: platformName(),
    };
  }

  function showPendingUpdateCompletion() {
    let pending = false;
    try {
      pending = window.sessionStorage.getItem('afpt.updateCompletePending') === '1';
      if (pending) window.sessionStorage.removeItem('afpt.updateCompletePending');
    } catch {
      pending = false;
    }

    if (pending) {
      showUpdateMessage('Update Complete', 'Update completed successfully. The newest offline version is now active.');
    }
  }

  window.afptPwa = Object.freeze({
    showInstallHelp,
    checkForUpdates,
  });

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    showInstallHelp();
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!reloadOnControllerChange) return;
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  }

  window.addEventListener('load', () => {
    showPendingUpdateCompletion();
    registerServiceWorker().catch((error) => {
      console.warn('Service worker setup failed:', error);
    });
  });
})();
