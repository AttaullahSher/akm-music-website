#!/usr/bin/env node
/**
 * Generate a product feed (CSV) for Meta Commerce Manager (Facebook/Instagram
 * Shops) and Google Merchant Center from products.json.
 *
 * Output: products-feed.csv at the repo root, served at
 *   https://www.akm-music.com/products-feed.csv
 * Point Meta/Google at that URL as a scheduled data feed.
 *
 * Run: node scripts/generate-product-feed.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://www.akm-music.com';

const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'products.json'), 'utf8'));
const products = data.products || [];

// CSV columns understood by BOTH Meta and Google feeds.
// quantity_to_sell_on_facebook is Meta-specific (required for Shops checkout);
// Google ignores unknown columns.
const headers = [
  'id', 'title', 'description', 'availability', 'condition',
  'price', 'link', 'image_link', 'brand', 'gtin', 'product_type',
  'quantity_to_sell_on_facebook'
];

// In-stock quantity to advertise on the Facebook/Instagram shop. We don't track
// live counts, so any healthy number ≥1 satisfies Meta's "missing quantity" rule.
const IN_STOCK_QTY = 25;

// GS1 mod-10 checksum validation. Meta/Google warn on malformed GTINs, so we
// only emit a GTIN when it is genuinely valid; otherwise leave it blank.
function validGtin(g) {
  g = String(g == null ? '' : g).trim();
  if (!/^\d+$/.test(g) || ![8, 12, 13, 14].includes(g.length)) return false;
  const digits = g.split('').map(Number);
  const check = digits.pop();
  const sum = digits.reverse().reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check;
}

// Convert SHOUTING ALL-CAPS words to Title Case while preserving model codes
// that contain digits (E2, GRX70) and short tokens (C, P, CT).
function smartTitle(s) {
  return String(s).split(/\s+/).map(w => {
    if (/\d/.test(w) || w.length <= 2) return w;
    if (w === w.toUpperCase()) return w.charAt(0) + w.slice(1).toLowerCase();
    return w;
  }).join(' ');
}

const csvCell = v => {
  const s = String(v == null ? '' : v).replace(/\s+/g, ' ').trim();
  return '"' + s.replace(/"/g, '""') + '"';
};

const rows = [headers.join(',')];
let written = 0;

for (const p of products) {
  if (!p.id || !p.name || !(p.price > 0)) continue;
  const inStock = p.inStock !== false;
  const title = smartTitle(p.name).slice(0, 150);
  const brand = smartTitle(p.brand || 'AKM Music');
  const category = (p.categoryPath && p.categoryPath.join(' > ')) || p.category || 'Musical Instruments';
  const description =
    `${title} by ${brand}. ${category}. Available at AKM Music Abu Dhabi — ` +
    `delivery across the UAE, WhatsApp ordering, showroom support since 1984.`;
  const image = /^https?:\/\//.test(p.image) ? p.image : `${SITE}/${String(p.image).replace(/^\//, '')}`;
  const row = [
    p.id,
    title,
    description,
    inStock ? 'in stock' : 'out of stock',
    'new',
    `${Number(p.price).toFixed(2)} ${p.currency || 'AED'}`,
    `${SITE}/shop.html?product=${encodeURIComponent(p.id)}`,
    image,
    brand,
    validGtin(p.gtin) ? String(p.gtin).trim() : '',
    category,
    inStock ? IN_STOCK_QTY : 0
  ].map(csvCell);
  rows.push(row.join(','));
  written++;
}

const out = path.join(ROOT, 'products-feed.csv');
fs.writeFileSync(out, rows.join('\n') + '\n', 'utf8');
console.log(`Wrote ${written} products to ${out}`);
