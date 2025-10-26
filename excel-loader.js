// Advanced Excel Loader with Smart Image Handling
// Priority: Local Category Folder → Description URL → Broken Image Icon

(function() {
    'use strict';

    // Skip Excel network fetch under file:// to avoid CORS errors; keep dataset empty (Excel-only policy)
    if (location.protocol === 'file:') {
        console.info('[Excel Loader] file:// detected. Skipping Excel fetch. Start a local server to load products from Excel.');
        window.productsData = {};
        window.productsDataReady = Promise.resolve();
        try { window.dispatchEvent(new Event('products-data-ready')); } catch {}
        return;
    }

    console.log('[Excel Loader] Starting initialization...');

    // Wait for XLSX library to be available
    function waitForXLSX(maxAttempts = 50) {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const checkXLSX = () => {
                attempts++;
                if (typeof XLSX !== 'undefined') {
                    console.log('[Excel Loader] XLSX library detected, starting load...');
                    resolve();
                } else if (attempts >= maxAttempts) {
                    reject(new Error('XLSX library not found after ' + maxAttempts + ' attempts'));
                } else {
                    setTimeout(checkXLSX, 100);
                }
            };
            checkXLSX();
        });
    }

    // Smart image resolver with priority system
    function resolveProductImage(product, category) {
        // Priority 1: Use local category folder path (image existence handled by <img onerror> fallback in products.js)
        const categoryFolder = `assets/Products_images/${category}`;
        const localImagePath = `${categoryFolder}/${product.id || product.sku}.jpg`;
        return localImagePath;
    }

    // Load Excel file and process products
    async function loadExcelData() {
        try {
            console.log('[Excel Loader] Starting to fetch Products_List.xlsx...');

            const response = await fetch('assets/Products_List.xlsx');
            if (!response.ok) {
                throw new Error('Failed to fetch Excel file: ' + response.status);
            }

            const arrayBuffer = await response.arrayBuffer();
            console.log('[Excel Loader] File fetched, parsing workbook...');

            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            // Prefer the exact sheet name 'Music Stock' if present
            const preferredSheet = workbook.SheetNames.find(n => (n||'').trim().toLowerCase() === 'music stock');
            const sheetName = preferredSheet || workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            console.log('[Excel Loader] Workbook parsed, converting to JSON...');
            const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                header: 1,
                defval: ''
            });

            if (!Array.isArray(jsonData) || jsonData.length === 0) {
                throw new Error('Empty or invalid worksheet data');
            }

            console.log('[Excel Loader] Processing data...');
            const headers = Array.isArray(jsonData[0]) ? jsonData[0] : [];
            const rows = jsonData.slice(1);

            console.log('[Excel Loader] Total rows in sheet:', rows.length);
            console.log('[Excel Loader] First row columns:', headers);

            // Map column headers to standard names
            const columnMap = {
                'ID/SKU': ['SKU', 'Id', 'ID', 'Code', 'Product ID'],
                'Name': ['Name', 'Product', 'Product Name', 'Title'],
                'Brand': ['Brand', 'Manufacturer', 'Make'],
                'Category': ['Category', 'Cat', 'Type', 'Group'],
                'Price': ['Price', 'Price (AED)', 'Price AED', 'Unit Price', 'Price (USD)'],
                'Description': ['Description', 'Desc', 'Details'],
                'Stock': ['Stock', 'Availability', 'In Stock'],
                'Featured': ['Featured', 'IsFeatured']
            };

            // Find column indices safely
            const colIndices = {};
            for (const [standardName, possibleNames] of Object.entries(columnMap)) {
                colIndices[standardName] = headers.findIndex(h => {
                    const hh = (h == null ? '' : String(h)).trim().toLowerCase();
                    return possibleNames.some(name => hh.includes(String(name).toLowerCase()));
                });
            }

            console.log('[Excel Loader] Column mapping:', colIndices);

            // Process products
            const productsByCategory = {};
            let processedCount = 0;
            let skippedCount = 0;

            for (const row of rows) {
                if (!Array.isArray(row) || row.length === 0 || row.every(cell => !cell && cell !== 0)) {
                    skippedCount++;
                    continue;
                }

                const rawPrice = colIndices['Price'] >= 0 ? row[colIndices['Price']] : '';
                const normalizedPrice = typeof rawPrice === 'number' ? rawPrice : parseFloat(String(rawPrice).replace(/[,\sAED$€£]/gi, '').replace(/[^0-9.\-]/g, ''));

                const product = {
                    id: colIndices['ID/SKU'] >= 0 ? (row[colIndices['ID/SKU']] || '') : '',
                    name: colIndices['Name'] >= 0 ? (row[colIndices['Name']] || '') : '',
                    brand: colIndices['Brand'] >= 0 ? (row[colIndices['Brand']] || '') : '',
                    category: colIndices['Category'] >= 0 ? (row[colIndices['Category']] || 'Uncategorized') : 'Uncategorized',
                    price: isNaN(normalizedPrice) ? 0 : Number(normalizedPrice),
                    description: colIndices['Description'] >= 0 ? (row[colIndices['Description']] || '') : '',
                    stock: colIndices['Stock'] >= 0 ? (row[colIndices['Stock']] || 'Out of Stock') : 'Out of Stock',
                    featured: (() => {
                        const v = colIndices['Featured'] >= 0 ? row[colIndices['Featured']] : false;
                        return v === true || v === 'TRUE' || v === 'True' || v === 1 || v === '1';
                    })()
                };

                // Skip products without ID/SKU
                if (!product.id) {
                    skippedCount++;
                    continue;
                }

                // Resolve image using priority system
                product.image = resolveProductImage(product, product.category);

                if (!productsByCategory[product.category]) {
                    productsByCategory[product.category] = [];
                }

                productsByCategory[product.category].push(product);
                processedCount++;
            }

            console.log(`[Excel Loader] Processed: ${processedCount} products, Skipped: ${skippedCount} rows (no SKU)`);

            // Set global products data
            window.productsData = productsByCategory;
            window.productsDataReady = Promise.resolve();

            // Log categories
            const categories = Object.keys(productsByCategory);
            console.log(`[Excel Loader] ✅ SUCCESS! Loaded ${processedCount} products across ${categories.length} categories`);
            console.log('[Excel Loader] Categories:', categories.join(', '));

            // Dispatch custom event for other scripts
            window.dispatchEvent(new CustomEvent('productsDataLoaded', {
                detail: { productsData: productsByCategory, count: processedCount }
            }));
            // Also dispatch the standardized event used by products.js
            window.dispatchEvent(new Event('products-data-ready'));

        } catch (error) {
            console.error('[Excel Loader] ❌ ERROR:', error);
            // Fallback to empty data (Excel-only policy)
            window.productsData = {};
            window.productsDataReady = Promise.resolve();
            try { window.dispatchEvent(new Event('products-data-ready')); } catch {}
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    async function init() {
        try {
            await waitForXLSX();
            await loadExcelData();
        } catch (error) {
            console.error('[Excel Loader] Initialization failed:', error);
            // Fallback
            window.productsData = {};
            window.productsDataReady = Promise.resolve();
            try { window.dispatchEvent(new Event('products-data-ready')); } catch {}
        }
    }

})();
