#!/usr/bin/env node
/**
 * AKM Music — Supplier Catalog Sync
 *
 * Pulls the full product catalog from the supplier's storefront sitemap,
 * extracts structured data (JSON-LD) from each product page, and writes
 * a normalized products.json used by shop.html.
 *
 * Usage:  node scripts/sync-supplier-catalog.js [--limit N] [--out path]
 *
 * Prices are kept identical to the supplier's public retail prices
 * (AKM margin = dealer discount). No supplier branding is stored beyond
 * the source id needed for re-sync.
 */

const fs = require('fs');
const path = require('path');

const BASE = 'https://www.harmonyhouse.ae';
const SITEMAP = BASE + '/sitemap.xml';
const CONCURRENCY = 8;
const RETRIES = 3;
const OUT = getArg('--out') || path.join(__dirname, '..', 'products.json');
const LIMIT = parseInt(getArg('--limit') || '0', 10);

function getArg(name) {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : null;
}

async function fetchText(url, attempt = 1) {
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      headers: { 'User-Agent': 'AKM-Music-Catalog-Sync/1.0 (dealer; sales@akm-music.com)' },
      signal: AbortSignal.timeout(30000)
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.text();
  } catch (err) {
    if (attempt < RETRIES) {
      await new Promise(r => setTimeout(r, 1000 * attempt));
      return fetchText(url, attempt + 1);
    }
    throw err;
  }
}

function extractJsonLd(html) {
  const blocks = [];
  const re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(html))) {
    try {
      const parsed = JSON.parse(m[1]);
      if (Array.isArray(parsed)) blocks.push(...parsed);
      else blocks.push(parsed);
    } catch (_) { /* skip malformed blocks */ }
  }
  return blocks;
}

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// First word of the product name is the brand; expand known multi-word marks.
const BRAND_MAP = {
  'ERNIE': 'ERNIE BALL',
  'DADDARIO': "D'ADDARIO",
  'LABELLA': 'LA BELLA',
  'PLANET': 'PLANET WAVES',
  'AL': 'ALHAMBRA',
  'VIC': 'VIC FIRTH'
};

function parseProduct(url, html) {
  const ld = extractJsonLd(html);
  const product = ld.find(b => b['@type'] === 'Product');
  if (!product || !product.offers) return null;

  const crumbs = ld.find(b => b['@type'] === 'BreadcrumbList');
  // Breadcrumb: [All Products, ...category path..., product name]
  let categoryPath = [];
  if (crumbs && Array.isArray(crumbs.itemListElement)) {
    categoryPath = crumbs.itemListElement
      .slice(1, -1)
      .map(c => c.name)
      .filter(Boolean);
  }

  // Source template id is the trailing number of the shop URL — kept for re-sync.
  const idMatch = url.match(/-(\d+)$/);
  const sourceId = idMatch ? idMatch[1] : slugify(product.name);

  const name = String(product.name || '').trim();
  let brand = (name.match(/^[A-Za-z'&.]+/) || [''])[0].toUpperCase();
  brand = BRAND_MAP[brand] || brand;

  return {
    id: sourceId,
    name,
    brand,
    category: categoryPath[categoryPath.length - 1] || 'Other',
    categoryPath,
    price: Math.round(Number(product.offers.price) * 100) / 100,
    currency: product.offers.priceCurrency || 'AED',
    inStock: !/OutOfStock/i.test(String(product.offers.availability || '')),
    image: `${BASE}/web/image/product.template/${sourceId}/image_512`,
    imageLarge: `${BASE}/web/image/product.template/${sourceId}/image_1024`,
    gtin: product.gtin || null
  };
}

async function main() {
  console.log('Fetching sitemap…');
  const xml = await fetchText(SITEMAP);
  let urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map(m => m[1])
    .filter(u => u.includes('/shop/') && !u.includes('/shop/category'));
  if (LIMIT) urls = urls.slice(0, LIMIT);
  console.log(`${urls.length} product pages to fetch (concurrency ${CONCURRENCY})`);

  const products = [];
  const failed = [];
  let done = 0;
  let cursor = 0;

  async function worker() {
    while (cursor < urls.length) {
      const url = urls[cursor++];
      try {
        const html = await fetchText(url);
        const p = parseProduct(url, html);
        if (p) products.push(p);
        else failed.push({ url, reason: 'no product json-ld' });
      } catch (err) {
        failed.push({ url, reason: String(err.message || err) });
      }
      done++;
      if (done % 100 === 0) console.log(`progress ${done}/${urls.length} (ok: ${products.length})`);
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  products.sort((a, b) => a.name.localeCompare(b.name));
  const categories = {};
  for (const p of products) categories[p.category] = (categories[p.category] || 0) + 1;

  const payload = {
    updated: new Date().toISOString(),
    count: products.length,
    currency: 'AED',
    products
  };
  fs.writeFileSync(OUT, JSON.stringify(payload));
  console.log(`\nWrote ${products.length} products to ${OUT}`);
  console.log(`Failed: ${failed.length}`);
  if (failed.length) {
    fs.writeFileSync(OUT.replace(/\.json$/, '.failed.json'), JSON.stringify(failed, null, 2));
  }
  console.log('Top categories:', Object.entries(categories).sort((a, b) => b[1] - a[1]).slice(0, 15));
  console.log('SYNC_COMPLETE');
}

main().catch(err => { console.error('SYNC_FAILED', err); process.exit(1); });
