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
    for (const name of ['listings', 'own', 'featured', 'orders', 'bookings']) {
      document.getElementById('panel-' + name).style.display = tab.dataset.tab === name ? 'block' : 'none';
    }
    if (tab.dataset.tab === 'orders') loadRecords('orders', 'ordersList');
    if (tab.dataset.tab === 'bookings') loadRecords('bookings', 'bookingsList');
    if (tab.dataset.tab === 'own') renderOwn();
    if (tab.dataset.tab === 'featured') renderFeatured();
  }));

  // ---------- listings ----------
  const OWNDOC = doc(db, 'siteConfig', 'ownProducts');
  const SUBCATEGORIES = ['Acoustic Guitars','Classical & Flamenco','Electric Guitars','Bass Guitars','Ukulele, Violin & Folk','Guitar Pickups','Acoustic Pianos','Digital Pianos','Keyboards & Synths','Keyboard Stands & Benches','Drum Kits','Cymbals','Snares & Toms','Drum Heads','Pedals & Hardware','Sticks & Brushes','Hand Percussion','Drum Bags & Cases','Guitar Amplifiers','Bass Amplifiers','Drum & Keyboard Amps','Pedals & Effects','PA Speakers','Mixers','Recording Gear','Headphones','Stands, Cables & Wireless','Harmonicas','Melodicas & Recorders','Reeds & Accessories','Guitar Strings','Violin & Oud Strings','Picks & Capos','Straps & Stands','Cases & Bags','Tuners & Metronomes','Care, Parts & Tools','Merch & Gifts','General Accessories'];
  let products = [];
  let ownProducts = [];
  let ov = { disabledIds: {}, disabledCategories: [], disabledBrands: [], featuredIds: [] };
  let shown = 60;
  let started = false;

  async function start() {
    if (started) return;
    started = true;
    const [res, snap, ownSnap] = await Promise.all([
      fetch('products.json?v=' + Date.now(), { cache: 'no-cache' }),
      getDoc(CATALOG),
      getDoc(OWNDOC)
    ]);
    products = (await res.json()).products;
    if (snap.exists()) {
      const d = snap.data();
      ov = {
        disabledIds: d.disabledIds || {},
        disabledCategories: d.disabledCategories || [],
        disabledBrands: d.disabledBrands || [],
        featuredIds: d.featuredIds || []
      };
    } else {
      await setDoc(CATALOG, { disabledIds: {}, disabledCategories: [], disabledBrands: [], featuredIds: [] });
    }
    ownProducts = ownSnap.exists() ? (ownSnap.data().products || []) : [];
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
