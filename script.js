document.addEventListener('DOMContentLoaded', ()=> {



  /* Modal open/close */
  document.querySelectorAll('[data-open-modal]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = btn.getAttribute('data-open-modal');
      const modal = document.getElementById(id);
      if(modal) modal.setAttribute('aria-hidden', 'false');
    });
  });
  document.querySelectorAll('.modal .close, .modal .back-btn').forEach(b => b.addEventListener('click', () => {
    b.closest('.modal').setAttribute('aria-hidden', 'true');
  }));
  // click outside to close
  document.querySelectorAll('.modal').forEach(m => {
    m.addEventListener('click', (ev) => {
      if(ev.target === m) m.setAttribute('aria-hidden', 'true');
    });
  });



  /* Form submit feedback */
  document.querySelectorAll('form').forEach(f => {
    f.addEventListener('submit', (e) => {
      // Let FormSubmit handle, but show message and redirect
      setTimeout(() => {
        alert('Thank you — your message was sent. We will contact you shortly.');
        window.location.href = 'index.html';
      }, 400);
    });
  });

  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.nav');
  const header = document.querySelector('.site-header');
  if (navToggle && nav) {
    const closeMenu = () => {
      nav.classList.remove('active');
      document.body.classList.remove('menu-open');
      navToggle.setAttribute('aria-expanded', 'false');
    };

    navToggle.addEventListener('click', function() {
      const willOpen = !nav.classList.contains('active');
      nav.classList.toggle('active');
      document.body.classList.toggle('menu-open', willOpen);
      navToggle.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
      if (!nav.contains(e.target) && !navToggle.contains(e.target)) {
        closeMenu();
      }
    });
    
    // Close menu when clicking a link
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', function() {
        closeMenu();
      });
    });
  }

  // Header shadow on scroll
  if (header) {
    const onScroll = () => {
      if (window.scrollY > 4) header.classList.add('scrolled');
      else header.classList.remove('scrolled');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // Provide quick contact helpers
  window.contactWhatsApp = function(text='Hello! I need assistance.') {
    const number = '97126219929';
    const url = `https://api.whatsapp.com/send?phone=${number}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }
  window.contactMessenger = function() {
    window.open('https://m.me/akmmusiccenter', '_blank');
  }

  // Update customer badge from saved profile
  window.updateCustomerBadge = function(profile){
    const badge = document.getElementById('customerBadge');
    if (!badge) return;
    const name = profile?.name || '';
    const area = profile?.area || '';
    if (name || area) {
      badge.textContent = [name, area].filter(Boolean).join(' • ');
      badge.classList.add('show');
    } else {
      badge.textContent = '';
      badge.classList.remove('show');
    }
  }
  // Initialize badge at load
  try {
    const existing = JSON.parse(localStorage.getItem('akm_customer')) || {};
    window.updateCustomerBadge(existing);
  } catch {}

  // Remove unwanted home cards by title/link text (robust across cached variants)
  try {
    const grid = document.querySelector('.services-grid');
    if (grid) {
      grid.querySelectorAll('.service-card').forEach(card => {
        const title = (card.querySelector('.service-title, h3')?.textContent || '').trim().toLowerCase();
        const linkText = (card.querySelector('.service-link')?.textContent || '').trim().toLowerCase();
        const imgAlt = (card.querySelector('img')?.getAttribute('alt') || '').trim().toLowerCase();
        const imgSrc = (card.querySelector('img')?.getAttribute('src') || '').toLowerCase();
        const href = (card.querySelector('a')?.getAttribute('href') || '').toLowerCase();
        const shouldRemove =
          title.includes('instrument sales') ||
          title.includes('music tools') ||
          linkText.includes('shop now') ||
          linkText.includes('try tools') ||
          imgAlt.includes('instrument sales') ||
          imgSrc.includes('service cards/tools.jpg') ||
          href.endsWith('tools.html');
        if (shouldRemove) {
          card.remove();
        }
      });
    }
  } catch {}



});