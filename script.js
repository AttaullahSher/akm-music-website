document.addEventListener('DOMContentLoaded', ()=> {

  // Initialize global cart instance early so toggleCart() works from header
  window.cart = window.cart || new ShoppingCart();

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
  if (navToggle) {
    navToggle.addEventListener('click', function() {
      document.querySelector('.nav')?.classList.toggle('nav-open');
    });
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

  // Expose toggleCart globally for header icon
  window.toggleCart = function() {
    try { window.cart?.toggleCart(); } catch {}
  }

});