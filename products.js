// Enhanced Products page functionality with cart integration
document.addEventListener('DOMContentLoaded', async function() {
  let initialized = false;
  function initAfterData() {
    if (initialized) return;
    initialized = true;
    loadProductsFromData();
    initializeProducts();
    if (typeof initializePagination === 'function') {
      initializePagination();
    }
  }

  try {
    if (window.productsDataReady && typeof window.productsDataReady.then === 'function') {
      await window.productsDataReady;
    }
  } catch (e) {
    console.warn('Products Excel load failed, continuing without data.', e);
  }

  // If data is already present, init immediately; else wait for event
  if (window.productsData && Object.keys(window.productsData).length) {
    initAfterData();
  } else {
    const onReady = () => { window.removeEventListener('products-data-ready', onReady); initAfterData(); };
    window.addEventListener('products-data-ready', onReady);
    // Safety timeout to avoid hanging forever
    setTimeout(() => { if (!initialized) initAfterData(); }, 6000);
  }
});

// Resolve products dataset from Excel (preferred) or bundled JSON
function getProductsData() {
  // Always prefer window.productsData (set by excel-loader.js or products-data.js)
  if (window.productsData && Object.keys(window.productsData).length) {
    const totalProducts = Object.values(window.productsData).reduce((sum, arr) => sum + arr.length, 0);
    console.log('[Products] Using products data with', totalProducts, 'total products across', Object.keys(window.productsData).length, 'categories');
    return window.productsData;
  }
  console.warn('[Products] No product data found');
  return null;
}

// Load products from data source (clear any hardcoded items)
function loadProductsFromData() {
  const data = getProductsData();
  const productsGrid = document.getElementById('productsGrid');
  if (!productsGrid) return;
  
  if (!data || Object.keys(data).length === 0) {
    const isFile = location.protocol === 'file:';
    productsGrid.innerHTML = `<div style="background:#fff;border-radius:12px;padding:30px;box-shadow:0 4px 12px rgba(0,0,0,.1);text-align:center;max-width:600px;margin:40px auto;">
      <h2 style="color:#d32f2f;margin-bottom:15px;">❌ Products Not Loaded</h2>
      <p style="font-size:16px;line-height:1.6;margin-bottom:15px;">
        ${isFile 
          ? '<strong>File System Error:</strong> You are opening this page directly from the file system. Please run a local server:<br/><br/><code style="background:#f5f5f5;padding:8px;border-radius:4px;display:inline-block;">python -m http.server 8000</code><br/>or<br/><code style="background:#f5f5f5;padding:8px;border-radius:4px;display:inline-block;">npx serve</code><br/><br/>Then open: <code style="background:#f5f5f5;padding:8px;border-radius:4px;display:inline-block;">http://localhost:8000/products.html</code>' 
          : '<strong>Excel Loading Failed:</strong> Could not load products from <code>assets/Products_List.xlsx</code>.<br/><br/>Please ensure:<br/>• The Excel file exists at the correct path<br/>• The file contains a sheet named "Music Stock"<br/>• The XLSX library loaded successfully (check browser console)<br/>• Your internet connection is working (XLSX loads from CDN)'}
      </p>
      <p style="font-size:14px;color:#666;margin-top:20px;">Check the browser console (F12) for detailed error messages.</p>
    </div>`;
    return;
  }
  
  const existingCards = productsGrid.querySelectorAll('.product-card');
  existingCards.forEach(card => card.remove());
}

// Render individual product card
function renderProductCard(product, container) {
  const card = document.createElement('div');
  card.className = 'product-card';
  card.setAttribute('data-category', product.category);

  const productImage = product.image || 'assets/Products_images/DEMO001.jpg';
  const finalImage = (/^https?:\/\//i.test(productImage)) ? productImage : productImage;
  const price = product.price || 0;
  const priceDisplay = price > 0 ? `${price.toLocaleString('en-AE')} AED` : 'Price on Request';

  // Build compact, uniform card per spec: square image, top: SKU > brand > name, bottom: price left, cart icon right
  card.innerHTML = `
    <div class="product-image">
      <img src="${finalImage}" alt="${product.name || 'Product'}" loading="lazy"
           onerror="this.src='assets/Products_images/DEMO001.jpg'">
    </div>
    <div class="product-info">
      <div class="product-text">
        <h3 class="product-sku">${product.id || 'N/A'}</h3>
        <p class="product-brand">${product.brand || 'Brand'}</p>
        <p class="product-name">${product.name || 'Product Name'}</p>
      </div>
      <div class="product-footer">
        <span class="price-current">${priceDisplay}</span>
        <button class="btn-cart-icon" title="Add to Cart"
          onclick="addProductToCart('${product.id}', '${(product.name||'').replace(/'/g, "\\'")}', ${price}, '${finalImage}', '${product.brand || 'AKM Music'}')">
          <i class="fas fa-shopping-cart"></i>
        </button>
      </div>
    </div>
  `;

  container.appendChild(card);
}

// Build WhatsApp inquiry URL for a single product
function buildWhatsAppLink(product) {
  const number = '97126219929';
  const msg = `🎵 AKM Music Inquiry\n\nProduct: ${product.name}\nSKU: ${product.id}\nBrand: ${product.brand || ''}\nPrice: ${(product.price || 0)} AED\n\nPlease assist with availability and best offer.`;
  return `https://api.whatsapp.com/send?phone=${number}&text=${encodeURIComponent(msg)}`;
}

// Saved (wishlist) products helpers
function getSavedProducts() {
  try { return JSON.parse(localStorage.getItem('akm_wishlist')) || []; } catch { return []; }
}
function isProductSaved(id) { return getSavedProducts().includes(id); }
function toggleSaveProduct(id, name) {
  const saved = new Set(getSavedProducts());
  if (saved.has(id)) { saved.delete(id); }
  else { saved.add(id); }
  localStorage.setItem('akm_wishlist', JSON.stringify(Array.from(saved)));
  // Update any wishlist button for this id safely
  try {
    const selector = `.wishlist-btn[onclick*="${CSS.escape(id)}"]`;
    document.querySelectorAll(selector).forEach(btn=>btn.classList.toggle('saved'));
  } catch (e) {}
}

// Add product to cart
function addProductToCart(id, name, price, image, brand) {
  if (typeof cart !== 'undefined' && cart && typeof cart.addItem === 'function') {
    cart.addItem({
      sku: id,
      name: name || 'Product',
      price: parseFloat(price) || 0,
      image: image || 'assets/Products_images/DEMO001.jpg', // fallback
      brand: brand || 'AKM Music'
    });
  } else {
    console.warn('Cart not available, cannot add item:', id);
  }
}

// Initialize products functionality
function initializeProducts() {
  buildCategoryFilters();
  setupProductFiltering();
  setupProductModals();
  setupSearchFunctionality();
  setupSortingOptions();
  addProductAnimations();
  
  // Handle external navigation links
  if (window.location.hash === '#products') {
    document.querySelector('.products-section').scrollIntoView({
      behavior: 'smooth'
    });
  }
}

// Build category filters dynamically from data (preserve category names as-is)
function buildCategoryFilters() {
  const filterBar = document.querySelector('.products-filter');
  if (!filterBar) return;
  const data = getProductsData();
  if (!data) return;

  // Clear existing
  filterBar.innerHTML = '';

  // All Products button
  const allBtn = document.createElement('button');
  allBtn.className = 'filter-btn active';
  allBtn.dataset.category = 'all';
  allBtn.textContent = 'All Products';
  filterBar.appendChild(allBtn);

  // Create buttons for each category from Excel data
  const categories = Object.keys(data).sort();
  for (const cat of categories) {
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.dataset.category = cat; // exact string from Excel
    btn.textContent = cat;
    filterBar.appendChild(btn);
  }
}

// Enhanced product filtering with animations
function setupProductFiltering() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  const productCards = document.querySelectorAll('.product-card');
  
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons
      filterButtons.forEach(btn => btn.classList.remove('active'));
      // Add active class to clicked button
      button.classList.add('active');
      
      // Ensure the clicked button is clearly visible
      try {
        button.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        button.focus({ preventScroll: true });
      } catch (e) {}
      
      const category = button.getAttribute('data-category');
      // If pagination exists, reset to page 1 with the selected filter
      if (typeof renderPaginatedProducts === 'function') {
        renderPaginatedProducts(1);
      } else {
        filterProducts(category);
      }
    });
  });
}

// Filter products function (can be called externally)
function filterProducts(category) {
  const productCards = document.querySelectorAll('.product-card');
  let visibleCount = 0;
  const want = (category || 'all');
  productCards.forEach((card, index) => {
    const cat = card.getAttribute('data-category') || '';
    const match = want === 'all' || cat.toLowerCase() === want.toLowerCase();
    if (match) {
      setTimeout(() => {
        card.style.display = 'block';
        card.classList.add('fade-in-up');
      }, index * 100);
      visibleCount++;
    } else {
      card.style.display = 'none';
      card.classList.remove('fade-in-up');
    }
  });
  updateProductCount(visibleCount, want);
}

// Update product count display
function updateProductCount(count, category) {
  const countElement = document.getElementById('product-count');
  if (countElement) {
    const categoryName = category === 'all' ? 'products' : category;
    countElement.textContent = `Showing ${count} ${categoryName}`;
  }
}
  // Setup product modals and inquiries
function setupProductModals() {
  const inquiryButtons = document.querySelectorAll('.product-inquiry');
  const inquiryModal = document.getElementById('product-inquiry-modal');
  const inquiryProductName = document.getElementById('inquiry-product-name');
  const inquiryDescription = document.getElementById('product-inquiry-description');
  
  inquiryButtons.forEach(button => {
    button.addEventListener('click', () => {
      const productName = button.getAttribute('data-product');
      if (inquiryProductName) inquiryProductName.value = productName;
      if (inquiryDescription) inquiryDescription.textContent = `Get a personalized quote for ${productName}`;
      if (inquiryModal) inquiryModal.setAttribute('aria-hidden', 'false');
    });
  });
}

// Setup search functionality
function setupSearchFunctionality() {
  const searchInput = document.getElementById('productSearch');
  const searchClear = document.getElementById('searchClear');

  if (searchInput) {
    searchInput.addEventListener('input', function() {
      if (searchClear) {
        searchClear.style.display = this.value ? 'flex' : 'none';
      }
      // Debounce search to avoid excessive calls
      clearTimeout(searchInput._debounceTimer);
      searchInput._debounceTimer = setTimeout(searchProducts, 300);
    });
  }
  
  if (searchClear) {
    searchClear.addEventListener('click', function() {
      if (searchInput) {
        searchInput.value = '';
        this.style.display = 'none';
        searchProducts();
      }
    });
  }
}

// Search products function
function searchProducts() {
  const searchInput = document.getElementById('productSearch');
  const searchTerm = (searchInput ? searchInput.value : '').toLowerCase();
  const productCards = document.querySelectorAll('.product-card');
  let visibleCount = 0;
  
  productCards.forEach(card => {
    const title = card.querySelector('.product-name')?.textContent.toLowerCase() || '';
    const brand = card.querySelector('.product-brand')?.textContent.toLowerCase() || '';
    const sku = card.querySelector('.product-sku')?.textContent.toLowerCase() || '';
    const match = title.includes(searchTerm) || brand.includes(searchTerm) || sku.includes(searchTerm);
    card.style.display = match ? 'block' : 'none';
    if (match) visibleCount++;
  });
  
  updateProductCount(visibleCount, searchTerm ? 'search results' : 'products');
}

// Setup sorting options
function setupSortingOptions() {
  const sortSelect = document.getElementById('productSort');
  if (sortSelect) {
    sortSelect.addEventListener('change', sortProducts);
  }
}

// Sort products function
function sortProducts() {
  const sortValue = document.getElementById('productSort').value;
  const productsGrid = document.getElementById('productsGrid');
  const productCards = Array.from(productsGrid.querySelectorAll('.product-card'));
  
  productCards.sort((a, b) => {
    switch (sortValue) {
      case 'price-low':
        return getProductPrice(a) - getProductPrice(b);
      case 'price-high':
        return getProductPrice(b) - getProductPrice(a);
      case 'name':
        return a.querySelector('h3').textContent.localeCompare(b.querySelector('h3').textContent);
      case 'brand':
        return a.querySelector('.product-brand').textContent.localeCompare(b.querySelector('.product-brand').textContent);
      default:
        return 0;
    }
  });
  
  // Re-append sorted cards
  productCards.forEach(card => productsGrid.appendChild(card));
}

// Get product price for sorting
function getProductPrice(card) {
  const priceElement = card.querySelector('.price-current');
  if (priceElement) {
    const text = priceElement.textContent;
    if (text.includes('Price on Request')) return 0;
    const priceMatch = text.match(/[\d,]+/);
    return priceMatch ? parseInt(priceMatch[0].replace(/,/g, '')) : 0;
  }
  return 0;
}
// Add product animations and interactions
function addProductAnimations() {
  const productCards = document.querySelectorAll('.product-card');
  
  // Smooth scrolling to products section from external links
  if (window.location.hash === '#products') {
    document.querySelector('.products-section').scrollIntoView({
      behavior: 'smooth'
    });
  }
  
  // Add hover effects to product cards
  productCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-8px)';
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0)';
    });
  });
  
  // Lazy loading for product images
  const productImages = document.querySelectorAll('.product-image img');
  
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.getAttribute('src');
        img.classList.add('loaded');
        observer.unobserve(img);
      }
    });
  });
  
  productImages.forEach(img => {
    imageObserver.observe(img);
  });
}

// Add pagination at the end of products.js
let currentPage = 1;
const productsPerPage = 48; // show 48 products per page for 1000+ products
let allProductsArray = [];

// Initialize pagination
function initializePagination() {
  const data = getProductsData();
  if (!data) return;
  // Flatten all products
  allProductsArray = [];
  for (const category in data) {
    if (data[category] && Array.isArray(data[category])) {
      allProductsArray.push(...data[category].map(p => ({...p, category})));
    }
  }
  renderPaginatedProducts(1);
  createPaginationControls();
}

// Render products for current page
function renderPaginatedProducts(page) {
  currentPage = page;
  const productsGrid = document.getElementById('productsGrid');
  if (!productsGrid) return;
  productsGrid.innerHTML = '';
  const activeFilter = document.querySelector('.filter-btn.active');
  const activeCategory = activeFilter ? activeFilter.dataset.category : 'all';
  let filteredProducts = activeCategory === 'all' ?
    allProductsArray :
    allProductsArray.filter(p => (p.category || '').toLowerCase() === activeCategory.toLowerCase());
  const startIndex = (page - 1) * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
  paginatedProducts.forEach(product => { renderProductCard(product, productsGrid); });
  updatePaginationControls(filteredProducts.length);
  document.querySelector('.products-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Create pagination controls
function createPaginationControls() {
  const existingPagination = document.querySelector('.pagination-controls');
  if (existingPagination) return;

  const productsSection = document.querySelector('.products-section');
  if (!productsSection) return;

  const paginationDiv = document.createElement('div');
  paginationDiv.className = 'pagination-controls';
  paginationDiv.innerHTML = `
    <button class="pagination-btn" id="prevPage" onclick="changePage(-1)">
      <i class="fas fa-chevron-left"></i> Previous
    </button>
    <div class="pagination-info">
      Page <span id="currentPageNum">1</span> of <span id="totalPages">1</span>
    </div>
    <button class="pagination-btn" id="nextPage" onclick="changePage(1)">
      Next <i class="fas fa-chevron-right"></i>
    </button>
  `;

  productsSection.appendChild(paginationDiv);
}

// Update pagination controls
function updatePaginationControls(totalProducts) {
  const totalPages = Math.ceil(totalProducts / productsPerPage);

  const prevBtn = document.getElementById('prevPage');
  const nextBtn = document.getElementById('nextPage');
  const currentPageNum = document.getElementById('currentPageNum');
  const totalPagesNum = document.getElementById('totalPages');

  if (currentPageNum) currentPageNum.textContent = currentPage;
  if (totalPagesNum) totalPagesNum.textContent = totalPages;

  if (prevBtn) prevBtn.disabled = currentPage === 1;
  if (nextBtn) nextBtn.disabled = currentPage === totalPages || totalPages === 0;
}

// Change page
function changePage(direction) {
  const activeFilter = document.querySelector('.filter-btn.active');
  const activeCategory = activeFilter ? activeFilter.dataset.category : 'all';

  let filteredProducts = activeCategory === 'all' ?
    allProductsArray :
    allProductsArray.filter(p => (p.category || '').toLowerCase() === (activeCategory || '').toLowerCase());

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const newPage = currentPage + direction;

  if (newPage >= 1 && newPage <= totalPages) {
    renderPaginatedProducts(newPage);
  } else {
    console.log('Invalid page change:', newPage, 'Total pages:', totalPages);
  }
}
