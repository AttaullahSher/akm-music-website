// AKM Music — Firebase configuration
//
// ▸ ONE-TIME SETUP (5 minutes, do this signed in as sales@akm-music.com):
//   1. Open https://console.firebase.google.com → use your EXISTING AKM-POS
//      project (recommended, keeps website + POS together) or create one.
//   2. Project settings (gear icon) → General → "Your apps" → Web app (</>)
//      → Register app "AKM Website" → copy the firebaseConfig object below.
//   3. Build → Firestore Database → Create (production mode, region: me-central1
//      or europe-west1) — skip if the POS project already has Firestore.
//   4. Build → Authentication → Sign-in method → enable Google.
//      Authentication → Settings → Authorized domains → add www.akm-music.com
//   5. Firestore → Rules → paste the contents of firestore.rules from this
//      repo → Publish.
//   6. Paste the config below (replace null), commit, deploy. Done.
//
// The website works perfectly without this — Firebase features simply stay
// dormant until the config is filled in. WhatsApp checkout never depends on it.
//
// TIP: this is the same object as FIREBASE_CONFIG in your AKM-POS config.js —
// you can copy it from there if you use the same project.

window.AKM_FIREBASE_CONFIG = null;
/* Example:
window.AKM_FIREBASE_CONFIG = {
  apiKey: "AIza................",
  authDomain: "akm-pos.firebaseapp.com",
  projectId: "akm-pos",
  storageBucket: "akm-pos.firebasestorage.app",
  messagingSenderId: "................",
  appId: "1:................:web:................"
};
*/

// Who can open admin.html and edit listings/orders (must match firestore.rules)
window.AKM_ADMIN_EMAILS = ['sales@akm-music.com'];

// "Ask AKM" Gemini shopping assistant on the shop page.
// Requires: Firebase console → Build → AI Logic → Get started (Gemini API).
window.AKM_AI_ENABLED = true;
