// Simple analytics and performance monitoring for AKM Music website
(function() {
    'use strict';
    
    // Simple page view tracking
    function trackPageView() {
        const page = window.location.pathname;
        const referrer = document.referrer;
        const timestamp = new Date().toISOString();
        
        // Log to console for now (you can send to analytics service later)
        console.log('Page view:', {
            page,
            referrer,
            timestamp,
            userAgent: navigator.userAgent
        });
    }
    
    // Track user interactions
    function trackEvent(eventName, details = {}) {
        console.log('Event:', eventName, details);
        try {
            if (typeof window.gtag === 'function') {
                window.gtag('event', eventName, details || {});
            }
        } catch (e) { /* no-op */ }
    }
    
    // Performance monitoring
    function monitorPerformance() {
        if ('performance' in window) {
            window.addEventListener('load', function() {
                setTimeout(function() {
                    const perfData = performance.getEntriesByType('navigation')[0];
                    if (perfData) {
                        console.log('Performance metrics:', {
                            loadTime: perfData.loadEventEnd - perfData.fetchStart,
                            domContentLoaded: perfData.domContentLoadedEventEnd - perfData.fetchStart,
                            firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 'N/A'
                        });
                    }
                }, 0);
            });
        }
    }
    
    // Track form submissions
    function trackFormSubmissions() {
        document.addEventListener('submit', function(e) {
            const form = e.target;
            const formName = form.getAttribute('class') || 'unknown-form';
            trackEvent('form_submit', { formName });
        });
    }
    
    // Track button clicks
    function trackButtonClicks() {
        document.addEventListener('click', function(e) {
            if (e.target.matches('button, .btn, .product-inquiry')) {
                const buttonText = e.target.textContent.trim();
                const buttonClass = e.target.className;
                trackEvent('button_click', { buttonText, buttonClass });
            }
        });
    }
    
    // Track contact method usage
    function trackContactMethods() {
        document.addEventListener('click', function(e) {
            if (e.target.closest('a[href^="tel:"]')) {
                trackEvent('contact_phone_click');
            } else if (e.target.closest('a[href^="mailto:"]')) {
                trackEvent('contact_email_click');
            } else if (e.target.closest('a[href*="whatsapp"]') || e.target.closest('a[href*="wa.me"]')) {
                trackEvent('contact_whatsapp_click');
            } else if (e.target.closest('a[href*="facebook"]')) {
                trackEvent('social_facebook_click');
            } else if (e.target.closest('a[href*="instagram"]')) {
                trackEvent('social_instagram_click');
            }
        });
    }
    
    // Initialize all tracking
    function initAnalytics() {
        trackPageView();
        monitorPerformance();
        trackFormSubmissions();
        trackButtonClicks();
        trackContactMethods();
    }
    
    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAnalytics);
    } else {
        initAnalytics();
    }
    
})();
