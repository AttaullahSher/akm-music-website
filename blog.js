// Blog System JavaScript
// Enhanced blog functionality with search, filtering, and modal display

document.addEventListener('DOMContentLoaded', function() {
    initializeBlog();
    createParticleEffect();
});

// Blog Data Storage
let blogPosts = [];
let currentCategory = 'all';
let currentSort = 'date';
let blogCurrentPage = 1;
const BLOG_PAGE_SIZE = 6; // 6 cards per page

// Initialize Blog System
function initializeBlog() {
    loadBlogPosts();
    setupEventListeners();
    mergeAdminPosts();

    // Add loading animation
    setTimeout(() => {
        document.body.classList.add('blog-loaded');
    }, 100);
}

// The public blog is backend-driven. When the admin has published posts in
// Firestore, they become the blog (newest first) and the starter seed is
// dropped. Until then, the seed articles stay visible. Each post gets a
// shareable ?post= URL with its own SEO meta.
async function mergeAdminPosts() {
    try {
        const adminPosts = window.AKM ? await window.AKM.getBlogPosts() : [];
        if (adminPosts.length) {
            // Backend posts fully replace the seed so what you manage in the
            // admin is exactly what visitors see — no duplicates.
            blogPosts = adminPosts
                .map(convertBlogPost)
                .sort((a, b) => new Date(b.date) - new Date(a.date));
            blogCurrentPage = 1;
            renderBlogPosts();
        }
    } catch (e) { /* blog works fine on the seed articles without a backend */ }

    // Deep link: blog.html?post=<id> — open the post and set per-post SEO meta
    try {
        const id = new URLSearchParams(location.search).get('post');
        if (!id) return;
        const post = blogPosts.find(p => p.id === id);
        if (!post) return;
        document.title = post.title + ' | AKM Music Abu Dhabi';
        const desc = document.querySelector('meta[name="description"]');
        if (desc) desc.setAttribute('content', post.excerpt);
        let canon = document.querySelector('link[rel="canonical"]');
        if (canon) canon.setAttribute('href', 'https://www.akm-music.com/blog.html?post=' + encodeURIComponent(id));
        const ld = document.createElement('script');
        ld.type = 'application/ld+json';
        ld.textContent = JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.title,
            datePublished: post.date,
            image: new URL(post.image, location.origin).href,
            author: { '@type': 'Organization', name: post.author || 'AKM Music Abu Dhabi' },
            publisher: { '@id': 'https://www.akm-music.com/#store' },
            mainEntityOfPage: 'https://www.akm-music.com/blog.html?post=' + encodeURIComponent(id)
        });
        document.head.appendChild(ld);
        setTimeout(() => {
            const card = document.querySelector(`.blog-card[data-post-id="${CSS.escape(id)}"]`);
            if (card) {
                togglePost(id);
                card.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 400);
    } catch (e) { /* non-fatal */ }
}

// Setup Event Listeners
function setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('blogSearch');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(searchBlogPosts, 300));
    }

    // Close modal on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeBlogPost();
        }
    });

    attachBlogPaginationHandlers();
}

// Blog Posts Data
// The public blog is backend-driven. While the Firestore blog doc is empty,
// the shared starter articles (blog-seed.js) are shown as a fallback so the
// page is never blank and stays SEO-rich. As soon as the admin adds/imports
// posts, those replace the seed entirely.

// Convert an admin/seed post (plain-text body) into the display shape used by
// the card renderer and the deep-link / modal logic.
function convertBlogPost(p) {
    const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const toHtml = body => esc(body).split(/\n\s*\n/).map(par =>
        par.startsWith('## ')
            ? '<h3>' + par.slice(3).trim() + '</h3>'
            : '<p>' + par.replace(/\n/g, '<br>') + '</p>'
    ).join('');
    const words = (p.body || '').split(/\s+/).filter(Boolean).length;
    return {
        id: p.id,
        title: p.title,
        category: p.category || 'news',
        date: p.date,
        readTime: Math.max(1, Math.round(words / 200)) + ' min',
        excerpt: (p.body || '').replace(/\s+/g, ' ').slice(0, 150).trim() + '\u2026',
        image: p.cover || 'assets/Banners_images/3D274.png',
        tags: p.tags || [],
        author: p.author || 'AKM Music',
        content: `
            <h2>${esc(p.title)}</h2>
            ${p.cover ? `<img src="${esc(p.cover)}" alt="${esc(p.title)}" class="post-hero-image">` : ''}
            <div class="post-content">${toHtml(p.body)}</div>`
    };
}

function loadBlogPosts() {
    // Start with the shared starter articles so the page renders instantly.
    const seed = Array.isArray(window.AKM_BLOG_SEED) ? window.AKM_BLOG_SEED : [];
    blogPosts = seed.map(convertBlogPost);
    renderBlogPosts();
}

// Utility function to get filtered and sorted posts
function getFilteredSortedPosts() {
    let posts = [...blogPosts];
    if (currentCategory !== 'all') {
        posts = posts.filter(p => p.category === currentCategory);
    }
    switch (currentSort) {
        case 'date': posts.sort((a,b)=> new Date(b.date)-new Date(a.date)); break;
        case 'date-asc': posts.sort((a,b)=> new Date(a.date)-new Date(b.date)); break;
        case 'title': posts.sort((a,b)=> a.title.localeCompare(b.title)); break;
        case 'category': posts.sort((a,b)=> a.category.localeCompare(b.category)); break;
    }
    return posts;
}

// Render Blog Posts
function renderBlogPosts() {
    const posts = getFilteredSortedPosts();
    const totalPages = Math.max(1, Math.ceil(posts.length / BLOG_PAGE_SIZE));
    if (blogCurrentPage > totalPages) blogCurrentPage = totalPages;
    const start = (blogCurrentPage - 1) * BLOG_PAGE_SIZE;
    const currentSlice = posts.slice(start, start + BLOG_PAGE_SIZE);
    renderFilteredPosts(currentSlice);
    updateBlogPagination(totalPages);
}

// Update Pagination Controls
function updateBlogPagination(totalPages){
    const prev = document.getElementById('blogPrev');
    const next = document.getElementById('blogNext');
    const pNum = document.getElementById('blogPageNum');
    const tNum = document.getElementById('blogTotalPages');
    if (prev) prev.disabled = blogCurrentPage === 1;
    if (next) next.disabled = blogCurrentPage === totalPages || totalPages===0;
    if (pNum) pNum.textContent = String(blogCurrentPage);
    if (tNum) tNum.textContent = String(totalPages);
}

// Attach Pagination Handlers
function attachBlogPaginationHandlers(){
    const prev = document.getElementById('blogPrev');
    const next = document.getElementById('blogNext');
    if (prev) prev.onclick = () => { if (blogCurrentPage>1){ blogCurrentPage--; renderBlogPosts(); window.scrollTo({top:0,behavior:'smooth'});} };
    if (next) next.onclick = () => { const total = Math.ceil(getFilteredSortedPosts().length / BLOG_PAGE_SIZE); if (blogCurrentPage<total){ blogCurrentPage++; renderBlogPosts(); window.scrollTo({top:0,behavior:'smooth'});} };
}

// Close Blog Post Modal
function closeBlogPost() {
  const modal = document.getElementById('blogModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Newsletter subscribe (simple UI feedback)
function subscribeNewsletter(e){
  e.preventDefault();
  const input = e.target?.querySelector('input[type="email"]');
  const email = input?.value?.trim();
  if (!email) return;
  alert('Thanks for subscribing! We will keep you updated.');
  try { input.value=''; } catch {}
}

// Format a YYYY-MM-DD date for blog cards (e.g. "10 Jun 2026")
function formatBlogDate(dateStr) {
    try {
        const d = new Date(dateStr);
        if (isNaN(d)) return dateStr || '';
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return dateStr || ''; }
}

// Human label for a category slug
function blogCategoryLabel(cat) {
    const map = { guides: 'Guides', news: 'News', tips: 'Tips', education: 'Education' };
    return map[cat] || (cat ? cat.charAt(0).toUpperCase() + cat.slice(1) : 'Article');
}

// Render Filtered Posts
function renderFilteredPosts(posts) {
    const postsGrid = document.getElementById('postsGrid');
    if (!postsGrid) return;

    if (posts.length === 0) {
        postsGrid.innerHTML = `
            <div class="no-posts">
                <i class="fas fa-search"></i>
                <h3>No articles found</h3>
                <p>Try adjusting your search terms or browse all categories.</p>
            </div>
        `;
        updateBlogPagination(1);
        return;
    }

    postsGrid.innerHTML = posts.map(post => `
        <article class="blog-card" data-category="${post.category}" data-date="${post.date}" data-post-id="${post.id}">
          <div class="card-image">
            <img src="${post.image}" alt="${post.title}" loading="lazy" onerror="this.onerror=null;this.src='assets/Banners_images/banner-hero.jpg'">
            <span class="card-category">${blogCategoryLabel(post.category)}</span>
          </div>
          <div class="card-content">
            <div class="card-meta">
              <span><i class="far fa-calendar"></i> ${formatBlogDate(post.date)}</span>
              <span><i class="far fa-clock"></i> ${post.readTime || '5 min'}</span>
            </div>
            <h3 class="card-title">${post.title}</h3>
            <p class="blog-excerpt">${post.excerpt}</p>
            <div class="blog-full-content" style="display: none;"></div>
            <button class="read-more-btn" onclick="togglePost('${post.id}')">
              <span class="read-more-text">Read More</span>
              <i class="fas fa-chevron-down"></i>
            </button>
          </div>
        </article>
    `).join('');

    setTimeout(() => {
        postsGrid.querySelectorAll('.blog-card').forEach((post, index) => {
            post.style.animationDelay = `${index * 0.05}s`;
            post.classList.add('fade-in');
        });
    }, 50);
}

// Search Blog Posts
function searchBlogPosts() {
    const searchTerm = document.getElementById('blogSearch').value.toLowerCase();
    const base = getFilteredSortedPosts();
    const filtered = base.filter(post =>
        post.title.toLowerCase().includes(searchTerm) ||
        post.excerpt.toLowerCase().includes(searchTerm) ||
        post.category.toLowerCase().includes(searchTerm) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
    blogCurrentPage = 1;
    const totalPages = Math.max(1, Math.ceil(filtered.length / BLOG_PAGE_SIZE));
    renderFilteredPosts(filtered.slice(0, BLOG_PAGE_SIZE));
    updateBlogPagination(totalPages);
}

// Filter Posts by Category
function filterPosts(category) {
    currentCategory = category;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    if (event && event.target) event.target.classList.add('active');
    blogCurrentPage = 1;
    renderBlogPosts();
}

// Sort Blog Posts
function sortBlogPosts() {
    const sortBy = document.getElementById('sortBy').value;
    currentSort = sortBy;
    blogCurrentPage = 1;
    renderBlogPosts();
}

// Toggle Blog Post Expansion
function togglePost(postId) {
    const post = blogPosts.find(p => p.id === postId);
    if (!post) return;
    
    const card = document.querySelector(`.blog-card[data-post-id="${postId}"]`);
    if (!card) return;
    
    const excerpt = card.querySelector('.blog-excerpt');
    const fullContent = card.querySelector('.blog-full-content');
    const button = card.querySelector('.read-more-btn');
    const buttonText = button.querySelector('.read-more-text');
    const buttonIcon = button.querySelector('i');
    
    const isExpanded = card.classList.contains('expanded');
    
    if (isExpanded) {
        // Collapse — clear inline display so the CSS line-clamp is restored
        card.classList.remove('expanded');
        excerpt.style.display = '';
        fullContent.style.display = 'none';
        buttonText.textContent = 'Read More';
        buttonIcon.className = 'fas fa-chevron-down';
    } else {
        // Expand
        card.classList.add('expanded');
        excerpt.style.display = 'none';
        fullContent.innerHTML = post.content;
        fullContent.style.display = 'block';
        buttonText.textContent = 'Show Less';
        buttonIcon.className = 'fas fa-chevron-up';
        
        // Smooth scroll to card
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        // Track blog post view
        if (typeof gtag !== 'undefined') {
            gtag('event', 'blog_post_view', {
                'blog_post_id': postId,
                'blog_post_title': post.title
            });
        }
    }
}

// Expose handlers for inline HTML attributes
window.togglePost = togglePost;
// Expose handlers for inline HTML attributes
window.togglePost = togglePost;
window.closeBlogPost = closeBlogPost;
window.filterPosts = filterPosts;
window.sortBlogPosts = sortBlogPosts;
window.searchBlogPosts = searchBlogPosts;
window.subscribeNewsletter = subscribeNewsletter;

// Mobile Menu Toggle
function toggleMobileMenu() {
    const nav = document.querySelector('.nav');
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    
    nav.classList.toggle('mobile-open');
    mobileToggle.classList.toggle('active');
}

// Create Particle Effect
function createParticleEffect() {
    const particleContainer = document.querySelector('.hero-particles');
    if (!particleContainer) return;
    
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 4 + 's';
        particle.style.animationDuration = (Math.random() * 3 + 2) + 's';
        particleContainer.appendChild(particle);
    }
}

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Service Modal Handler (for footer links)
function openServiceModal(service) {
    // Redirect to main page with service modal
    window.location.href = `index.html#${service}`;
}



// Animation on scroll
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const parallax = document.querySelector('.hero-background');
    
    if (parallax) {
        const speed = scrolled * 0.5;
        parallax.style.transform = `translateY(${speed}px)`;
    }
});

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
        }
    });
}, observerOptions);

// Observe all blog posts for animation
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        document.querySelectorAll('.blog-post, .featured-post').forEach(post => {
            observer.observe(post);
        });
    }, 100);
});
