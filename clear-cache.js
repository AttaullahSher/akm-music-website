// Emergency Cache Clear Script
// Run this in browser console to completely clear all caches

console.log('🧹 Starting emergency cache clear...');

// 1. Unregister all service workers
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister();
      console.log('✅ Service Worker unregistered:', registration.scope);
    }
  });
}

// 2. Clear all caches
if ('caches' in window) {
  caches.keys().then(function(names) {
    for (let name of names) {
      caches.delete(name);
      console.log('✅ Cache deleted:', name);
    }
  });
}

// 3. Clear local storage
localStorage.clear();
console.log('✅ localStorage cleared');

// 4. Clear session storage
sessionStorage.clear();
console.log('✅ sessionStorage cleared');

console.log('🎉 Cache clear complete! Now hard refresh: Ctrl+Shift+R');
