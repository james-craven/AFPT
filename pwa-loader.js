(function () {
  const pwaSrc = './pwa.js';
  const pwaIdleDelayMs = 5500;
  const pwaIdleTimeoutMs = 3000;
  let loadPromise = null;
  let deferredInstallPrompt = null;
  let installedBeforeLoad = false;

  function loadPwa() {
    if (window.afptPwa && !window.afptPwa.__loadingStub) {
      return Promise.resolve(window.afptPwa);
    }
    if (loadPromise) return loadPromise;

    loadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = pwaSrc;
      script.async = true;
      script.onload = () => resolve(window.afptPwa);
      script.onerror = () => reject(new Error('PWA helper failed to load'));
      document.head.append(script);
    });

    return loadPromise;
  }

  function callPwaApi(method, args) {
    return loadPwa()
      .then((api) => api?.[method]?.(...args))
      .catch((error) => {
        console.warn(error.message);
        return null;
      });
  }

  window.afptPwaBootstrap = Object.freeze({
    clearInstallPrompt() {
      deferredInstallPrompt = null;
    },
    consumeInstallPrompt() {
      const prompt = deferredInstallPrompt;
      deferredInstallPrompt = null;
      return prompt;
    },
    load: loadPwa,
    wasInstalledBeforeLoad() {
      return installedBeforeLoad;
    },
  });

  window.afptPwa = {
    __loadingStub: true,
    checkForUpdates() {
      return callPwaApi('checkForUpdates', []);
    },
    showInstallHelp(options) {
      return callPwaApi('showInstallHelp', [options]);
    },
  };

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
  });

  window.addEventListener('appinstalled', () => {
    installedBeforeLoad = true;
    deferredInstallPrompt = null;
  });

  function scheduleIdleLoad() {
    const load = () => {
      loadPwa().catch((error) => {
        console.warn(error.message);
      });
    };
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(load, { timeout: pwaIdleTimeoutMs });
    } else {
      window.setTimeout(load, 0);
    }
  }

  function scheduleLoadAfterPaint() {
    window.setTimeout(scheduleIdleLoad, pwaIdleDelayMs);
  }

  if (document.readyState === 'complete') {
    scheduleLoadAfterPaint();
  } else {
    window.addEventListener('load', scheduleLoadAfterPaint, { once: true });
  }
})();
