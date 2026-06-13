// AKM Music — marketing & analytics tags
// Loaded in the <head> of every public page. Initializes the Meta Pixel and
// exposes window.akmPixel() so the rest of the site can fire standard events
// (ViewContent, AddToCart, Contact) safely.

(function () {
  // --- Meta Pixel base code (Pixel ID 1763887774974333) ---
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
  n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
  document,'script','https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', '1763887774974333');
  fbq('track', 'PageView');
})();

// Safe helper used across the site. No-op if the pixel is blocked.
window.akmPixel = function (event, data) {
  try { if (window.fbq) window.fbq('track', event, data || {}); } catch (e) {}
};

// Fire a Contact event whenever any WhatsApp link/button is clicked anywhere
// on the site (footer, floating button, services booking, etc.).
document.addEventListener('click', function (e) {
  var a = e.target.closest('a[href*="wa.me"], a[href*="api.whatsapp.com"], a[href*="whatsapp.com/send"], [data-wa]');
  if (a) window.akmPixel('Contact');
}, true);
