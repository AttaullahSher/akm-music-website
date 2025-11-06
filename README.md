# AKM Music Website

Professional music store website for AKM Music Abu Dhabi.

## 🚀 Quick Start

1. Open `index.html` in a web browser
2. Or use Live Server for development

## 🧹 Clear Browser Cache (Important!)

If you see **CSS 404 errors** or old styles:

### EMERGENCY FIX (Fastest):
1. Open DevTools (`F12`)
2. Go to **Console** tab
3. Copy and paste this entire script:
```javascript
if('serviceWorker' in navigator){navigator.serviceWorker.getRegistrations().then(r=>{r.forEach(reg=>reg.unregister())})}if('caches' in window){caches.keys().then(n=>{n.forEach(name=>caches.delete(name))})}localStorage.clear();sessionStorage.clear();location.reload(true);
```
4. Press Enter
5. Wait for page reload

### Method 1: Hard Refresh
- **Chrome/Edge**: `Ctrl + Shift + R` or `Ctrl + F5`
- **Firefox**: `Ctrl + Shift + R` or `Ctrl + F5`
- **Safari**: `Cmd + Shift + R`

### Method 2: Clear Site Data
1. Open DevTools (`F12`)
2. Go to **Application** tab
3. Click **Clear storage**
4. Check all boxes
5. Click **Clear site data**

### Method 3: Unregister Service Worker
1. Open DevTools (`F12`)
2. Go to **Application** → **Service Workers**
3. Click **Unregister**
4. Refresh the page

## 📁 File Structure

```
├── index.html              # Home page
├── tools.html              # Music tools page
├── blog.html               # Blog listing
├── about.html              # About page
├── contact.html            # Contact page
├── gallery.html            # Photo gallery
├── 404.html                # Error page
├── master-design.css       # Main styles
├── tools-master.css        # Tools page styles
├── fixes.css               # Design consistency fixes
├── script.js               # Main JavaScript
├── tools.js                # Tools functionality
├── service-worker.js       # PWA offline support
└── assets/                 # Images and icons
```

## 🎨 Design System

- **Primary Color**: `#1e88e5` (Blue)
- **Font**: Montserrat
- **Header**: Fixed white background
- **Active Nav**: Blue underline (desktop)

## 🔧 Development

- Cache version: `v=20251108b`
- Service Worker: `v4.0.0`
- No build tools required
- Pure HTML/CSS/JS

## 📝 Notes

- All markdown documentation files have been removed
- Legacy CSS files moved to `css_backup_legacy/`
- Service worker aggressively clears old caches on update
