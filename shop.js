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

  function departmentFor(category) {
    for (const d of DEPARTMENTS) if (d.match.test(category)) return d.name;
    return 'Strings & Accessories';
  }

  const state = {
    products: [],
    dept: 'All',
    category: 'All',
    brand: 'All',
    query: '',
    sort: 'featured',
    inStockOnly: false,
    shown: PAGE_SIZE
  };

  let cart = loadCart();

  // ---------- data ----------
  async function loadProducts() {
    const [res, overrides] = await Promise.all([
      fetch('products.json?v=' + new Date().toISOString().slice(0, 10), { cache: 'no-cache' }),
      window.AKM ? window.AKM.getCatalogOverrides() : Promise.resolve(null)
    ]);
    const data = await res.json();
    let products = data.products;
    // Admin can disable listings from admin.html (stored in Firestore)
    if (overrides) {
      const offCats = new Set(overrides.disabledCategories);
      const offBrands = new Set(overrides.disabledBrands);
      products = products.filter(p =>
        !overrides.disabledIds[p.id] && !offCats.has(p.category) && !offBrands.has(p.brand));
    }
    state.products = products.map(p => Object.assign({ dept: departmentFor(p.category) }, p));
  }

  // ---------- filtering ----------
  function filtered() {
    const q = state.query.trim().toLowerCase();
    const terms = q ? q.split(/\s+/) : [];
    let list = state.products.filter(p => {
      if (state.dept !== 'All' && p.dept !== state.dept) return false;
      if (state.category !== 'All' && p.category !== state.category) return false;
      if (state.brand !== 'All' && p.brand !== state.brand) return false;
      if (state.inStockOnly && !p.inStock) return false;
      if (terms.length) {
        const hay = (p.name + ' ' + p.category + ' ' + p.brand).toLowerCase();
        if (!terms.every(t => hay.includes(t))) return false;
      }
      return true;
    });
    switch (state.sort) {
      case 'price-asc': list.sort((a, b) => a.price - b.price); break;
      case 'price-desc': list.sort((a, b) => b.price - a.price); break;
      case 'name': list.sort((a, b) => a.name.localeCompare(b.name)); break;
      default: list.sort((a, b) => (b.inStock - a.inStock) || a.name.localeCompare(b.name));
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
    const deptCounts = {};
    state.products.forEach(p => { deptCounts[p.dept] = (deptCounts[p.dept] || 0) + 1; });

    const deptWrap = document.getElementById('deptChips');
    deptWrap.innerHTML =
      `<button class="dept-chip ${state.dept === 'All' ? 'active' : ''}" data-dept="All">All Products</button>` +
      DEPARTMENTS.filter(d => deptCounts[d.name])
        .map(d => `<button class="dept-chip ${state.dept === d.name ? 'active' : ''}" data-dept="${d.name}">${d.name}</button>`)
        .join('');

    // Category options depend on the selected department.
    const pool = state.dept === 'All' ? state.products : state.products.filter(p => p.dept === state.dept);
    const cats = {};
    const brands = {};
    pool.forEach(p => {
      cats[p.category] = (cats[p.category] || 0) + 1;
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
    document.getElementById('modalImg').src = p.imageLarge;
    document.getElementById('modalImg').onerror = function () { this.onerror = null; this.src = PLACEHOLDER_IMG; };
    document.getElementById('modalBrand').textContent = p.brand;
    document.getElementById('modalName').textContent = p.name;
    document.getElementById('modalPrice').innerHTML = '<span class="currency">AED</span>' + fmtPrice(p.price);
    document.getElementById('modalMeta').textContent =
      p.category + (p.inStock ? ' · In stock in Abu Dhabi' : ' · Available on order — ask us for lead time');
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

    document.getElementById('deptChips').addEventListener('click', e => {
      const btn = e.target.closest('[data-dept]');
      if (!btn) return;
      state.dept = btn.dataset.dept;
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
    renderFilters();
    render();
  });
})();
