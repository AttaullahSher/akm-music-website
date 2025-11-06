// AKM Music Service Worker
// Provides offline functionality and PWA features

const CACHE_NAME = 'akm-music-v4.0.2';
const STATIC_CACHE = 'akm-static-v4.0.2';
const DYNAMIC_CACHE = 'akm-dynamic-v4.0.2';

// Files to cache for offline functionality (relative paths for GitHub Pages)
// Updated to only include current CSS files
const CACHE_ASSETS = [
  'index.html',
  'tools.html',
  'blog.html',
  'about.html',
  'gallery.html',
  'contact.html',
  '404.html',
  'master-design.css',
  'tools-master.css',
  'fixes.css',
  'script.js',
  'tools.js',
  'blog.js',
  'analytics.js',
  'pwa.js',
  'google-analytics.js',
  'seo-optimizer.js',
  'assets/Logo & Icons/logo.png',
  'assets/Logo & Icons/favicon.ico',
  'assets/Logo & Icons/Whatsapp_icon.png',
  'assets/Banners_images/banner-hero.jpg',
  'assets/Banners_images/3D274.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(CACHE_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Static assets cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Cache failed', error);
      })
  );
});

// Activate event - clean up old caches AGGRESSIVELY
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        console.log('Service Worker: Deleting ALL old caches to force refresh');
        // Delete ALL caches to force complete refresh
        return Promise.all(cacheNames.map((cacheName) => {
          console.log('Service Worker: Deleting cache', cacheName);
          return caches.delete(cacheName);
        }));
      })
      .then(() => {
        console.log('Service Worker: All old caches deleted');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Debug bypass: allow opting out of SW via ?no-sw=1
  if (url.searchParams && url.searchParams.get('no-sw') === '1') {
    event.respondWith(fetch(request));
    return;
  }

  // Run legacy CSS mapper at the top so even old HTML gets valid CSS
  const legacyCssResponse = respondWithLegacyCss(url);
  if (legacyCssResponse) {
    event.respondWith(legacyCssResponse);
    return;
  }

  // Handle different types of requests
  if (request.method === 'GET') {
    // For navigation requests (pages)
    if (request.mode === 'navigate') {
      event.respondWith(handleNavigationRequest(request));
    }
    // For static assets
    else if (isStaticAsset(url)) {
      event.respondWith(handleStaticAssetRequest(request));
    }
    // For images
    else if (isImageRequest(url)) {
      event.respondWith(handleImageRequest(request));
    }
    // For API requests
    else if (isAPIRequest(url)) {
      event.respondWith(handleAPIRequest(request));
    }
    // For everything else
    else {
      event.respondWith(handleGenericRequest(request));
    }
  }
});

// Handle navigation requests (HTML pages)
async function handleNavigationRequest(request) {
  try {
    // Try network first for navigation
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
  } catch (error) {
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Ultimate fallback - return offline page or index
    const fallbackResponse = await caches.match('index.html');
    return fallbackResponse || new Response('Offline - please check your connection', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Legacy CSS mapper: serve current CSS when old filenames are requested
function respondWithLegacyCss(url) {
  const name = url.pathname.split('/').pop().toLowerCase();
  const commonCss = "@import url('master-design.css?v=20251108b');\n@import url('fixes.css?v=20251108b');\n";
  const legacyCommon = new Set([
    'styles.css',
    'modern-styles.css',
    'blue-theme.css',
    'light-theme-improvements.css',
    'design-improvements.css'
  ]);
  if (legacyCommon.has(name)) {
    return new Response(commonCss, { headers: { 'Content-Type': 'text/css' } });
  }
  if (name === 'tools-styles.css') {
    return new Response(commonCss + "@import url('tools-master.css?v=20251108b');\n", {
      headers: { 'Content-Type': 'text/css' }
    });
  }
  return null;
}

// Handle static asset requests (CSS, JS, fonts)
async function handleStaticAssetRequest(request) {
  const url = new URL(request.url);

  // First, map any legacy CSS filenames to current CSS so old pages still render
  const legacy = respondWithLegacyCss(url);
  if (legacy) {
    return legacy;
  }

  // Don't try to cache external CDN resources in service worker
  // Let browser handle CDN caching naturally
  if (url.hostname !== self.location.hostname && 
      (url.hostname.includes('cdnjs.cloudflare.com') || 
       url.hostname.includes('unpkg.com') ||
       url.hostname.includes('jsdelivr.net') ||
       url.hostname.includes('fonts.googleapis.com') ||
       url.hostname.includes('fonts.gstatic.com'))) {
    // Pass through to network without SW intervention
    return fetch(request);
  }

  try {
    // Try cache first for local static assets
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // If not in cache, fetch and cache (local assets only)
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }

    throw new Error('Network response not ok');
  } catch (error) {
    // Only log for local assets
    if (url.hostname === self.location.hostname) {
      console.warn('Failed to fetch local asset:', request.url);
    }
    return new Response('Asset unavailable offline', {
      status: 404,
      statusText: 'Not Found'
    });
  }
}

// Handle image requests
async function handleImageRequest(request) {
  try {
    // Try cache first for images
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fetch from network
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache images in dynamic cache
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Image not found');
  } catch (error) {
    // Return placeholder image for offline
    const fallbackImage = await caches.match('assets/Logo & Icons/logo.png');
    return fallbackImage || new Response('Image unavailable', {
      status: 404,
      statusText: 'Image Not Found'
    });
  }
}

// Handle API requests
async function handleAPIRequest(request) {
  try {
    // For API requests, prefer network
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful API responses (with expiry)
      const cache = await caches.open(DYNAMIC_CACHE);
      const headers = new Headers(networkResponse.headers);
      headers.set('sw-cached-at', String(Date.now()));
      const responseToCache = new Response(await networkResponse.clone().blob(), {
        status: networkResponse.status,
        statusText: networkResponse.statusText,
        headers
      });
      
      cache.put(request, responseToCache);
      return networkResponse;
    }
    
    throw new Error('API request failed');
  } catch (error) {
    // Try cached version
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      // Check if cached response is not too old (1 hour)
      const cachedAt = cachedResponse.headers.get('sw-cached-at');
      const isExpired = cachedAt && (Date.now() - parseInt(cachedAt)) > 3600000;
      
      if (!isExpired) {
        return cachedResponse;
      }
    }
    
    // Return error response
    return new Response(JSON.stringify({ 
      error: 'Service unavailable offline',
      offline: true 
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle generic requests
async function handleGenericRequest(request) {
  try {
    // Network first strategy
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network request failed');
  } catch (error) {
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Content unavailable offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Utility functions
function isStaticAsset(url) {
  return url.pathname.endsWith('.css') ||
         url.pathname.endsWith('.js');
}

function isImageRequest(url) {
  return /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(url.pathname);
}

function isAPIRequest(url) {
  return url.pathname.includes('/api/');
}

// Background sync for offline form submissions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered', event.tag);
  
  if (event.tag === 'form-sync') {
    event.waitUntil(syncForms());
  } else if (event.tag === 'analytics-sync') {
    event.waitUntil(syncAnalytics());
  }
});

// Sync form submissions when back online
async function syncForms() {
  try {
    const forms = await getStoredData('pending-forms');
    
    if (forms && forms.length > 0) {
      for (const formData of forms) {
        const response = await fetch(formData.action, {
          method: 'POST',
          body: formData.data
        });
        
        if (response.ok) {
          console.log('Form synced:', formData.id);
        }
      }
      
      await clearStoredData('pending-forms');
    }
  } catch (error) {
    console.error('Form sync failed:', error);
  }
}

// Sync analytics data when back online
async function syncAnalytics() {
  try {
    const analytics = await getStoredData('pending-analytics');
    
    if (analytics && analytics.length > 0) {
      // Send to Google Analytics or custom analytics endpoint
      for (const event of analytics) {
        if (typeof gtag !== 'undefined') {
          gtag('event', event.name, event.parameters);
        }
      }
      
      await clearStoredData('pending-analytics');
    }
  } catch (error) {
    console.error('Analytics sync failed:', error);
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  let notificationData = {};
  
  if (event.data) {
    notificationData = event.data.json();
  }
  
  const title = notificationData.title || 'AKM Music';
  const options = {
    body: notificationData.body || 'New update available',
    icon: 'assets/Logo & Icons/logo.png',
    badge: 'assets/Logo & Icons/logo.png',
    tag: notificationData.tag || 'general',
    data: notificationData.data || {},
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: 'assets/Logo & Icons/logo.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ],
    vibrate: [200, 100, 200],
    requireInteraction: true
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event);
  
  event.notification.close();
  
  if (event.action === 'view') {
    const urlToOpen = event.notification.data.url || '/';
    
    event.waitUntil(
      clients.matchAll({ type: 'window' })
        .then((clientList) => {
          // Check if window is already open
          for (const client of clientList) {
            if (client.url === urlToOpen && 'focus' in client) {
              return client.focus();
            }
          }
          
          // Open new window
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  }
});

// Message handling from main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data.type === 'GET_VERSION') {
    event.ports[0]?.postMessage({ version: CACHE_NAME });
  } else if (event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      cacheUrls(event.data.urls)
    );
  }
});

// Cache URLs on demand
async function cacheUrls(urls) {
  const cache = await caches.open(DYNAMIC_CACHE);
  
  try {
    await cache.addAll(urls);
    console.log('URLs cached successfully:', urls);
  } catch (error) {
    console.error('Failed to cache URLs:', error);
  }
}

// Utility functions for IndexedDB storage
async function getStoredData(storeName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('akm-offline-db', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const getRequest = store.getAll();
      
      getRequest.onsuccess = () => resolve(getRequest.result);
      getRequest.onerror = () => reject(getRequest.error);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

async function clearStoredData(storeName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('akm-offline-db', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const clearRequest = store.clear();
      
      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    };
  });
}

console.log('Service Worker: Loaded and ready');
