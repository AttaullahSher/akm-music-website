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
    for (const name of ['listings', 'orders', 'bookings']) {
      document.getElementById('panel-' + name).style.display = tab.dataset.tab === name ? 'block' : 'none';
    }
    if (tab.dataset.tab === 'orders') loadRecords('orders', 'ordersList');
    if (tab.dataset.tab === 'bookings') loadRecords('bookings', 'bookingsList');
  }));

  // ---------- listings ----------
  let products = [];
  let ov = { disabledIds: {}, disabledCategories: [], disabledBrands: [] };
  let shown = 60;
  let started = false;

  async function start() {
    if (started) return;
    started = true;
    const [res, snap] = await Promise.all([
      fetch('products.json?v=' + Date.now(), { cache: 'no-cache' }),
      getDoc(CATALOG)
    ]);
    products = (await res.json()).products;
    if (snap.exists()) {
      const d = snap.data();
      ov = {
        disabledIds: d.disabledIds || {},
        disabledCategories: d.disabledCategories || [],
        disabledBrands: d.disabledBrands || []
      };
    } else {
      await setDoc(CATALOG, { disabledIds: {}, disabledCategories: [], disabledBrands: [] });
    }
    const cats = [...new Set(products.map(p => p.category))].sort();
    document.getElementById('adminCatFilter').innerHTML =
      '<option value="">All categories</option>' + cats.map(c => `<option>${esc(c)}</option>`).join('');
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
