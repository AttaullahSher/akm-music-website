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
const headers = [
  'id', 'title', 'description', 'availability', 'condition',
  'price', 'link', 'image_link', 'brand', 'gtin', 'product_type'
];

const csvCell = v => {
  const s = String(v == null ? '' : v).replace(/\s+/g, ' ').trim();
  return '"' + s.replace(/"/g, '""') + '"';
};

const rows = [headers.join(',')];
let written = 0;

for (const p of products) {
  if (!p.id || !p.name || !(p.price > 0)) continue;
  const title = p.name.slice(0, 150);
  const brand = p.brand || 'AKM Music';
  const category = (p.categoryPath && p.categoryPath.join(' > ')) || p.category || 'Musical Instruments';
  const description =
    `${p.name} by ${brand}. ${category}. Available at AKM Music Abu Dhabi — ` +
    `delivery across the UAE, WhatsApp ordering, showroom support since 1984.`;
  const image = /^https?:\/\//.test(p.image) ? p.image : `${SITE}/${String(p.image).replace(/^\//, '')}`;
  const row = [
    p.id,
    title,
    description,
    p.inStock === false ? 'out of stock' : 'in stock',
    'new',
    `${Number(p.price).toFixed(2)} ${p.currency || 'AED'}`,
    `${SITE}/shop.html?product=${encodeURIComponent(p.id)}`,
    image,
    brand,
    p.gtin || '',
    category
  ].map(csvCell);
  rows.push(row.join(','));
  written++;
}

const out = path.join(ROOT, 'products-feed.csv');
fs.writeFileSync(out, rows.join('\n') + '\n', 'utf8');
console.log(`Wrote ${written} products to ${out}`);
