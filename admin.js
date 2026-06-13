// AKM Music — Admin dashboard
// Google sign-in (admin emails only) → manage listings, view orders & bookings.
// Listing toggles write to Firestore doc siteConfig/catalog, which shop.js
// reads on every visit (a single document read per shopper).

const SDK = 'https://www.gstatic.com/firebasejs/12.4.0/';
const cfg = window.AKM_FIREBASE_CONFIG;
const ADMINS = (window.AKM_ADMIN_EMAILS || []).map(e => e.toLowerCase());
const gate = document.getElementById('gate');
const appEl = document.getElementById('app');

let initializeApp, getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged,
  getFirestore, doc, getDoc, setDoc, updateDoc, deleteField,
  collection, query, orderBy, limit, getDocs, arrayUnion, arrayRemove;

if (!cfg) {
  gate.querySelector('#gateHint').textContent =
    'Firebase is not configured yet — paste your project config into firebase-config.js first (see instructions inside the file).';
  document.getElementById('signInBtn').disabled = true;
} else {
  try {
    const [appMod, authMod, fsMod] = await Promise.all([
      import(SDK + 'firebase-app.js'),
      import(SDK + 'firebase-auth.js'),
      import(SDK + 'firebase-firestore.js')
    ]);
    ({ initializeApp } = appMod);
    ({ getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } = authMod);
    ({ getFirestore, doc, getDoc, setDoc, updateDoc, deleteField,
       collection, query, orderBy, limit, getDocs, arrayUnion, arrayRemove } = fsMod);
    main();
  } catch (err) {
    gate.querySelector('#gateHint').textContent = 'Could not load Firebase: ' + err.message;
    document.getElementById('signInBtn').disabled = true;
  }
}

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove('show'), 2200);
}

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function main() {
  const app = initializeApp(cfg);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const CATALOG = doc(db, 'siteConfig', 'catalog');

  // ---------- auth ----------
  document.getElementById('signInBtn').addEventListener('click', () =>
    signInWithPopup(auth, new GoogleAuthProvider()).catch(e => toast(e.message)));
  document.getElementById('signOutBtn').addEventListener('click', () => signOut(auth));

  onAuthStateChanged(auth, user => {
    const ok = user && ADMINS.includes((user.email || '').toLowerCase());
    if (user && !ok) {
      toast('This Google account is not an admin.');
      signOut(auth);
    }
    gate.style.display = ok ? 'none' : 'block';
    appEl.style.display = ok ? 'block' : 'none';
    document.getElementById('signOutBtn').style.display = ok ? 'inline-flex' : 'none';
    document.getElementById('adminUser').textContent = ok ? user.email : '';
    if (ok) start();
  });

  // ---------- tabs ----------
  document.querySelectorAll('.admin-tab').forEach(tab => tab.addEventListener('click', () => {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.toggle('active', t === tab));
    for (const name of ['listings', 'own', 'featured', 'blog', 'banners', 'orders', 'bookings']) {
      document.getElementById('panel-' + name).style.display = tab.dataset.tab === name ? 'block' : 'none';
    }
    if (tab.dataset.tab === 'orders') loadRecords('orders', 'ordersList');
    if (tab.dataset.tab === 'bookings') loadRecords('bookings', 'bookingsList');
    if (tab.dataset.tab === 'own') renderOwn();
    if (tab.dataset.tab === 'featured') renderFeatured();
    if (tab.dataset.tab === 'blog') renderBlog();
    if (tab.dataset.tab === 'banners') renderBanners();
  }));

  // ---------- listings ----------
  const OWNDOC = doc(db, 'siteConfig', 'ownProducts');
  const BLOGDOC = doc(db, 'siteConfig', 'blog');
  const BANNERDOC = doc(db, 'siteConfig', 'banners');
  const SUBCATEGORIES = ['Acoustic Guitars','Classical & Flamenco','Electric Guitars','Bass Guitars','Ukulele, Violin & Folk','Guitar Pickups','Acoustic Pianos','Digital Pianos','Keyboards & Synths','Keyboard Stands & Benches','Drum Kits','Cymbals','Snares & Toms','Drum Heads','Pedals & Hardware','Sticks & Brushes','Hand Percussion','Drum Bags & Cases','Guitar Amplifiers','Bass Amplifiers','Drum & Keyboard Amps','Pedals & Effects','PA Speakers','Mixers','Recording Gear','Headphones','Stands, Cables & Wireless','Harmonicas','Melodicas & Recorders','Reeds & Accessories','Guitar Strings','Violin & Oud Strings','Picks & Capos','Straps & Stands','Cases & Bags','Tuners & Metronomes','Care, Parts & Tools','Merch & Gifts','General Accessories'];
  let products = [];
  let ownProducts = [];
  let blogPosts = [];
  let banners = [];
  let ov = { disabledIds: {}, disabledCategories: [], disabledBrands: [], featuredIds: [], supplierEnabled: true };
  let shown = 60;
  let started = false;

  async function start() {
    if (started) return;
    started = true;
    const [res, snap, ownSnap, blogSnap, bannerSnap] = await Promise.all([
      fetch('products.json?v=' + Date.now(), { cache: 'no-cache' }),
      getDoc(CATALOG),
      getDoc(OWNDOC),
      getDoc(BLOGDOC),
      getDoc(BANNERDOC)
    ]);
    products = (await res.json()).products;
    if (snap.exists()) {
      const d = snap.data();
      ov = {
        disabledIds: d.disabledIds || {},
        disabledCategories: d.disabledCategories || [],
        disabledBrands: d.disabledBrands || [],
        featuredIds: d.featuredIds || [],
        supplierEnabled: d.supplierEnabled !== false
      };
      document.getElementById('homeBrandsInput').value = (d.homeBrands || []).join(', ');
    } else {
      await setDoc(CATALOG, { disabledIds: {}, disabledCategories: [], disabledBrands: [], featuredIds: [], supplierEnabled: true });
    }
    document.getElementById('supplierMaster').checked = ov.supplierEnabled;
    ownProducts = ownSnap.exists() ? (ownSnap.data().products || []) : [];
    blogPosts = blogSnap.exists() ? (blogSnap.data().posts || []) : [];
    banners = bannerSnap.exists() ? (bannerSnap.data().banners || []) : [];
    const cats = [...new Set(products.map(p => p.category))].sort();
    document.getElementById('adminCatFilter').innerHTML =
      '<option value="">All categories</option>' + cats.map(c => `<option>${esc(c)}</option>`).join('');
    document.getElementById('subcatList').innerHTML = SUBCATEGORIES.map(s => `<option>${esc(s)}</option>`).join('');
    renderBulk();
    renderListings();
  }

  function isOff(p) {
    return !!ov.disabledIds[p.id] || ov.disabledCategories.includes(p.category) || ov.disabledBrands.includes(p.brand);
  }

  function filteredListings() {
    const q = document.getElementById('adminSearch').value.trim().toLowerCase();
    const cat = document.getElementById('adminCatFilter').value;
    const show = document.getElementById('adminShowFilter').value;
    return products.filter(p => {
      if (cat && p.category !== cat) return false;
      if (show === 'off' && !isOff(p)) return false;
      if (q && !(p.name + ' ' + p.brand + ' ' + p.id).toLowerCase().includes(q)) return false;
      return true;
    });
  }

  function renderListings() {
    const list = filteredListings();
    const offCount = products.filter(isOff).length;
    document.getElementById('listingStats').textContent =
      `${products.length} products · ${products.length - offCount} live on the shop · ${offCount} disabled`;
    document.getElementById('listingRows').innerHTML = list.slice(0, shown).map(p => {
      const off = isOff(p);
      const lockedBy = ov.disabledCategories.includes(p.category) ? ' (category off)'
        : ov.disabledBrands.includes(p.brand) ? ' (brand off)' : '';
      return `<div class="listing-row ${off ? 'off' : ''}">
        <img src="${esc(p.image)}" loading="lazy" alt="">
        <div class="listing-name">
          <div>${esc(p.name)}</div>
          <div class="sub">${esc(p.brand)} · ${esc(p.category)} · AED ${p.price}${lockedBy}</div>
        </div>
        <label class="switch" title="${off ? 'Enable' : 'Disable'} listing">
          <input type="checkbox" data-id="${p.id}" ${off ? '' : 'checked'} ${lockedBy ? 'disabled' : ''}>
          <span class="track"></span><span class="knob"></span>
        </label>
      </div>`;
    }).join('') || '<div class="empty-msg">No products match.</div>';
    document.getElementById('listingMore').style.display = list.length > shown ? 'block' : 'none';
  }

  document.getElementById('listingRows').addEventListener('change', async e => {
    const cb = e.target.closest('input[data-id]');
    if (!cb) return;
    const id = cb.dataset.id;
    const disable = !cb.checked;
    try {
      await updateDoc(CATALOG, { ['disabledIds.' + id]: disable ? true : deleteField() });
      if (disable) ov.disabledIds[id] = true; else delete ov.disabledIds[id];
      toast(disable ? 'Listing disabled' : 'Listing enabled');
      renderListings();
    } catch (err) {
      toast('Save failed: ' + err.message);
      cb.checked = !cb.checked;
    }
  });

  for (const id of ['adminSearch', 'adminCatFilter', 'adminShowFilter']) {
    document.getElementById(id).addEventListener('input', () => { shown = 60; renderListings(); });
  }
  document.getElementById('listingMore').addEventListener('click', () => { shown += 60; renderListings(); });

  function renderBulk() {
    const cats = [...new Set(products.map(p => p.category))].sort();
    const brands = [...new Set(products.map(p => p.brand))].sort();
    const chip = (name, kind, off) =>
      `<button class="bulk-chip ${off ? 'off' : ''}" data-kind="${kind}" data-name="${esc(name)}">${esc(name)}</button>`;
    document.getElementById('bulkCats').innerHTML = cats.map(c => chip(c, 'cat', ov.disabledCategories.includes(c))).join('');
    document.getElementById('bulkBrands').innerHTML = brands.map(b => chip(b, 'brand', ov.disabledBrands.includes(b))).join('');
  }

  document.addEventListener('click', async e => {
    const chip = e.target.closest('.bulk-chip');
    if (!chip) return;
    const { kind, name } = chip.dataset;
    const field = kind === 'cat' ? 'disabledCategories' : 'disabledBrands';
    const off = ov[field].includes(name);
    try {
      await updateDoc(CATALOG, { [field]: off ? arrayRemove(name) : arrayUnion(name) });
      ov[field] = off ? ov[field].filter(x => x !== name) : [...ov[field], name];
      toast(`${name} ${off ? 'enabled' : 'disabled'}`);
      renderBulk();
      renderListings();
    } catch (err) {
      toast('Save failed: ' + err.message);
    }
  });

  // ---------- our products ----------
  let editingRef = null;
  let uploadedImage = null;

  function nextRef() {
    let max = 0;
    for (const p of ownProducts) {
      const m = /^AKM-(\d+)$/.exec(p.id || '');
      if (m) max = Math.max(max, parseInt(m[1], 10));
    }
    return 'AKM-' + String(max + 1).padStart(4, '0');
  }

  async function saveOwn() {
    await setDoc(OWNDOC, { products: ownProducts, updatedAt: new Date().toISOString() });
  }

  function docSizeKB() {
    return Math.round(JSON.stringify(ownProducts).length / 1024);
  }

  function renderOwn() {
    const el = document.getElementById('ownRows');
    document.getElementById('ownStats').textContent =
      `${ownProducts.length} products · storage ${docSizeKB()} / 900 KB`;
    if (!ownProducts.length) {
      el.innerHTML = '<div class="empty-msg">No own products yet — click "Add Product" or import an Excel file.</div>';
      return;
    }
    el.classList.remove('empty-msg');
    el.innerHTML = ownProducts.map(p => `
      <div class="listing-row ${p.inStock === false ? 'off' : ''}">
        <img src="${esc(p.image || '')}" loading="lazy" alt="" onerror="this.style.visibility='hidden'">
        <div class="listing-name">
          <div>${esc(p.name)}</div>
          <div class="sub">${esc(p.id)} · ${esc(p.brand || 'AKM')} · ${esc(p.category)} · AED ${p.price}${p.inStock === false ? ' · out of stock' : ''}</div>
        </div>
        <button class="mark-btn" data-own-edit="${esc(p.id)}"><i class="fas fa-pen"></i> Edit</button>
        <button class="mark-btn" style="color:var(--color-accent);" data-own-del="${esc(p.id)}"><i class="fas fa-trash-alt"></i></button>
      </div>`).join('');
  }

  function openOwnForm(p) {
    editingRef = p ? p.id : null;
    uploadedImage = null;
    document.getElementById('ownForm').style.display = 'block';
    document.getElementById('ownRef').value = p ? p.id : nextRef();
    document.getElementById('ownName').value = p ? p.name : '';
    document.getElementById('ownBrand').value = p ? (p.brand || '') : '';
    document.getElementById('ownCategory').value = p ? (p.category || '') : '';
    document.getElementById('ownPrice').value = p ? p.price : '';
    document.getElementById('ownStock').value = p && p.inStock === false ? 'no' : 'yes';
    document.getElementById('ownImageUrl').value = p && p.image && !String(p.image).startsWith('data:') ? p.image : '';
    document.getElementById('ownImageInfo').textContent =
      p && String(p.image || '').startsWith('data:') ? 'Current: uploaded photo (kept unless you change it)' : '';
    document.getElementById('ownImageFile').value = '';
    document.getElementById('ownForm').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  document.getElementById('ownAddBtn').addEventListener('click', () => openOwnForm(null));
  document.getElementById('ownCancelBtn').addEventListener('click', () => {
    document.getElementById('ownForm').style.display = 'none';
  });

  // Compress uploads so the single-document catalog stays small
  document.getElementById('ownImageFile').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 420 / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      uploadedImage = canvas.toDataURL('image/webp', 0.78);
      const kb = Math.round(uploadedImage.length / 1024);
      document.getElementById('ownImageInfo').textContent =
        kb > 90 ? `Compressed to ${kb} KB — quite large; a link is lighter.` : `Compressed to ${kb} KB ✓`;
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  });

  document.getElementById('ownSaveBtn').addEventListener('click', async () => {
    const name = document.getElementById('ownName').value.trim();
    const category = document.getElementById('ownCategory').value.trim();
    const price = parseFloat(document.getElementById('ownPrice').value);
    if (!name || !category || !(price >= 0)) { toast('Name, category and price are required.'); return; }
    const ref = document.getElementById('ownRef').value || nextRef();
    const image = uploadedImage || document.getElementById('ownImageUrl').value.trim() ||
      (editingRef ? (ownProducts.find(x => x.id === editingRef)?.image || '') : '');
    const item = {
      id: ref, name,
      brand: document.getElementById('ownBrand').value.trim().toUpperCase() || 'AKM',
      category, price: Math.round(price * 100) / 100,
      inStock: document.getElementById('ownStock').value === 'yes',
      image
    };
    const i = ownProducts.findIndex(x => x.id === ref);
    if (i > -1) ownProducts[i] = item; else ownProducts.push(item);
    if (docSizeKB() > 900) {
      ownProducts.splice(ownProducts.findIndex(x => x.id === ref), i > -1 ? 0 : 1);
      toast('Storage limit reached — use image links instead of uploads.');
      return;
    }
    try {
      await saveOwn();
      toast('Saved ' + ref);
      document.getElementById('ownForm').style.display = 'none';
      renderOwn();
    } catch (err) { toast('Save failed: ' + err.message); }
  });

  document.getElementById('ownRows').addEventListener('click', async e => {
    const edit = e.target.closest('[data-own-edit]');
    const del = e.target.closest('[data-own-del]');
    if (edit) openOwnForm(ownProducts.find(x => x.id === edit.dataset.ownEdit));
    if (del && confirm('Delete ' + del.dataset.ownDel + '? This cannot be undone.')) {
      ownProducts = ownProducts.filter(x => x.id !== del.dataset.ownDel);
      try { await saveOwn(); toast('Deleted'); renderOwn(); }
      catch (err) { toast('Delete failed: ' + err.message); }
    }
  });

  // Excel export / import (SheetJS)
  document.getElementById('ownExportBtn').addEventListener('click', () => {
    const rows = ownProducts.map(p => ({
      'Ref': p.id, 'Name': p.name, 'Brand': p.brand || 'AKM', 'Category': p.category,
      'Price': p.price, 'In Stock': p.inStock === false ? 'NO' : 'YES',
      'Image URL': String(p.image || '').startsWith('data:') ? '(uploaded photo)' : (p.image || '')
    }));
    const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{ 'Ref': '', 'Name': '', 'Brand': '', 'Category': '', 'Price': '', 'In Stock': 'YES', 'Image URL': '' }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'AKM Products');
    XLSX.writeFile(wb, 'akm-products.xlsx');
  });

  document.getElementById('ownImportBtn').addEventListener('click', () => document.getElementById('ownImportFile').click());
  document.getElementById('ownImportFile').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const wb = XLSX.read(await file.arrayBuffer());
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
      let added = 0, updated = 0, skipped = 0;
      for (const r of rows) {
        const name = String(r['Name'] || '').trim();
        const category = String(r['Category'] || '').trim();
        const price = parseFloat(r['Price']);
        if (!name || !category || !(price >= 0)) { skipped++; continue; }
        let ref = String(r['Ref'] || '').trim().toUpperCase();
        const imgCell = String(r['Image URL'] || '').trim();
        const existing = ref ? ownProducts.find(x => x.id === ref) : null;
        const item = {
          id: ref && /^AKM-/.test(ref) ? ref : nextRef(),
          name,
          brand: String(r['Brand'] || 'AKM').trim().toUpperCase() || 'AKM',
          category,
          price: Math.round(price * 100) / 100,
          inStock: !/^no$/i.test(String(r['In Stock'] || 'YES').trim()),
          image: imgCell === '(uploaded photo)' ? (existing?.image || '') : imgCell
        };
        const i = ownProducts.findIndex(x => x.id === item.id);
        if (i > -1) { ownProducts[i] = item; updated++; } else { ownProducts.push(item); added++; }
      }
      if (docSizeKB() > 900) { toast('Import too large for storage — reduce rows or use links.'); return; }
      await saveOwn();
      toast(`Imported: ${added} added, ${updated} updated, ${skipped} skipped`);
      renderOwn();
    } catch (err) { toast('Import failed: ' + err.message); }
    e.target.value = '';
  });

  // ---------- featured ----------
  function allProducts() {
    return products.map(p => ({ ...p, _src: 'supplier' }))
      .concat(ownProducts.map(p => ({ ...p, _src: 'akm' })));
  }

  function renderFeatured() {
    const byId = Object.fromEntries(allProducts().map(p => [String(p.id), p]));
    const picked = document.getElementById('featPicked');
    picked.innerHTML = '<strong style="font-size:var(--font-size-sm);">Featured now (' + ov.featuredIds.length + '):</strong>' +
      (ov.featuredIds.length ? ov.featuredIds.map(id => {
        const p = byId[id];
        return `<div class="listing-row">
          <img src="${esc(p?.image || '')}" alt="" onerror="this.style.visibility='hidden'">
          <div class="listing-name"><div>${esc(p?.name || id + ' (no longer in catalog)')}</div>
          <div class="sub">${esc(id)}${p ? ' · AED ' + p.price : ''}</div></div>
          <button class="mark-btn" style="color:var(--color-accent);" data-feat-rm="${esc(id)}"><i class="fas fa-times"></i> Remove</button>
        </div>`;
      }).join('') : '<div class="empty-msg" style="padding:1rem;">Nothing featured — home page shows automatic daily picks.</div>');
    renderFeatResults();
  }

  function renderFeatResults() {
    const q = document.getElementById('featSearch').value.trim().toLowerCase();
    const el = document.getElementById('featResults');
    if (!q) { el.innerHTML = ''; return; }
    const list = allProducts().filter(p =>
      !ov.featuredIds.includes(String(p.id)) &&
      (p.name + ' ' + (p.brand || '') + ' ' + p.id).toLowerCase().includes(q)).slice(0, 20);
    el.innerHTML = list.map(p => `
      <div class="listing-row">
        <img src="${esc(p.image || '')}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">
        <div class="listing-name"><div>${esc(p.name)}</div>
        <div class="sub">${esc(String(p.id))} · ${p._src === 'akm' ? 'our product' : 'supplier'} · AED ${p.price}</div></div>
        <button class="mark-btn" data-feat-add="${esc(String(p.id))}"><i class="fas fa-star"></i> Feature</button>
      </div>`).join('') || '<div class="empty-msg" style="padding:1rem;">No matches.</div>';
  }

  document.getElementById('featSearch').addEventListener('input', renderFeatResults);
  document.getElementById('homeBrandsSave').addEventListener('click', async () => {
    const brands = document.getElementById('homeBrandsInput').value
      .split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
    try {
      await updateDoc(CATALOG, { homeBrands: brands });
      toast('Brand marquee updated (' + brands.length + ' brands)');
    } catch (err) { toast('Save failed: ' + err.message); }
  });
  document.addEventListener('click', async e => {
    const add = e.target.closest('[data-feat-add]');
    const rm = e.target.closest('[data-feat-rm]');
    if (!add && !rm) return;
    try {
      if (add) {
        await updateDoc(CATALOG, { featuredIds: arrayUnion(add.dataset.featAdd) });
        ov.featuredIds.push(add.dataset.featAdd);
      } else {
        await updateDoc(CATALOG, { featuredIds: arrayRemove(rm.dataset.featRm) });
        ov.featuredIds = ov.featuredIds.filter(x => x !== rm.dataset.featRm);
      }
      renderFeatured();
      toast('Featured list updated');
    } catch (err) { toast('Update failed: ' + err.message); }
  });

  // ---------- supplier master switch ----------
  document.getElementById('supplierMaster').addEventListener('change', async e => {
    try {
      await updateDoc(CATALOG, { supplierEnabled: e.target.checked });
      ov.supplierEnabled = e.target.checked;
      toast(e.target.checked ? 'Supplier catalog ON' : 'Supplier catalog hidden — shop shows only Our Products');
    } catch (err) {
      toast('Save failed: ' + err.message);
      e.target.checked = !e.target.checked;
    }
  });

  // ---------- shared image compressor ----------
  function compressImage(file, maxSide, quality, cb) {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      cb(canvas.toDataURL('image/webp', quality));
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  }

  // ---------- blog ----------
  let editingPost = null;
  let blogCover = null;

  const slugify = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  const saveBlog = () => setDoc(BLOGDOC, { posts: blogPosts, updatedAt: new Date().toISOString() });
  const blogKB = () => Math.round(JSON.stringify(blogPosts).length / 1024);

  function renderBlog() {
    document.getElementById('blogStats').textContent =
      `${blogPosts.length} admin posts · storage ${blogKB()} / 900 KB`;
    const el = document.getElementById('blogRows');
    if (!blogPosts.length) {
      el.innerHTML = '<div class="empty-msg">No posts in the backend yet. Click "Write Post" to publish your own, or "Import starter articles" to pull the built-in articles in so you can edit or delete them. Until then the starter articles show on the public blog automatically.</div>';
      return;
    }
    el.classList.remove('empty-msg');
    el.innerHTML = blogPosts.map(p => `
      <div class="listing-row">
        <img src="${esc(p.cover || '')}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">
        <div class="listing-name">
          <div>${esc(p.title)}</div>
          <div class="sub">${esc(p.date)} · ${esc(p.category)} · ${esc(p.author || 'AKM Music')}</div>
        </div>
        <a class="mark-btn" href="blog.html?post=${encodeURIComponent(p.id)}" target="_blank"><i class="fas fa-eye"></i> View</a>
        <button class="mark-btn" data-bp-edit="${esc(p.id)}"><i class="fas fa-pen"></i> Edit</button>
        <button class="mark-btn" style="color:var(--color-accent);" data-bp-del="${esc(p.id)}"><i class="fas fa-trash-alt"></i></button>
      </div>`).join('');
  }

  function openBlogForm(p) {
    editingPost = p ? p.id : null;
    blogCover = null;
    document.getElementById('blogForm').style.display = 'block';
    document.getElementById('bpTitle').value = p ? p.title : '';
    document.getElementById('bpCategory').value = p ? p.category : 'news';
    document.getElementById('bpAuthor').value = p ? (p.author || '') : '';
    document.getElementById('bpCoverUrl').value = p && p.cover && !p.cover.startsWith('data:') ? p.cover : '';
    document.getElementById('bpCoverInfo').textContent =
      p && (p.cover || '').startsWith('data:') ? 'Current: uploaded cover (kept unless you change it)' : '';
    document.getElementById('bpCoverFile').value = '';
    document.getElementById('bpBody').value = p ? p.body : '';
    document.getElementById('blogForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  document.getElementById('blogAddBtn').addEventListener('click', () => openBlogForm(null));
  const blogSeedBtn = document.getElementById('blogSeedBtn');
  if (blogSeedBtn) blogSeedBtn.addEventListener('click', async () => {
    const seed = Array.isArray(window.AKM_BLOG_SEED) ? window.AKM_BLOG_SEED : [];
    if (!seed.length) { toast('No starter articles found.'); return; }
    const have = new Set(blogPosts.map(p => p.id));
    const toAdd = seed.filter(p => !have.has(p.id)).map(p => ({
      id: p.id, title: p.title, category: p.category || 'news',
      author: p.author || 'AKM Music', date: p.date || new Date().toISOString().slice(0, 10),
      cover: p.cover || '', body: p.body || ''
    }));
    if (!toAdd.length) { toast('Starter articles are already imported.'); return; }
    if (!confirm(`Import ${toAdd.length} starter article(s) into your editable list?`)) return;
    blogPosts = toAdd.concat(blogPosts);
    if (blogKB() > 900) { blogPosts = blogPosts.slice(toAdd.length); toast('Storage limit reached — import fewer or shorten articles.'); return; }
    try { await saveBlog(); toast(`Imported ${toAdd.length} article(s) — now editable below`); renderBlog(); }
    catch (err) { blogPosts = blogPosts.slice(toAdd.length); toast('Import failed: ' + err.message); }
  });
  document.getElementById('blogCancelBtn').addEventListener('click', () => {
    document.getElementById('blogForm').style.display = 'none';
  });
  document.getElementById('bpCoverFile').addEventListener('change', e => {
    if (!e.target.files[0]) return;
    compressImage(e.target.files[0], 900, 0.75, dataUrl => {
      blogCover = dataUrl;
      document.getElementById('bpCoverInfo').textContent = 'Compressed to ' + Math.round(dataUrl.length / 1024) + ' KB ✓';
    });
  });
  document.getElementById('blogSaveBtn').addEventListener('click', async () => {
    const title = document.getElementById('bpTitle').value.trim();
    const body = document.getElementById('bpBody').value.trim();
    if (!title || !body) { toast('Heading and article text are required.'); return; }
    const existing = editingPost ? blogPosts.find(x => x.id === editingPost) : null;
    const post = {
      id: existing ? existing.id : slugify(title) + '-' + Date.now().toString(36),
      title,
      category: document.getElementById('bpCategory').value,
      author: document.getElementById('bpAuthor').value.trim() || 'AKM Music',
      date: existing ? existing.date : new Date().toISOString().slice(0, 10),
      cover: blogCover || document.getElementById('bpCoverUrl').value.trim() || (existing ? existing.cover : ''),
      body
    };
    const i = blogPosts.findIndex(x => x.id === post.id);
    if (i > -1) blogPosts[i] = post; else blogPosts.unshift(post);
    if (blogKB() > 900) {
      if (i > -1) blogPosts[i] = existing; else blogPosts.shift();
      toast('Storage limit reached — use cover links instead of uploads, or shorten the article.');
      return;
    }
    try {
      await saveBlog();
      toast('Published — live on the blog now');
      document.getElementById('blogForm').style.display = 'none';
      renderBlog();
    } catch (err) { toast('Save failed: ' + err.message); }
  });
  document.getElementById('blogRows').addEventListener('click', async e => {
    const edit = e.target.closest('[data-bp-edit]');
    const del = e.target.closest('[data-bp-del]');
    if (edit) openBlogForm(blogPosts.find(x => x.id === edit.dataset.bpEdit));
    if (del && confirm('Delete this post permanently?')) {
      blogPosts = blogPosts.filter(x => x.id !== del.dataset.bpDel);
      try { await saveBlog(); toast('Post deleted'); renderBlog(); }
      catch (err) { toast('Delete failed: ' + err.message); }
    }
  });

  // ---------- banners ----------
  let editingBanner = -1;
  let bannerImage = null;
  const saveBanners = () => setDoc(BANNERDOC, { banners, updatedAt: new Date().toISOString() });
  const bannerKB = () => Math.round(JSON.stringify(banners).length / 1024);

  function renderBanners() {
    document.getElementById('bannerStats').textContent =
      `${banners.length} / 5 banners · storage ${bannerKB()} / 900 KB`;
    const el = document.getElementById('bannerRows');
    if (!banners.length) {
      el.innerHTML = '<div class="empty-msg">No custom banners — the home page shows the built-in designs. Add one to replace them.</div>';
      return;
    }
    el.classList.remove('empty-msg');
    el.innerHTML = banners.map((b, i) => `
      <div class="listing-row">
        <img src="${esc(b.image)}" alt="" style="width:120px; height:32px; object-fit:cover;" onerror="this.style.visibility='hidden'">
        <div class="listing-name">
          <div>${esc(b.alt || 'Banner ' + (i + 1))}</div>
          <div class="sub">links to ${esc(b.link || 'shop.html')}</div>
        </div>
        ${i > 0 ? `<button class="mark-btn" data-bn-up="${i}"><i class="fas fa-arrow-up"></i></button>` : ''}
        <button class="mark-btn" data-bn-edit="${i}"><i class="fas fa-pen"></i> Edit</button>
        <button class="mark-btn" style="color:var(--color-accent);" data-bn-del="${i}"><i class="fas fa-trash-alt"></i></button>
      </div>`).join('');
  }

  function openBannerForm(i) {
    editingBanner = i;
    bannerImage = null;
    const b = i > -1 ? banners[i] : null;
    document.getElementById('bannerForm').style.display = 'block';
    document.getElementById('bnImageUrl').value = b && b.image && !b.image.startsWith('data:') ? b.image : '';
    document.getElementById('bnImageInfo').textContent =
      b && (b.image || '').startsWith('data:') ? 'Current: uploaded image (kept unless you change it)' : '';
    document.getElementById('bnImageFile').value = '';
    document.getElementById('bnLink').value = b ? (b.link || '') : 'shop.html';
    document.getElementById('bnAlt').value = b ? (b.alt || '') : '';
  }

  document.getElementById('bannerAddBtn').addEventListener('click', () => {
    if (banners.length >= 5) { toast('Maximum 5 banners — delete one first.'); return; }
    openBannerForm(-1);
  });
  document.getElementById('bannerCancelBtn').addEventListener('click', () => {
    document.getElementById('bannerForm').style.display = 'none';
  });
  document.getElementById('bnImageFile').addEventListener('change', e => {
    if (!e.target.files[0]) return;
    compressImage(e.target.files[0], 1600, 0.72, dataUrl => {
      bannerImage = dataUrl;
      document.getElementById('bnImageInfo').textContent = 'Compressed to ' + Math.round(dataUrl.length / 1024) + ' KB ✓';
    });
  });
  document.getElementById('bannerSaveBtn').addEventListener('click', async () => {
    const image = bannerImage || document.getElementById('bnImageUrl').value.trim() ||
      (editingBanner > -1 ? banners[editingBanner].image : '');
    if (!image) { toast('A banner image (link or upload) is required.'); return; }
    const item = {
      image,
      link: document.getElementById('bnLink').value.trim() || 'shop.html',
      alt: document.getElementById('bnAlt').value.trim() || 'AKM Music promotion'
    };
    const prev = editingBanner > -1 ? banners[editingBanner] : null;
    if (editingBanner > -1) banners[editingBanner] = item; else banners.push(item);
    if (bannerKB() > 900) {
      if (prev) banners[editingBanner] = prev; else banners.pop();
      toast('Storage limit reached — use image links for some banners.');
      return;
    }
    try {
      await saveBanners();
      toast('Banner saved — live on the home page');
      document.getElementById('bannerForm').style.display = 'none';
      renderBanners();
    } catch (err) { toast('Save failed: ' + err.message); }
  });
  document.getElementById('bannerRows').addEventListener('click', async e => {
    const up = e.target.closest('[data-bn-up]');
    const edit = e.target.closest('[data-bn-edit]');
    const del = e.target.closest('[data-bn-del]');
    try {
      if (up) {
        const i = +up.dataset.bnUp;
        [banners[i - 1], banners[i]] = [banners[i], banners[i - 1]];
        await saveBanners(); renderBanners();
      } else if (edit) {
        openBannerForm(+edit.dataset.bnEdit);
      } else if (del && confirm('Delete this banner?')) {
        banners.splice(+del.dataset.bnDel, 1);
        await saveBanners(); toast('Banner deleted'); renderBanners();
      }
    } catch (err) { toast('Update failed: ' + err.message); }
  });

  // ---------- orders & bookings ----------
  async function loadRecords(coll, target) {
    const el = document.getElementById(target);
    el.innerHTML = '<div class="empty-msg">Loading…</div>';
    try {
      const snap = await getDocs(query(collection(db, coll), orderBy('createdAt', 'desc'), limit(50)));
      if (snap.empty) {
        el.innerHTML = `<div class="empty-msg">No ${coll} yet. They appear here the moment a customer checks out${coll === 'bookings' ? ' or books a service' : ''}.</div>`;
        return;
      }
      el.innerHTML = [...snap.docs].map(d => {
        const r = d.data();
        const when = r.createdAt?.toDate ? r.createdAt.toDate().toLocaleString('en-AE') : '';
        const body = coll === 'orders'
          ? `<ul>${(r.items || []).map(i => `<li>${esc(i.name)} ×${i.qty} — AED ${i.price}</li>`).join('')}</ul>`
          : `<ul>${Object.entries(r)
              .filter(([k]) => !['type', 'status', 'source', 'createdAt'].includes(k))
              .map(([k, v]) => v ? `<li><strong>${esc(k)}:</strong> ${esc(v)}</li>` : '')
              .join('')}</ul>`;
        const label = coll === 'orders' ? 'Order' : (r.type || 'booking').toUpperCase();
        const total = coll === 'orders' ? `<span class="total">AED ${Number(r.total).toLocaleString('en-AE')}</span>` : '';
        return `<div class="record">
          <div class="record-head">
            <strong>${esc(label)}</strong>
            <span class="badge ${r.status === 'done' ? 'done' : 'new'}">${esc(r.status || 'new')}</span>
            <button class="mark-btn" data-coll="${coll}" data-id="${d.id}" data-status="${r.status === 'done' ? 'new' : 'done'}">
              Mark ${r.status === 'done' ? 'new' : 'done'}</button>
            <span class="when">${esc(when)}</span>
            ${total}
          </div>
          ${body}
        </div>`;
      }).join('');
    } catch (err) {
      el.innerHTML = `<div class="empty-msg">Could not load: ${esc(err.message)}</div>`;
    }
  }

  document.addEventListener('click', async e => {
    const btn = e.target.closest('.mark-btn');
    if (!btn) return;
    try {
      await updateDoc(doc(db, btn.dataset.coll, btn.dataset.id), { status: btn.dataset.status });
      loadRecords(btn.dataset.coll, btn.dataset.coll + 'List');
    } catch (err) {
      toast('Update failed: ' + err.message);
    }
  });
}
