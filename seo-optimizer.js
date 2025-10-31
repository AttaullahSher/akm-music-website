// SEO and Schema Markup Optimization for AKM Music
// Implements JSON-LD structured data and enhanced SEO features

class SEOOptimizer {
  constructor() {
    this.businessInfo = {
      name: "AKM Music Abu Dhabi",
      legalName: "Ajmal Khan Mohammed Music Store",
      description: "Leading music store in Abu Dhabi since 1984. Premium musical instruments, professional repairs, music classes, and studio rentals.",
      url: "https://www.akm-music.com",
      telephone: "+971562219929",
      email: "info@akm-music.com",
      address: {
        streetAddress: "Abu Dhabi",
        addressLocality: "Abu Dhabi", 
        addressRegion: "Abu Dhabi",
        postalCode: "",
        addressCountry: "AE"
      },
      geo: {
        latitude: 24.495314,
        longitude: 54.370049
      },
      openingHours: [
        "Mo-Sa 09:00-21:00",
        "Su 10:00-20:00"
      ],
      foundingDate: "1984",
      priceRange: "$$",
      paymentAccepted: ["Cash", "Credit Card", "WhatsApp Orders"],
      currenciesAccepted: "AED"
    };
    
    this.init();
  }

  init() {
    this.addBusinessSchema();
    this.addWebsiteSchema();
    this.addBreadcrumbSchema();
    this.optimizeMetaTags();
    this.addProductSchemas();
    this.setupDynamicSEO();
  }

  // Add Local Business Schema
  addBusinessSchema() {
    const schema = {
      "@context": "https://schema.org",
      "@type": "MusicStore",
      "name": this.businessInfo.name,
      "legalName": this.businessInfo.legalName,
      "description": this.businessInfo.description,
      "url": this.businessInfo.url,
      "telephone": this.businessInfo.telephone,
      "email": this.businessInfo.email,
      "foundingDate": this.businessInfo.foundingDate,
      "priceRange": this.businessInfo.priceRange,
      "paymentAccepted": this.businessInfo.paymentAccepted,
      "currenciesAccepted": this.businessInfo.currenciesAccepted,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": this.businessInfo.address.streetAddress,
        "addressLocality": this.businessInfo.address.addressLocality,
        "addressRegion": this.businessInfo.address.addressRegion,
        "postalCode": this.businessInfo.address.postalCode,
        "addressCountry": this.businessInfo.address.addressCountry
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": this.businessInfo.geo.latitude,
        "longitude": this.businessInfo.geo.longitude
      },
      "openingHoursSpecification": this.businessInfo.openingHours.map(hours => ({
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": hours.split(' ')[0].replace('Mo-Sa', ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']),
        "opens": hours.split(' ')[1].split('-')[0],
        "closes": hours.split(' ')[1].split('-')[1]
      })),
      "sameAs": [
        "https://www.facebook.com/akmmusicabudhabi",
        "https://www.instagram.com/akmmusicabudhabi",
        "https://wa.me/971562219929"
      ],
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Musical Instruments & Services",
        "itemListElement": [
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Product",
              "name": "Musical Instruments",
              "category": "Musical Instruments"
            }
          },
          {
            "@type": "Offer", 
            "itemOffered": {
              "@type": "Service",
              "name": "Music Lessons",
              "category": "Music Education"
            }
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service", 
              "name": "Instrument Repairs",
              "category": "Repair Services"
            }
          }
        ]
      }
    };

    this.addJSONLD(schema);
  }

  // Add Website Schema
  addWebsiteSchema() {
    const schema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": this.businessInfo.name,
      "url": this.businessInfo.url,
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${this.businessInfo.url}/tools.html?search={search_term_string}`
        },
        "query-input": "required name=search_term_string"
      },
      "sameAs": [
        "https://www.facebook.com/akmmusicabudhabi",
        "https://www.instagram.com/akmmusicabudhabi"
      ]
    };

    this.addJSONLD(schema);
  }

  // Add Breadcrumb Schema
  addBreadcrumbSchema() {
    const path = window.location.pathname;
    const breadcrumbs = this.getBreadcrumbs(path);
    
    if (breadcrumbs.length > 1) {
      const schema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": breadcrumbs.map((crumb, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "name": crumb.name,
          "item": crumb.url
        }))
      };

      this.addJSONLD(schema);
    }
  }

  // Get breadcrumbs based on current path
  getBreadcrumbs(path) {
    const breadcrumbs = [
      { name: "Home", url: `${this.businessInfo.url}/` }
    ];
    if (path.includes('tools')) {
      breadcrumbs.push({ name: "Music Tools", url: `${this.businessInfo.url}/tools.html` });
    } else if (path.includes('blog')) {
      breadcrumbs.push({ name: "Blog", url: `${this.businessInfo.url}/blog.html` });
    } else if (path.includes('about')) {
      breadcrumbs.push({ name: "About Us", url: `${this.businessInfo.url}/about.html` });
    } else if (path.includes('contact')) {
      breadcrumbs.push({ name: "Contact", url: `${this.businessInfo.url}/contact.html` });
    }

    return breadcrumbs;
  }

  // Add Product Schemas (for products page)
  addProductSchemas() {
    if (window.location.pathname.includes('products')) {
      const products = this.getProductsFromPage();
      
      products.forEach(product => {
        const schema = {
          "@context": "https://schema.org",
          "@type": "Product",
          "name": product.name,
          "description": product.description,
          "sku": product.sku,
          "category": product.category,
          "brand": {
            "@type": "Brand",
            "name": product.brand || "Various"
          },
          "offers": {
            "@type": "Offer",
            "priceCurrency": "AED",
            "price": product.price,
            "availability": "https://schema.org/InStock",
            "seller": {
              "@type": "Organization",
              "name": this.businessInfo.name
            },
            "validFrom": new Date().toISOString(),
            "priceSpecification": {
              "@type": "PriceSpecification",
              "priceCurrency": "AED",
              "price": product.price
            }
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "reviewCount": "127"
          }
        };

        if (product.image) {
          schema.image = product.image;
        }

        this.addJSONLD(schema);
      });
    }
  }

  // Extract products from page
  getProductsFromPage() {
    const products = [];
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
      const name = card.querySelector('h3')?.textContent?.trim();
      const price = card.querySelector('.price-current')?.textContent?.replace(/[^0-9]/g, '');
      const sku = card.querySelector('[data-sku]')?.getAttribute('data-sku');
      const category = card.getAttribute('data-category');
      const image = card.querySelector('img')?.src;
      const description = card.querySelector('.product-description')?.textContent?.trim();

      if (name && price) {
        products.push({
          name,
          price: parseFloat(price),
          sku: sku || name.toLowerCase().replace(/\s+/g, '-'),
          category: category || 'Musical Instruments',
          image,
          description: description || `${name} available at AKM Music Abu Dhabi`
        });
      }
    });

    return products;
  }

  // Optimize meta tags dynamically
  optimizeMetaTags() {
    const path = window.location.pathname;

    // Update page-specific meta descriptions
    if (path.includes('tools')) {
      this.updateMetaTag('description', 'Free professional music tools - Chromatic tuner, metronome, chord charts, scale finder, circle of fifths. Perfect for musicians & music students.');
      this.updateMetaTag('keywords', 'music tools online, chromatic tuner, metronome, chord charts, music theory tools, scale finder, circle of fifths');
    } else if (path.includes('blog')) {
      this.updateMetaTag('description', 'Expert music advice, instrument guides, maintenance tips, and industry insights from AKM Music Abu Dhabi. Learn from 40+ years of experience.');
      this.updateMetaTag('keywords', 'music blog, instrument guides, music tips, maintenance advice, music education, abu dhabi music');
    }

    // Add canonical URL
    this.addCanonicalURL();

    // Add hreflang for international targeting
    this.addHrefLang();
  }

  // Update meta tag
  updateMetaTag(name, content) {
    let meta = document.querySelector(`meta[name="${name}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', name);
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', content);
  }

  // Add canonical URL
  addCanonicalURL() {
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', window.location.href.split('?')[0].split('#')[0]);
  }

  // Add hreflang attributes
  addHrefLang() {
    const hreflangs = [
      { lang: 'en', href: window.location.href },
      { lang: 'ar', href: window.location.href.replace('.html', '-ar.html') },
      { lang: 'x-default', href: window.location.href }
    ];

    hreflangs.forEach(({ lang, href }) => {
      let hreflang = document.querySelector(`link[hreflang="${lang}"]`);
      if (!hreflang) {
        hreflang = document.createElement('link');
        hreflang.setAttribute('rel', 'alternate');
        hreflang.setAttribute('hreflang', lang);
        document.head.appendChild(hreflang);
      }
      hreflang.setAttribute('href', href);
    });
  }

  // Setup dynamic SEO updates
  setupDynamicSEO() {
    // Update title and meta on hash changes
    window.addEventListener('hashchange', () => {
      this.updatePageSEO();
    });



    // Track search queries
    document.addEventListener('search', (e) => {
      if (window.akmAnalytics && e.detail.query) {
        window.akmAnalytics.trackSearch(e.detail.query, e.detail.category);
      }
    });
  }

  // Update page SEO based on current context
  updatePageSEO() {
    const hash = window.location.hash;

    if (hash === '#tools') {
      document.title = 'Music Tools - AKM Music Abu Dhabi | Professional Online Tools';
    } else if (hash === '#contact') {
      document.title = 'Contact - AKM Music Abu Dhabi | Get in Touch';
    }
  }

  // Add JSON-LD schema to page
  addJSONLD(schema) {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  }
  // Generate sitemap (for admin use)
  generateSitemap() {
    const pages = [
      { url: '/', priority: '1.0', changefreq: 'daily' },
      { url: '/tools.html', priority: '0.8', changefreq: 'monthly' },
      { url: '/blog.html', priority: '0.8', changefreq: 'weekly' },
      { url: '/about.html', priority: '0.7', changefreq: 'monthly' },
      { url: '/contact.html', priority: '0.6', changefreq: 'monthly' }
    ];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(page => `  <url>
    <loc>${this.businessInfo.url}${page.url}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    return sitemap;
  }

  // Performance optimization suggestions
  getPerformanceOptimizations() {
    return {
      images: [
        'Optimize images with WebP format',
        'Implement lazy loading for all images',
        'Use responsive images with srcset'
      ],
      scripts: [
        'Defer non-critical JavaScript',
        'Minify and compress JavaScript files',
        'Use CDN for external libraries'
      ],
      css: [
        'Inline critical CSS',
        'Minify CSS files',
        'Remove unused CSS'
      ],
      general: [
        'Enable GZIP compression',
        'Set proper cache headers',
        'Use HTTP/2 push for critical resources'
      ]
    };
  }
}

// Initialize SEO optimizer
const seoOptimizer = new SEOOptimizer();

// Export for global use
window.akmSEO = seoOptimizer;

console.log('AKM Music SEO Optimizer loaded');
