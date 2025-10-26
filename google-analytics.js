// Google Analytics 4 (GA4) - AKM Music
(function(){
  var GA_MEASUREMENT_ID = 'G-LMR1ZBN0PZ';
  if (!GA_MEASUREMENT_ID) return;
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_MEASUREMENT_ID;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  function gtag(){ dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;
  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID);
})();