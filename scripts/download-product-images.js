#!/usr/bin/env node
/**
 * Downloads product images referenced in products.json into assets/products/
 * and rewrites each product's `image` field to the local path. The original
 * supplier URL is kept in `imageLarge` for the high-res modal view (the modal
 * falls back to the local copy if the remote fails).
 *
 * Usage: node scripts/download-product-images.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CATALOG = path.join(ROOT, 'products.json');
const OUT_DIR = path.join(ROOT, 'assets', 'products');
const CONCURRENCY = 12;
const RETRIES = 3;

const EXT_BY_TYPE = { 'image/webp': '.webp', 'image/jpeg': '.jpg', 'image/png': '.png', 'image/gif': '.gif' };

async function download(url, attempt = 1) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'AKM-Music-Catalog-Sync/1.0 (dealer; sales@akm-music.com)' },
      signal: AbortSignal.timeout(30000)
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const type = (res.headers.get('content-type') || '').split(';')[0].trim();
    const buf = Buffer.from(await res.arrayBuffer());
    return { buf, ext: EXT_BY_TYPE[type] || '.img' };
  } catch (err) {
    if (attempt < RETRIES) {
      await new Promise(r => setTimeout(r, 1000 * attempt));
      return download(url, attempt + 1);
    }
    throw err;
  }
}

async function main() {
  const data = JSON.parse(fs.readFileSync(CATALOG, 'utf8'));
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const existing = new Set(fs.readdirSync(OUT_DIR));
  let done = 0, downloaded = 0, skipped = 0, failed = 0;
  let cursor = 0;
  const products = data.products;

  async function worker() {
    while (cursor < products.length) {
      const p = products[cursor++];
      const already = ['.webp', '.jpg', '.png', '.gif'].map(e => p.id + e).find(f => existing.has(f));
      if (already) {
        p.image = 'assets/products/' + already;
        skipped++;
      } else {
        const remote = `https://www.harmonyhouse.ae/web/image/product.template/${p.id}/image_512`;
        try {
          const { buf, ext } = await download(remote);
          if (buf.length < 100) throw new Error('empty image');
          fs.writeFileSync(path.join(OUT_DIR, p.id + ext), buf);
          p.image = 'assets/products/' + p.id + ext;
          downloaded++;
        } catch (err) {
          failed++; // keep whatever image URL the product already has
        }
      }
      done++;
      if (done % 150 === 0) console.log(`progress ${done}/${products.length} (new: ${downloaded}, cached: ${skipped}, failed: ${failed})`);
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  fs.writeFileSync(CATALOG, JSON.stringify(data));
  console.log(`\nDone. new: ${downloaded}, cached: ${skipped}, failed: ${failed}`);
  console.log('IMAGES_COMPLETE');
}

main().catch(err => { console.error('IMAGES_FAILED', err); process.exit(1); });
