// AKM Music — Firebase backend bridge
//
// Lazy-loads the Firebase modular SDK from CDN only when a config is present
// in firebase-config.js. Exposes a small promise-based API on window.AKM:
//
//   AKM.ready                       → resolves true when Firebase is usable
//   AKM.getCatalogOverrides()       → { disabledIds, disabledCategories, disabledBrands }
//   AKM.saveOrder(order)            → fire-and-forget order capture
//   AKM.saveBooking(booking)        → fire-and-forget booking capture
//   AKM.askGemini(prompt)           → Gemini answer string (AI Logic)
//
// Everything fails soft: if Firebase is unconfigured or unreachable, callers
// get nulls and the site (including WhatsApp checkout) behaves exactly as before.

(function () {
  'use strict';

  const SDK = 'https://www.gstatic.com/firebasejs/12.4.0/';
  const cfg = window.AKM_FIREBASE_CONFIG || null;

  const state = { app: null, db: null, fs: null, ai: null, model: null };

  async function init() {
    if (!cfg) return false;
    try {
      const [{ initializeApp }, fs] = await Promise.all([
        import(SDK + 'firebase-app.js'),
        import(SDK + 'firebase-firestore.js')
      ]);
      state.app = initializeApp(cfg);
      state.fs = fs;
      state.db = fs.getFirestore(state.app);
      return true;
    } catch (err) {
      console.warn('AKM backend unavailable:', err.message);
      return false;
    }
  }

  const ready = init();

  async function getCatalogOverrides() {
    if (!(await ready)) return null;
    try {
      const snap = await state.fs.getDoc(state.fs.doc(state.db, 'siteConfig', 'catalog'));
      if (!snap.exists()) return null;
      const d = snap.data();
      return {
        disabledIds: d.disabledIds || {},
        disabledCategories: d.disabledCategories || [],
        disabledBrands: d.disabledBrands || [],
        featuredIds: d.featuredIds || [],
        homeBrands: d.homeBrands || [],
        supplierEnabled: d.supplierEnabled !== false
      };
    } catch (err) {
      console.warn('overrides unavailable:', err.message);
      return null;
    }
  }

  // AKM's own products, managed in admin.html — stored as one document
  // (siteConfig/ownProducts) so every shopper costs a single read.
  async function getOwnProducts() {
    if (!(await ready)) return [];
    try {
      const snap = await state.fs.getDoc(state.fs.doc(state.db, 'siteConfig', 'ownProducts'));
      return snap.exists() ? (snap.data().products || []) : [];
    } catch (err) {
      console.warn('own products unavailable:', err.message);
      return [];
    }
  }

  // Blog posts written from admin.html — one document, newest first.
  async function getBlogPosts() {
    if (!(await ready)) return [];
    try {
      const snap = await state.fs.getDoc(state.fs.doc(state.db, 'siteConfig', 'blog'));
      return snap.exists() ? (snap.data().posts || []) : [];
    } catch (err) {
      console.warn('blog posts unavailable:', err.message);
      return [];
    }
  }

  // Home banners managed from admin.html — fallback to the bundled SVGs.
  async function getBanners() {
    if (!(await ready)) return [];
    try {
      const snap = await state.fs.getDoc(state.fs.doc(state.db, 'siteConfig', 'banners'));
      return snap.exists() ? (snap.data().banners || []) : [];
    } catch (err) {
      console.warn('banners unavailable:', err.message);
      return [];
    }
  }

  async function saveOrder(order) {
    if (!(await ready)) return null;
    try {
      const ref = await state.fs.addDoc(state.fs.collection(state.db, 'orders'), {
        ...order,
        status: 'new',
        source: 'website',
        createdAt: state.fs.serverTimestamp()
      });
      return ref.id;
    } catch (err) {
      console.warn('order capture failed:', err.message);
      return null;
    }
  }

  async function saveBooking(booking) {
    if (!(await ready)) return null;
    try {
      const ref = await state.fs.addDoc(state.fs.collection(state.db, 'bookings'), {
        ...booking,
        status: 'new',
        source: 'website',
        createdAt: state.fs.serverTimestamp()
      });
      return ref.id;
    } catch (err) {
      console.warn('booking capture failed:', err.message);
      return null;
    }
  }

  async function askGemini(prompt) {
    if (!window.AKM_AI_ENABLED || !(await ready)) return null;
    try {
      if (!state.model) {
        const aiMod = await import(SDK + 'firebase-ai.js');
        state.ai = aiMod.getAI(state.app, { backend: new aiMod.GoogleAIBackend() });
        state.model = aiMod.getGenerativeModel(state.ai, { model: 'gemini-2.5-flash' });
      }
      const result = await state.model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      console.warn('Gemini unavailable:', err.message);
      return null;
    }
  }

  window.AKM = { ready, getCatalogOverrides, getOwnProducts, getBlogPosts, getBanners, saveOrder, saveBooking, askGemini };
})();
