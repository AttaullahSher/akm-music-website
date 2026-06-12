# Firebase Backend Setup — AKM Music Website

One-time setup, ~5 minutes. Sign in to Google as **sales@akm-music.com** for
every step so the website, POS, Firebase and Gemini all live on the same
Workspace account. The website works fine before this is done — Firebase
features simply stay dormant.

## What you get after setup

| Feature | Where |
|---|---|
| Every website checkout saved as an order | `admin.html` → Orders tab |
| Every repair / class / studio / rental booking saved | `admin.html` → Bookings tab |
| Enable/disable any product, category or brand on the shop | `admin.html` → Listings tab |
| "Ask AKM" Gemini shopping assistant on the shop page | shop.html (appears automatically) |

WhatsApp checkout is unchanged — Firestore only *records* the order before
WhatsApp opens.

## Steps

1. **Open the Firebase console** — https://console.firebase.google.com
   (as sales@akm-music.com). **Recommended: select your existing AKM-POS
   project** so website orders land next to your POS data. Creating a separate
   project also works.

2. **Register a web app** — Project settings (gear) → General → *Your apps* →
   Add app → Web (`</>`) → name it `AKM Website`. Copy the `firebaseConfig`
   object it shows.

3. **Paste the config** — open `firebase-config.js` in this repo, replace
   `window.AKM_FIREBASE_CONFIG = null;` with your object (the file has an
   example). If you use the AKM-POS project, this is the same object as
   `FIREBASE_CONFIG` in the POS `config.js`.

4. **Enable Firestore** — Build → Firestore Database → Create database →
   production mode → region `me-central1` (or `europe-west1`).
   *(Skip if the POS project already has Firestore.)*

5. **Security rules** — Firestore → Rules:
   - **Fresh project:** paste the whole `firestore.rules` file → Publish.
   - **Shared with POS:** add only the `siteConfig`, `orders` and `bookings`
     match blocks into your existing rules (do NOT paste the catch-all deny
     block — it would lock out the POS).

6. **Google sign-in for admin** — Build → Authentication → Get started →
   Sign-in method → enable **Google**. Then Authentication → Settings →
   Authorized domains → add `www.akm-music.com` and `akm-music.com`.

7. **Gemini assistant (optional)** — Build → **AI Logic** → Get started →
   choose **Gemini Developer API** (free tier). No key goes in the code;
   Firebase handles it. To skip the assistant, set
   `window.AKM_AI_ENABLED = false;` in `firebase-config.js`.

8. **Commit & deploy** — commit the edited `firebase-config.js`, merge to
   main. Open `https://www.akm-music.com/admin.html`, sign in with
   sales@akm-music.com, and you're in business.

## Costs

All of this fits comfortably in Firebase's free tier:
- Shop visitors cost **1 Firestore read each** (the catalog-overrides doc) —
  free quota is 50,000/day.
- Orders/bookings are writes — free quota 20,000/day.
- Gemini Developer API free tier covers a small shop's assistant traffic.

## Admin access

Only emails listed in **both** places can use admin.html:
- `window.AKM_ADMIN_EMAILS` in `firebase-config.js` (client-side gate)
- the email list inside `isAdmin()` in `firestore.rules` (server-side, the
  one that actually matters)

To add a staff member, add their Google email to both and republish the rules.
