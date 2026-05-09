(function () {
  const swPath = './sw.js';
  const params = new URLSearchParams(window.location.search);
  const localHosts = new Set(['localhost', '127.0.0.1', '[::1]', '']);
  const isLocal = localHosts.has(window.location.hostname);
  const forceLocalServiceWorker = params.get('sw') === '1';
  const disableServiceWorker = params.get('no-sw') === '1';
  let refreshing = false;
  let reloadOnControllerChange = false;
  let updateRegistration = null;

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
    registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
  }

  function showUpdatePrompt(registration) {
    const modal = document.getElementById('pwa-update-modal');
    const updateButton = document.getElementById('pwa-update-now');
    const laterButton = document.getElementById('pwa-update-later');

    updateRegistration = registration;

    if (!modal || !updateButton || !laterButton) {
      activateWaitingWorker(registration);
      return;
    }

    modal.hidden = false;

    updateButton.onclick = () => {
      updateButton.disabled = true;
      activateWaitingWorker(updateRegistration);
    };

    laterButton.onclick = () => {
      modal.hidden = true;
    };
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

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!reloadOnControllerChange) return;
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  }

  window.addEventListener('load', () => {
    registerServiceWorker().catch((error) => {
      console.warn('Service worker setup failed:', error);
    });
  });
})();
