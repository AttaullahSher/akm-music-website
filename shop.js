// AKM Music — Store
// Renders the product catalog (products.json) with department/category/brand
// filters, search, a localStorage cart, and WhatsApp checkout.

(function () {
  'use strict';

  const WHATSAPP_PHONE = '97126219929';
  const PAGE_SIZE = 24;
  const CART_KEY = 'akm_cart_v1';
  const PLACEHOLDER_IMG =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="100%" height="100%" fill="#f3f4f6"/><text x="50%" y="50%" font-family="sans-serif" font-size="60" fill="#9ca3af" text-anchor="middle" dominant-baseline="central">🎵</text></svg>'
    );

  // Curated two-level catalog tree: raw supplier category → [department, subcategory].
  // Unmapped categories fall back to keyword rules below.
  const CATEGORY_MAP = {
    // Guitars & Basses
    'Acoustic Guitar': ['Guitars & Basses', 'Acoustic Guitars'],
    'Acoustic Guitars': ['Guitars & Basses', 'Acoustic Guitars'],
    '12 String Acoustic Guitar': ['Guitars & Basses', 'Acoustic Guitars'],
    'Acoustic Guitar Packs': ['Guitars & Basses', 'Acoustic Guitars'],
    'Acoustic Electric': ['Guitars & Basses', 'Acoustic Guitars'],
    'Classical Guitar': ['Guitars & Basses', 'Classical & Flamenco'],
    '3/4 Size Classical Guitar': ['Guitars & Basses', 'Classical & Flamenco'],
    'Electric Classical': ['Guitars & Basses', 'Classical & Flamenco'],
    'Flamenco Guitar': ['Guitars & Basses', 'Classical & Flamenco'],
    'Electric Guitar': ['Guitars & Basses', 'Electric Guitars'],
    'Electric Guitars': ['Guitars & Basses', 'Electric Guitars'],
    '7 String Guitar': ['Guitars & Basses', 'Electric Guitars'],
    'Headless Guitar': ['Guitars & Basses', 'Electric Guitars'],
    'Hollow and Semi-Hollow Body Guitars': ['Guitars & Basses', 'Electric Guitars'],
    'Bass Guitar': ['Guitars & Basses', 'Bass Guitars'],
    'Electric Bass Guitar': ['Guitars & Basses', 'Bass Guitars'],
    '5 Strings Bass Guitars': ['Guitars & Basses', 'Bass Guitars'],
    '6 Strings Bass Guitars': ['Guitars & Basses', 'Bass Guitars'],
    'Ukulele': ['Guitars & Basses', 'Ukulele, Violin & Folk'],
    'Violin': ['Guitars & Basses', 'Ukulele, Violin & Folk'],
    'Stringed Instrument': ['Guitars & Basses', 'Ukulele, Violin & Folk'],
    'Acoustic Guitar Pickups': ['Guitars & Basses', 'Guitar Pickups'],
    'Electric Guitar Pickups': ['Guitars & Basses', 'Guitar Pickups'],
    // Pianos & Keyboards
    'Grand Piano': ['Pianos & Keyboards', 'Acoustic Pianos'],
    'Upright Piano': ['Pianos & Keyboards', 'Acoustic Pianos'],
    'Pianos': ['Pianos & Keyboards', 'Acoustic Pianos'],
    'Digital Pianos': ['Pianos & Keyboards', 'Digital Pianos'],
    'Stage Piano': ['Pianos & Keyboards', 'Digital Pianos'],
    '88 Key': ['Pianos & Keyboards', 'Digital Pianos'],
    '76 Key': ['Pianos & Keyboards', 'Digital Pianos'],
    'Arranger': ['Pianos & Keyboards', 'Keyboards & Synths'],
    'Performance Keyboards': ['Pianos & Keyboards', 'Keyboards & Synths'],
    'Synth': ['Pianos & Keyboards', 'Keyboards & Synths'],
    'Workstation': ['Pianos & Keyboards', 'Keyboards & Synths'],
    '61 Key': ['Pianos & Keyboards', 'Keyboards & Synths'],
    'Midi Keyboard': ['Pianos & Keyboards', 'Keyboards & Synths'],
    'Drum Machine': ['Pianos & Keyboards', 'Keyboards & Synths'],
    'Keyboard Stands': ['Pianos & Keyboards', 'Keyboard Stands & Benches'],
    // Drums & Percussion
    'Acoustic Drum': ['Drums & Percussion', 'Drum Kits'],
    'Drum Kits': ['Drums & Percussion', 'Drum Kits'],
    'Shell Packs': ['Drums & Percussion', 'Drum Kits'],
    'Complete Sets': ['Drums & Percussion', 'Drum Kits'],
    'Sets': ['Drums & Percussion', 'Drum Kits'],
    'Cymbals': ['Drums & Percussion', 'Cymbals'],
    'Crash': ['Drums & Percussion', 'Cymbals'],
    'Ride': ['Drums & Percussion', 'Cymbals'],
    'China': ['Drums & Percussion', 'Cymbals'],
    'Hi-Hat': ['Drums & Percussion', 'Cymbals'],
    'Snares': ['Drums & Percussion', 'Snares & Toms'],
    'Floor Toms': ['Drums & Percussion', 'Snares & Toms'],
    'Rack Toms': ['Drums & Percussion', 'Snares & Toms'],
    'Bass Drums': ['Drums & Percussion', 'Snares & Toms'],
    'Batter': ['Drums & Percussion', 'Drum Heads'],
    'Resonant': ['Drums & Percussion', 'Drum Heads'],
    'Hardware': ['Drums & Percussion', 'Pedals & Hardware'],
    'Double Kick': ['Drums & Percussion', 'Pedals & Hardware'],
    'Single Kick': ['Drums & Percussion', 'Pedals & Hardware'],
    'Thrones': ['Drums & Percussion', 'Pedals & Hardware'],
    'Practice Pad': ['Drums & Percussion', 'Pedals & Hardware'],
    'Sticks': ['Drums & Percussion', 'Sticks & Brushes'],
    'Brushes': ['Drums & Percussion', 'Sticks & Brushes'],
    'Hand Percussion': ['Drums & Percussion', 'Hand Percussion'],
    'Mutes': ['Drums & Percussion', 'Pedals & Hardware'],
    'Hardware Bags': ['Drums & Percussion', 'Drum Bags & Cases'],
    // Amplifiers & Effects
    'Electric Guitar Amplifier': ['Amps & Effects', 'Guitar Amplifiers'],
    'Guitar Combo Amps': ['Amps & Effects', 'Guitar Amplifiers'],
    'Guitar Head and Cabinet Amp': ['Amps & Effects', 'Guitar Amplifiers'],
    'Acoustic Guitar Amplifier': ['Amps & Effects', 'Guitar Amplifiers'],
    'Battery Amplifier': ['Amps & Effects', 'Guitar Amplifiers'],
    'Bass Combo Amp': ['Amps & Effects', 'Bass Amplifiers'],
    'Bass Head and Cabinet Amplifier': ['Amps & Effects', 'Bass Amplifiers'],
    'Drum Amplifier': ['Amps & Effects', 'Drum & Keyboard Amps'],
    'Guitar Pedals': ['Amps & Effects', 'Pedals & Effects'],
    'Effects': ['Amps & Effects', 'Pedals & Effects'],
    'Pedals': ['Amps & Effects', 'Pedals & Effects'],
    // Studio, PA & Audio
    'PA Active Speakers': ['Studio, PA & Audio', 'PA Speakers'],
    'PA Subwoofers': ['Studio, PA & Audio', 'PA Speakers'],
    'Line Arrays Active': ['Studio, PA & Audio', 'PA Speakers'],
    'Line Arrays Passive': ['Studio, PA & Audio', 'PA Speakers'],
    'Ceiling Speakers': ['Studio, PA & Audio', 'PA Speakers'],
    'Portable Bluetooth Speaker': ['Studio, PA & Audio', 'PA Speakers'],
    'Analog Mixers': ['Studio, PA & Audio', 'Mixers'],
    'PA Mixers': ['Studio, PA & Audio', 'Mixers'],
    'Audio Interfaces': ['Studio, PA & Audio', 'Recording Gear'],
    'Portable Recorders': ['Studio, PA & Audio', 'Recording Gear'],
    'Headphones': ['Studio, PA & Audio', 'Headphones'],
    'Closed Back': ['Studio, PA & Audio', 'Headphones'],
    'Microphone and Other Stands': ['Studio, PA & Audio', 'Stands, Cables & Wireless'],
    'Equipment Stands': ['Studio, PA & Audio', 'Stands, Cables & Wireless'],
    'Cables': ['Studio, PA & Audio', 'Stands, Cables & Wireless'],
    'Accessories / Cables': ['Studio, PA & Audio', 'Stands, Cables & Wireless'],
    'Guitar Wireless System': ['Studio, PA & Audio', 'Stands, Cables & Wireless'],
    // Wind Instruments
    'Harmonica': ['Wind Instruments', 'Harmonicas'],
    'Harmonica Accessories': ['Wind Instruments', 'Harmonicas'],
    'Melodicas': ['Wind Instruments', 'Melodicas & Recorders'],
    'Recorders': ['Wind Instruments', 'Melodicas & Recorders'],
    'Tenor': ['Wind Instruments', 'Melodicas & Recorders'],
    'Reeds': ['Wind Instruments', 'Reeds & Accessories'],
    'Wind Instruments': ['Wind Instruments', 'Reeds & Accessories'],
    // Strings & Accessories
    'Acoustic Guitar Strings': ['Strings & Accessories', 'Guitar Strings'],
    'Electric Guitar Strings': ['Strings & Accessories', 'Guitar Strings'],
    'Classical Guitar Strings': ['Strings & Accessories', 'Guitar Strings'],
    'Bass Guitar Strings': ['Strings & Accessories', 'Guitar Strings'],
    'Guitar Strings': ['Strings & Accessories', 'Guitar Strings'],
    'Single String': ['Strings & Accessories', 'Guitar Strings'],
    'Strings': ['Strings & Accessories', 'Guitar Strings'],
    'Violin Strings': ['Strings & Accessories', 'Violin & Oud Strings'],
    'Oud Strings': ['Strings & Accessories', 'Violin & Oud Strings'],
    'Other Instruments Strings': ['Strings & Accessories', 'Violin & Oud Strings'],
    'Guitar Picks': ['Strings & Accessories', 'Picks & Capos'],
    'Capos': ['Strings & Accessories', 'Picks & Capos'],
    'Guitar Straps and Locks': ['Strings & Accessories', 'Straps & Stands'],
    'Guitar Stand': ['Strings & Accessories', 'Straps & Stands'],
    'Bags': ['Strings & Accessories', 'Cases & Bags'],
    'Gig and Soft Bags': ['Strings & Accessories', 'Cases & Bags'],
    'Hard Cases': ['Strings & Accessories', 'Cases & Bags'],
    'Tuners': ['Strings & Accessories', 'Tuners & Metronomes'],
    'Metronome': ['Strings & Accessories', 'Tuners & Metronomes'],
    'Guitar Machine Head ( Tuners )': ['Strings & Accessories', 'Tuners & Metronomes'],
    'Guitar Tools': ['Strings & Accessories', 'Care, Parts & Tools'],
    'Polishes and Cleaning Kits': ['Strings & Accessories', 'Care, Parts & Tools'],
    'Humidifiers': ['Strings & Accessories', 'Care, Parts & Tools'],
    'Parts': ['Strings & Accessories', 'Care, Parts & Tools'],
    'Other Guitar Accessories And Parts': ['Strings & Accessories', 'Care, Parts & Tools'],
    'Clothing and Merch': ['Strings & Accessories', 'Merch & Gifts'],
    'Accessories': ['Strings & Accessories', 'General Accessories'],
    'Packs': ['Strings & Accessories', 'General Accessories'],
    'Other': ['Strings & Accessories', 'General Accessories'],
    'Others': ['Strings & Accessories', 'General Accessories']
  };

  // Ordered keyword rules — first match wins.
  const DEPARTMENTS = [
    { name: 'Guitars & Basses', match: /flamenco|classical guitar$|acoustic electric|electric guitar$|bass guitar$|^acoustic$|ukulele|banjo|mandolin/i },
    { name: 'Pianos & Keyboards', match: /piano|keyboard|synth|workstation|midi|organ|arranger/i },
    { name: 'Drums & Percussion', match: /drum|cymbal|snare|tom|batter|stick|percussion|cajon|hardware|skin|darbuka/i },
    { name: 'Amps & Effects', match: /amp|pedal|effect|cabinet/i },
    { name: 'Studio, PA & Audio', match: /\bpa\b|speaker|mixer|microphone|interface|headphone|recorder|monitor|wireless|cable/i },
    { name: 'Wind Instruments', match: /harmonica|melodica|recorder|flute|saxophone|clarinet|trumpet|wind/i },
    { name: 'Strings & Accessories', match: /string|pick|strap|capo|tuner|case|bag|stand|tool|accessor|merch|part|lock|care|book/i }
  ];

  // Own products use curated subcategory names directly — map those back to departments.
  const SUB_TO_DEPT = {};
  for (const [dept, sub] of Object.values(CATEGORY_MAP)) SUB_TO_DEPT[sub] = dept;

  function departmentFor(category) {
    if (CATEGORY_MAP[category]) return CATEGORY_MAP[category];
    if (SUB_TO_DEPT[category]) return [SUB_TO_DEPT[category], category];
    for (const d of DEPARTMENTS) if (d.match.test(category)) return [d.name, category];
    return ['Strings & Accessories', category || 'General Accessories'];
  }
  window.AKM_SUBCATEGORIES = Object.keys(SUB_TO_DEPT).sort();

  const state = {
    products: [],
    featuredIds: [],
    dept: 'All',
    category: 'All', // subcategory filter
    brand: 'All',
    query: '',
    sort: 'featured',
    inStockOnly: false,
    shown: PAGE_SIZE
  };

  let cart = loadCart();

  // ---------- data ----------
  async function loadProducts() {
    const [res, overrides, own] = await Promise.all([
      fetch('products.json?v=' + new Date().toISOString().slice(0, 10), { cache: 'no-cache' }),
      window.AKM ? window.AKM.getCatalogOverrides() : Promise.resolve(null),
      window.AKM ? window.AKM.getOwnProducts() : Promise.resolve([])
    ]);
    const data = await res.json();
    // Master switch (admin → Supplier Listings): hide the whole supplier catalog
    let products = (overrides && overrides.supplierEnabled === false)
      ? []
      : data.products.map(p => Object.assign({ source: 'supplier' }, p));
    // AKM's own products (managed in admin.html) join the catalog
    for (const p of (own || [])) {
      if (p && p.id && p.name && p.price != null) {
        products.push({
          id: p.id, name: p.name, brand: p.brand || 'AKM',
          category: p.category || 'General Accessories',
          price: Number(p.price), currency: 'AED',
          inStock: p.inStock !== false,
          image: p.image || '', imageLarge: p.imageLarge || p.image || '',
          source: 'akm'
        });
      }
    }
    // Admin can disable listings from admin.html (stored in Firestore)
    if (overrides) {
      const offCats = new Set(overrides.disabledCategories);
      const offBrands = new Set(overrides.disabledBrands);
      products = products.filter(p =>
        !overrides.disabledIds[p.id] && !offCats.has(p.category) && !offBrands.has(p.brand));
      state.featuredIds = overrides.featuredIds || [];
    }
    state.products = products.map(p => {
      const [dept, sub] = departmentFor(p.category);
      return Object.assign({ dept, sub }, p);
    });
  }

  // ---------- filtering ----------
  function filtered() {
    const q = state.query.trim().toLowerCase();
    const terms = q ? q.split(/\s+/) : [];
    let list = state.products.filter(p => {
      if (state.dept !== 'All' && p.dept !== state.dept) return false;
      if (state.category !== 'All' && p.sub !== state.category) return false;
      if (state.brand !== 'All' && p.brand !== state.brand) return false;
      if (state.inStockOnly && !p.inStock) return false;
      if (terms.length) {
        const hay = (p.name + ' ' + p.sub + ' ' + p.category + ' ' + p.brand).toLowerCase();
        if (!terms.every(t => hay.includes(t))) return false;
      }
      return true;
    });
    switch (state.sort) {
      case 'price-asc': list.sort((a, b) => a.price - b.price); break;
      case 'price-desc': list.sort((a, b) => b.price - a.price); break;
      case 'name': list.sort((a, b) => a.name.localeCompare(b.name)); break;
      default: {
        const feat = new Set(state.featuredIds);
        list.sort((a, b) =>
          (feat.has(b.id) - feat.has(a.id)) || (b.inStock - a.inStock) || a.name.localeCompare(b.name));
      }
    }
    return list;
  }

  function fmtPrice(n) {
    return n.toLocaleString('en-AE', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
  }

  // ---------- rendering ----------
  function render() {
    const list = filtered();
    const grid = document.getElementById('productGrid');
    const countEl = document.getElementById('shopCount');
    const loadBtn = document.getElementById('loadMore');
    const visible = list.slice(0, state.shown);

    countEl.textContent = list.length + ' product' + (list.length === 1 ? '' : 's');
    if (!visible.length) {
      grid.innerHTML = '';
      document.getElementById('shopEmpty').style.display = 'block';
      loadBtn.style.display = 'none';
      return;
    }
    document.getElementById('shopEmpty').style.display = 'none';

    grid.innerHTML = visible.map(p => `
      <div class="product-card" data-id="${p.id}">
        <div class="product-image">
          <span class="stock-badge ${p.inStock ? 'in' : 'out'}">${p.inStock ? 'In Stock' : 'On Order'}</span>
          <img src="${p.image}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.onerror=null;this.src='${PLACEHOLDER_IMG}'">
        </div>
        <div class="product-info">
          <span class="product-brand">${escapeHtml(p.brand)}</span>
          <span class="product-name">${escapeHtml(p.name)}</span>
          <div class="product-price"><span class="currency">AED</span>${fmtPrice(p.price)}</div>
          <div class="product-actions">
            <button class="btn-add-cart" data-add="${p.id}"><i class="fas fa-cart-plus"></i> Add</button>
            <button class="btn-wa-order" data-wa="${p.id}" title="Order on WhatsApp"><i class="fab fa-whatsapp"></i></button>
          </div>
        </div>
      </div>`).join('');

    loadBtn.style.display = list.length > state.shown ? 'block' : 'none';
  }

  function renderFilters() {
    // Sidebar: departments with expandable subcategory lists (desktop),
    // plus a department select for mobile.
    const deptCounts = {};
    const subCounts = {};
    state.products.forEach(p => {
      deptCounts[p.dept] = (deptCounts[p.dept] || 0) + 1;
      (subCounts[p.dept] = subCounts[p.dept] || {})[p.sub] = (subCounts[p.dept][p.sub] || 0) + 1;
    });
    const deptNames = DEPARTMENTS.map(d => d.name).filter(n => deptCounts[n]);

    const sidebar = document.getElementById('shopSidebar');
    if (sidebar) {
      sidebar.innerHTML =
        `<div class="sidebar-title">Categories</div>
         <button class="sidebar-all ${state.dept === 'All' ? 'active' : ''}" data-side-dept="All">All Products <span>${state.products.length}</span></button>` +
        deptNames.map(d => `
          <details class="sidebar-group" ${state.dept === d ? 'open' : ''}>
            <summary>
              <button class="sidebar-dept ${state.dept === d && state.category === 'All' ? 'active' : ''}" data-side-dept="${escapeHtml(d)}">${escapeHtml(d)}</button>
              <span class="count">${deptCounts[d]}</span>
            </summary>
            <ul>${Object.keys(subCounts[d]).sort().map(s => `
              <li><button class="sidebar-sub ${state.dept === d && state.category === s ? 'active' : ''}"
                data-side-dept="${escapeHtml(d)}" data-side-sub="${escapeHtml(s)}">${escapeHtml(s)} <span>${subCounts[d][s]}</span></button></li>`).join('')}
            </ul>
          </details>`).join('');
    }

    const deptSel = document.getElementById('deptFilter');
    if (deptSel) {
      deptSel.innerHTML = `<option value="All">All Departments</option>` +
        deptNames.map(d => `<option value="${escapeHtml(d)}" ${d === state.dept ? 'selected' : ''}>${escapeHtml(d)} (${deptCounts[d]})</option>`).join('');
    }

    // Subcategory options depend on the selected department.
    const pool = state.dept === 'All' ? state.products : state.products.filter(p => p.dept === state.dept);
    const cats = {};
    const brands = {};
    pool.forEach(p => {
      cats[p.sub] = (cats[p.sub] || 0) + 1;
      brands[p.brand] = (brands[p.brand] || 0) + 1;
    });

    fillSelect('categoryFilter', cats, state.category, 'All Categories');
    fillSelect('brandFilter', brands, state.brand, 'All Brands');
  }

  function fillSelect(id, counts, selected, allLabel) {
    const sel = document.getElementById(id);
    const names = Object.keys(counts).sort();
    sel.innerHTML = `<option value="All">${allLabel}</option>` +
      names.map(n => `<option value="${escapeHtml(n)}" ${n === selected ? 'selected' : ''}>${escapeHtml(n)} (${counts[n]})</option>`).join('');
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // ---------- product modal ----------
  let modalProduct = null;
  let modalQty = 1;

  function openModal(p) {
    modalProduct = p;
    modalQty = 1;
    // High-res from supplier CDN → local copy → placeholder
    const modalImg = document.getElementById('modalImg');
    modalImg.onerror = function () { this.onerror = function () { this.onerror = null; this.src = PLACEHOLDER_IMG; }; this.src = p.image; };
    modalImg.src = p.imageLarge || p.image;
    document.getElementById('modalBrand').textContent = p.brand;
    document.getElementById('modalName').textContent = p.name;
    document.getElementById('modalPrice').innerHTML = '<span class="currency">AED</span>' + fmtPrice(p.price);
    document.getElementById('modalMeta').textContent =
      p.sub + (p.inStock ? ' · In stock in Abu Dhabi' : ' · Available on order — ask us for lead time');
    document.getElementById('modalQty').textContent = '1';
    document.getElementById('productModalOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    document.getElementById('productModalOverlay').classList.remove('open');
    document.body.style.overflow = '';
    modalProduct = null;
  }

  // ---------- cart ----------
  function loadCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (_) { return []; }
  }
  function saveCart() {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    renderCart();
  }
  function addToCart(p, qty) {
    const item = cart.find(i => i.id === p.id);
    if (item) item.qty += qty;
    else cart.push({ id: p.id, name: p.name, price: p.price, image: p.image, qty });
    saveCart();
    openCart();
  }
  function cartTotal() {
    return cart.reduce((s, i) => s + i.price * i.qty, 0);
  }

  function renderCart() {
    const count = cart.reduce((s, i) => s + i.qty, 0);
    const badge = document.getElementById('cartCount');
    badge.textContent = count;
    badge.style.display = count ? 'flex' : 'none';

    const wrap = document.getElementById('cartItems');
    if (!cart.length) {
      wrap.innerHTML = '<div class="cart-empty-msg"><i class="fas fa-shopping-cart" style="font-size:2rem;opacity:.3"></i><p>Your cart is empty</p></div>';
    } else {
      wrap.innerHTML = cart.map(i => `
        <div class="cart-item">
          <img src="${i.image}" alt="" onerror="this.onerror=null;this.src='${PLACEHOLDER_IMG}'">
          <div class="cart-item-info">
            <div class="cart-item-name">${escapeHtml(i.name)}</div>
            <div class="cart-item-price">AED ${fmtPrice(i.price)}</div>
            <div class="cart-item-controls">
              <div class="qty-control">
                <button data-cart-dec="${i.id}">−</button><span>${i.qty}</span><button data-cart-inc="${i.id}">+</button>
              </div>
              <button class="cart-item-remove" data-cart-rm="${i.id}"><i class="fas fa-trash-alt"></i></button>
            </div>
          </div>
        </div>`).join('');
    }
    document.getElementById('cartTotal').textContent = 'AED ' + fmtPrice(cartTotal());
    document.getElementById('cartCheckout').disabled = !cart.length;
  }

  function openCart() {
    document.getElementById('cartDrawer').classList.add('open');
    document.getElementById('cartDrawerOverlay').classList.add('open');
  }
  function closeCart() {
    document.getElementById('cartDrawer').classList.remove('open');
    document.getElementById('cartDrawerOverlay').classList.remove('open');
  }

  function waLink(message) {
    return 'https://api.whatsapp.com/send?phone=' + WHATSAPP_PHONE + '&text=' + encodeURIComponent(message);
  }

  function checkoutWhatsApp() {
    if (!cart.length) return;
    // Capture the order in Firestore (fire-and-forget) — checkout itself stays WhatsApp
    if (window.AKM) {
      window.AKM.saveOrder({
        items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty })),
        total: Math.round(cartTotal() * 100) / 100,
        currency: 'AED'
      });
    }
    const lines = ['Hello AKM Music! I would like to order:', ''];
    cart.forEach(i => lines.push(`• ${i.name} ×${i.qty} — AED ${fmtPrice(i.price * i.qty)} (Ref: ${i.id})`));
    lines.push('', `Total: AED ${fmtPrice(cartTotal())}`, '', 'Please confirm availability and delivery. Thank you!');
    window.open(waLink(lines.join('\n')), '_blank', 'noopener');
    if (window.gtag) gtag('event', 'begin_checkout', { value: cartTotal(), currency: 'AED', items_count: cart.length });
  }

  function orderSingleWhatsApp(p, qty) {
    const msg = `Hello AKM Music! I'm interested in:\n\n• ${p.name} ×${qty || 1} — AED ${fmtPrice(p.price * (qty || 1))} (Ref: ${p.id})\n\nPlease confirm availability. Thank you!`;
    window.open(waLink(msg), '_blank', 'noopener');
    if (window.gtag) gtag('event', 'select_item', { item_id: p.id, item_name: p.name });
  }

  // ---------- events ----------
  function bindEvents() {
    document.getElementById('shopSearch').addEventListener('input', e => {
      state.query = e.target.value;
      state.shown = PAGE_SIZE;
      render();
    });

    const sidebar = document.getElementById('shopSidebar');
    if (sidebar) sidebar.addEventListener('click', e => {
      const btn = e.target.closest('[data-side-dept]');
      if (!btn) return;
      e.preventDefault();
      state.dept = btn.dataset.sideDept;
      state.category = btn.dataset.sideSub || 'All';
      state.brand = 'All';
      state.shown = PAGE_SIZE;
      renderFilters();
      render();
    });

    const deptSel = document.getElementById('deptFilter');
    if (deptSel) deptSel.addEventListener('change', e => {
      state.dept = e.target.value;
      state.category = 'All';
      state.brand = 'All';
      state.shown = PAGE_SIZE;
      renderFilters();
      render();
    });

    document.getElementById('categoryFilter').addEventListener('change', e => {
      state.category = e.target.value;
      state.shown = PAGE_SIZE;
      render();
    });
    document.getElementById('brandFilter').addEventListener('change', e => {
      state.brand = e.target.value;
      state.shown = PAGE_SIZE;
      render();
    });
    document.getElementById('sortFilter').addEventListener('change', e => {
      state.sort = e.target.value;
      render();
    });
    document.getElementById('stockFilter').addEventListener('change', e => {
      state.inStockOnly = e.target.checked;
      state.shown = PAGE_SIZE;
      render();
    });
    document.getElementById('loadMore').addEventListener('click', () => {
      state.shown += PAGE_SIZE;
      render();
    });

    document.getElementById('productGrid').addEventListener('click', e => {
      const add = e.target.closest('[data-add]');
      const wa = e.target.closest('[data-wa]');
      const card = e.target.closest('.product-card');
      if (add) {
        const p = state.products.find(x => x.id === add.dataset.add);
        if (p) addToCart(p, 1);
        return;
      }
      if (wa) {
        const p = state.products.find(x => x.id === wa.dataset.wa);
        if (p) orderSingleWhatsApp(p, 1);
        return;
      }
      if (card) {
        const p = state.products.find(x => x.id === card.dataset.id);
        if (p) openModal(p);
      }
    });

    // Modal
    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('productModalOverlay').addEventListener('click', e => {
      if (e.target.id === 'productModalOverlay') closeModal();
    });
    document.getElementById('modalQtyDec').addEventListener('click', () => {
      modalQty = Math.max(1, modalQty - 1);
      document.getElementById('modalQty').textContent = modalQty;
    });
    document.getElementById('modalQtyInc').addEventListener('click', () => {
      modalQty++;
      document.getElementById('modalQty').textContent = modalQty;
    });
    document.getElementById('modalAddCart').addEventListener('click', () => {
      if (modalProduct) { addToCart(modalProduct, modalQty); closeModal(); }
    });
    document.getElementById('modalWhatsApp').addEventListener('click', () => {
      if (modalProduct) orderSingleWhatsApp(modalProduct, modalQty);
    });

    // Cart
    document.getElementById('cartFab').addEventListener('click', openCart);
    document.getElementById('cartClose').addEventListener('click', closeCart);
    document.getElementById('cartDrawerOverlay').addEventListener('click', closeCart);
    document.getElementById('cartCheckout').addEventListener('click', checkoutWhatsApp);
    document.getElementById('cartItems').addEventListener('click', e => {
      const inc = e.target.closest('[data-cart-inc]');
      const dec = e.target.closest('[data-cart-dec]');
      const rm = e.target.closest('[data-cart-rm]');
      if (inc) { cart.find(i => i.id === inc.dataset.cartInc).qty++; saveCart(); }
      else if (dec) {
        const item = cart.find(i => i.id === dec.dataset.cartDec);
        item.qty = Math.max(1, item.qty - 1);
        saveCart();
      } else if (rm) {
        cart = cart.filter(i => i.id !== rm.dataset.cartRm);
        saveCart();
      }
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') { closeModal(); closeCart(); }
    });
  }

  // ---------- init ----------
  document.addEventListener('DOMContentLoaded', async () => {
    bindEvents();
    renderCart();
    try {
      await loadProducts();
    } catch (err) {
      document.getElementById('productGrid').innerHTML =
        '<div class="shop-empty">Could not load the catalog. Please refresh the page.</div>';
      return;
    }
    // Deep link: shop.html?dept=...&q=...
    const params = new URLSearchParams(location.search);
    if (params.get('q')) {
      state.query = params.get('q');
      document.getElementById('shopSearch').value = state.query;
    }
    if (params.get('dept')) state.dept = params.get('dept');
    if (params.get('cat')) state.category = params.get('cat');
    renderFilters();
    render();

    // Deep link: shop.html?product=<id> — open that product (used by the
    // Facebook/Instagram & Google product feeds so each item links to itself).
    const pid = params.get('product');
    if (pid) {
      const prod = state.products.find(p => String(p.id) === String(pid));
      if (prod) {
        document.title = prod.name + ' | AKM Music Abu Dhabi';
        openModal(prod);
      }
    }
  });
})();
