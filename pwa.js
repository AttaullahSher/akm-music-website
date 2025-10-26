// Shared PWA logic for all pages
(function(){
  const isWebOrigin = location.protocol === 'http:' || location.protocol === 'https:';

  // Service Worker registration (web origins only)
  if (isWebOrigin && 'serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('service-worker.js');
        console.log('[PWA] Service Worker registered:', registration.scope);
        // Proactively check for updates
        try { registration.update(); } catch {}
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              showUpdateNotification();
            }
          });
        });
      } catch (e) {
        console.warn('[PWA] Service Worker registration failed:', e);
      }
    });
    // Auto-reload when the new SW takes control
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  } else if (!isWebOrigin) {
    console.info('[PWA] Non-web origin (', location.protocol, ') detected. Skipping Service Worker and install prompt.');
  }

  // Install prompt handling (web origins only)
  let deferredPrompt;
  let hasUserMadeInstallChoice = false;
  
  const isAppInstalled = () => {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.matchMedia('(display-mode: fullscreen)').matches ||
           window.matchMedia('(display-mode: minimal-ui)').matches ||
           window.navigator.standalone === true;
  };
  
  const trackPWAInstall = (action) => {
    if (window.gtag) {
      window.gtag('event', 'pwa_install', { action, timestamp: new Date().toISOString() });
    }
  };

  if (isWebOrigin) {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      if (!hasUserMadeInstallChoice && !isAppInstalled()) {
        showInstallPrompt();
      }
      trackPWAInstall('prompt_triggered');
    });

    window.addEventListener('appinstalled', () => {
      deferredPrompt = null;
      hasUserMadeInstallChoice = true;
      trackPWAInstall('installed');
      hideInstallPrompt();
    });
  }

  function showInstallPrompt() {
    const quickActionsCard = document.querySelector('.quick-actions-card');
    if (quickActionsCard) {
      const existing = quickActionsCard.querySelector('.install-button');
      if (existing) return;
      const installButton = document.createElement('button');
      installButton.className = 'install-button';
      installButton.innerHTML = '<i class="fas fa-download"></i> Install Music Tools App';
      installButton.addEventListener('click', installApp);
      quickActionsCard.appendChild(installButton);
      trackPWAInstall('prompt_shown');
    }
  }

  function hideInstallPrompt() {
    const installButton = document.querySelector('.install-button');
    if (installButton) installButton.remove();
  }

  async function installApp() {
    if (!deferredPrompt) return;
    try {
      trackPWAInstall('install_started');
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      hasUserMadeInstallChoice = true;
      if (choiceResult.outcome === 'accepted') trackPWAInstall('install_accepted');
      else trackPWAInstall('install_dismissed');
    } catch (error) {
      console.error('[PWA] Install error:', error);
      trackPWAInstall('install_error');
    } finally {
      deferredPrompt = null;
      hideInstallPrompt();
    }
  }
  window.installApp = installApp;

  function showUpdateNotification() {
    if (document.querySelector('.update-notification')) return;
    const notification = document.createElement('div');
    notification.className = 'update-notification';
    notification.innerHTML = `
      <div class="update-content">
        <i class="fas fa-sync-alt"></i>
        <span>New version available!</span>
        <button onclick="(function(){ if('serviceWorker' in navigator){ navigator.serviceWorker.getRegistration().then(r=>{ if(r&&r.waiting){ r.waiting.postMessage({type:'SKIP_WAITING'}); window.location.reload(); } }); } })()">Update</button>
        <button onclick="this.closest('.update-notification').remove()" aria-label="Dismiss update">&times;</button>
      </div>`;
    document.body.appendChild(notification);
    setTimeout(()=> notification.classList.add('show'), 100);
  }
})();