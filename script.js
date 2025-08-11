document.addEventListener('DOMContentLoaded', ()=> {

  /* Hero slideshow (fade) */
  (function heroSlideshow(){
    const imgs = document.querySelectorAll('.hero-slides img');
    const heroQuote = document.getElementById('hero-quote');
    const quotes = [
      "Your One-Stop Music Shop",
      "Experience the Sound of Excellence",
      "Bringing Music to Life in Abu Dhabi"
    ];
    if(!imgs || imgs.length<=1 || !heroQuote) return;
    let idx = 0;
    imgs.forEach((im,i)=> im.style.opacity = i===0 ? '1' : '0');
    heroQuote.textContent = quotes[0];
    setInterval(()=> {
      imgs[idx].style.opacity = '0';
      idx = (idx+1) % imgs.length;
      imgs[idx].style.opacity = '1';

      // Fade out current quote
      heroQuote.style.opacity = 0;
      setTimeout(() => {
        heroQuote.textContent = quotes[idx];
        // Fade in new quote
        heroQuote.style.opacity = 1;
      }, 1000);
    }, 5000);
  })();

  /* Hero quote rotation */
  (function heroQuotes(){
    const quoteEl = document.getElementById('hero-quote');
    if(!quoteEl) return;
    const quotes = [
      'Your One-Stop Music Shop',
      'The heart of every performance',
      'Where music comes alive',
    ];
    let idx = 0;
    setInterval(() => {
      quoteEl.style.opacity = 0;
      setTimeout(() => {
        quoteEl.textContent = quotes[idx];
        quoteEl.style.opacity = 1;
        idx = (idx + 1) % quotes.length;
      }, 500);
    }, 4000);
  })();

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

  /* Gallery pagination & lightbox */
  window.renderGallery = function(images, perPage = 15){
    const grid = document.getElementById('galleryGrid');
    const pag = document.getElementById('pagination');
    if(!grid || !pag) return;
    let page = 1;
    const totalPages = Math.ceil(images.length / perPage);

    function showPage(p){
      page = Math.max(1, Math.min(totalPages, p));
      grid.innerHTML = '';
      const start = (page - 1) * perPage;
      const slice = images.slice(start, start + perPage);
      slice.forEach(name => {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        const img = document.createElement('img');
        img.src = 'images/' + name;
        img.alt = name.replace(/[-_]/g, ' ').replace('.jpg', '');
        img.loading = 'lazy';
        img.onerror = function() { item.style.display = 'none'; }; // Hide only if broken
        img.addEventListener('click', () => openLightbox(img.src));
        item.appendChild(img);
        grid.appendChild(item);
      });
      renderPagination();
    }

    function renderPagination(){
      pag.innerHTML = '';
      for(let i = 1; i <= totalPages; i++){
        const btn = document.createElement('button');
        btn.textContent = i;
        if(i === page) btn.disabled = true;
        btn.addEventListener('click', () => showPage(i));
        pag.appendChild(btn);
      }
    }

    showPage(1);
  };

  function openLightbox(src) {
    // Get all gallery images in current page
    const imgs = Array.from(document.querySelectorAll('.gallery-item img')).map(img => img.src);
    let idx = imgs.indexOf(src);

    const lb = document.createElement('div');
    lb.className = 'gallery-lightbox';
    lb.style.display = 'flex';

    const img = document.createElement('img');
    img.src = src;
    img.alt = 'Enlarged image';
    lb.appendChild(img);

    // Left arrow
    const left = document.createElement('button');
    left.className = 'gallery-lightbox-arrow left-arrow';
    left.innerHTML = '&#8592;';
    left.style.opacity = '0.2';
    left.style.fontSize = '2.5rem';
    left.style.position = 'absolute';
    left.style.left = '2vw';
    left.style.top = '50%';
    left.style.transform = 'translateY(-50%)';
    left.style.background = 'none';
    left.style.border = 'none';
    left.style.color = '#fff';
    left.style.cursor = 'pointer';
    left.style.userSelect = 'none';
    left.addEventListener('click', (e) => {
      e.stopPropagation();
      idx = (idx - 1 + imgs.length) % imgs.length;
      img.src = imgs[idx];
    });
    lb.appendChild(left);

    // Right arrow
    const right = document.createElement('button');
    right.className = 'gallery-lightbox-arrow right-arrow';
    right.innerHTML = '&#8594;';
    right.style.opacity = '0.2';
    right.style.fontSize = '2.5rem';
    right.style.position = 'absolute';
    right.style.right = '2vw';
    right.style.top = '50%';
    right.style.transform = 'translateY(-50%)';
    right.style.background = 'none';
    right.style.border = 'none';
    right.style.color = '#fff';
    right.style.cursor = 'pointer';
    right.style.userSelect = 'none';
    right.addEventListener('click', (e) => {
      e.stopPropagation();
      idx = (idx + 1) % imgs.length;
      img.src = imgs[idx];
    });
    lb.appendChild(right);

    // Close button
    const close = document.createElement('button');
    close.className = 'gallery-lightbox-close';
    close.textContent = '×';
    close.style.position = 'absolute';
    close.style.top = '16px';
    close.style.right = '24px';
    close.style.fontSize = '2rem';
    close.style.background = 'none';
    close.style.border = 'none';
    close.style.color = '#fff';
    close.style.cursor = 'pointer';
    close.addEventListener('click', () => document.body.removeChild(lb));
    lb.appendChild(close);

    lb.addEventListener('click', (e) => {
      if (e.target === lb) document.body.removeChild(lb);
    });

    // Touch swipe for mobile
    let startX = null;
    img.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
    });
    img.addEventListener('touchend', (e) => {
      if (startX === null) return;
      let endX = e.changedTouches[0].clientX;
      if (endX - startX > 40) {
        // swipe right (previous)
        idx = (idx - 1 + imgs.length) % imgs.length;
        img.src = imgs[idx];
      } else if (startX - endX > 40) {
        // swipe left (next)
        idx = (idx + 1) % imgs.length;
        img.src = imgs[idx];
      }
      startX = null;
    });

    lb.style.position = 'fixed';
    lb.style.left = '0';
    lb.style.top = '0';
    lb.style.width = '100vw';
    lb.style.height = '100vh';
    lb.style.background = 'rgba(0,0,0,0.95)';
    lb.style.justifyContent = 'center';
    lb.style.alignItems = 'center';
    lb.style.zIndex = '9999';

    img.style.maxWidth = '90vw';
    img.style.maxHeight = '80vh';
    img.style.borderRadius = '8px';
    img.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4)';

    document.body.appendChild(lb);
  }

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

});