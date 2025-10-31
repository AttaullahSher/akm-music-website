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

    
    // Add loading animation
    setTimeout(() => {
        document.body.classList.add('blog-loaded');
    }, 100);
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
function loadBlogPosts() {
    blogPosts = [
        // GUIDES
        {
            id: 'ultimate-piano-buying-guide-uae',
            title: 'Ultimate Piano Buying Guide in UAE (Expert Tips from AKM Music)',
            category: 'guides',
            date: '2024-12-13',
            readTime: '7 min',
            excerpt: 'Choosing between digital, upright, and grand pianos? Our Abu Dhabi experts explain tone, touch, space, and budget to help you buy with confidence.',
            image: 'assets/Blog_images/piano-buying-guide-uae.jpg',
            tags: ['piano shop Abu Dhabi','piano for sale UAE','Yamaha piano UAE','piano tuning Abu Dhabi','buy piano Abu Dhabi','digital vs acoustic piano'],
            content: `
                <h2>Ultimate Piano Buying Guide in UAE (Expert Tips from AKM Music)</h2>
                <div class="post-meta">
                    <span class="post-date"><i class="fas fa-calendar"></i> December 13, 2024</span>
                    <span class="read-time"><i class="fas fa-clock"></i> 7 min read</span>
                    <span class="post-category">Guide</span>
                </div>
                <img src="assets/Blog_images/piano-buying-guide-uae.jpg" alt="Piano Buying Guide UAE" class="post-hero-image">
                <div class="post-content">
                    <p>Whether you're a beginner or a performer, choosing the right piano is a big decision. At <strong>AKM Music Centre Abu Dhabi</strong>, we help you understand the differences between <strong>digital</strong>, <strong>upright</strong>, and <strong>grand</strong> pianos — so you can select the perfect instrument for your home, school, studio, or event.</p>
                    <h3>What to Consider</h3>
                    <ul>
                        <li><strong>Touch & Action:</strong> Graded hammer action and escapement improve control and expression.</li>
                        <li><strong>Sound:</strong> Look for rich sampling, resonance modeling, and 64–256 polyphony on digitals.</li>
                        <li><strong>Space:</strong> Uprights save space; grands need room for projection and lid clearance.</li>
                        <li><strong>Maintenance:</strong> Acoustics need regular tuning; digitals are low maintenance.</li>
                        <li><strong>Budget:</strong> Entry digitals (AED 1,500–3,000), mid-range (AED 3,000–8,000), pro digitals (AED 8,000+), uprights and grands vary widely by brand and condition.</li>
                    </ul>
                    <h3>Our Expertise</h3>
                    <ul>
                        <li>New and pre-owned <strong>Yamaha</strong>, <strong>Kawai</strong>, and <strong>Steinway</strong> pianos.</li>
                        <li><strong>Buy-back</strong> options for easy upgrades.</li>
                        <li>In-house <strong>tuning and repairs</strong> by certified technicians.</li>
                        <li>Guidance on tone, touch, and acoustic suitability for your room.</li>
                    </ul>
                    <div class="cta-section">
                        <div class="cta-buttons">
                            <a href="products.html" class="cta-btn primary">Browse Pianos</a>
                            <a href="contact.html" class="cta-btn secondary">Get Expert Help</a>
                        </div>
                    </div>
                </div>
            `
        },
        {
            id: 'piano-rental-uae',
            title: 'Piano Rental in UAE — Affordable Options for Events & Practice',
            category: 'guides',
            date: '2024-12-12',
            readTime: '5 min',
            excerpt: 'Concert, wedding, or studio session? Rent upright or grand pianos across the UAE with delivery, setup, and tuning from our pro team.',
            image: 'assets/Blog_images/piano-rental-uae.jpg',
            tags: ['piano rental Abu Dhabi','grand piano hire UAE','rent piano for event','upright piano rental Dubai','piano delivery UAE'],
            content: `
                <h2>Piano Rental in UAE — Affordable Options for Events & Practice</h2>
                <div class="post-meta">
                    <span class="post-date"><i class="fas fa-calendar"></i> December 12, 2024</span>
                    <span class="read-time"><i class="fas fa-clock"></i> 5 min read</span>
                    <span class="post-category">Guide</span>
                </div>
                <img src="assets/Blog_images/piano-rental-uae.jpg" alt="Piano Rental UAE" class="post-hero-image">
                <div class="post-content">
                    <p>Planning a concert or event? AKM Music Centre offers reliable <strong>upright</strong> and <strong>grand piano</strong> rentals with delivery, setup, and on-site tuning across the UAE.</p>
                    <h3>Our Rental Policy Includes</h3>
                    <ul>
                        <li>Delivery, setup, and tuning before every event</li>
                        <li>Short-term and long-term rental packages</li>
                        <li>One free tuning for extended rentals</li>
                        <li>Option to buy or extend later</li>
                        <li>Professional dismantling, shifting, and reassembly</li>
                    </ul>
                    <p class="muted">Keywords: piano rental Abu Dhabi, wedding piano hire, concert piano UAE, Yamaha piano rental</p>
                </div>
            `
        },
        {
            id: 'choose-right-instrument-kids',
            title: 'How to Choose the Right Instrument for Your Child',
            category: 'guides',
            date: '2024-11-20',
            readTime: '6 min',
            excerpt: 'Match your child’s age and interest to the right instrument — piano, violin, guitar, vocals, or drums — with teacher-backed advice.',
            image: 'assets/Blog_images/choose-right-instrument-kids.jpg',
            tags: ['best instrument for kids UAE','music school Abu Dhabi','beginner music lessons UAE','kids piano lessons Abu Dhabi'],
            content: `
                <h2>How to Choose the Right Instrument for Your Child</h2>
                <div class="post-meta">
                    <span class="post-date"><i class="fas fa-calendar"></i> November 20, 2024</span>
                    <span class="read-time"><i class="fas fa-clock"></i> 6 min read</span>
                    <span class="post-category">Guide</span>
                </div>
                <img src="assets/Blog_images/choose-right-instrument-kids.jpg" alt="Choose Instrument for Kids" class="post-hero-image">
                <div class="post-content">
                    <p>Introducing children to music early can be life-changing. Our teachers help parents pick instruments that match age, interest, and coordination.</p>
                    <ul>
                        <li><strong>Under 6 years:</strong> Start with piano/keyboard for foundations.</li>
                        <li><strong>Ages 7–10:</strong> Try guitar or violin for coordination and ear training.</li>
                        <li><strong>Teens:</strong> Explore vocals, drums, or multi-instrument paths.</li>
                    </ul>
                    <p class="muted">Keywords: kids music lessons, beginner instruments UAE, piano for kids Abu Dhabi</p>
                </div>
            `
        },

        // NEWS
        {
            id: 'trinity-exams-akm-music-abu-dhabi',
            title: 'Trinity College London Exams Now at AKM Music Centre',
            category: 'news',
            date: '2024-12-01',
            readTime: '4 min',
            excerpt: 'AKM Music Centre is now an official venue for Trinity College London exams. Prepare, practice, and certify in Abu Dhabi.',
            image: 'assets/Blog_images/trinity-exams-akm-music-abu-dhabi.jpg',
            tags: ['Trinity exams Abu Dhabi','Trinity College London UAE','music certificate Abu Dhabi','music exams UAE'],
            content: `
                <h2>Trinity College London Exams Now at AKM Music Centre</h2>
                <div class="post-meta">
                    <span class="post-date"><i class="fas fa-calendar"></i> December 1, 2024</span>
                    <span class="read-time"><i class="fas fa-clock"></i> 4 min read</span>
                    <span class="post-category">News</span>
                </div>
                <img src="assets/Blog_images/trinity-exams-akm-music-abu-dhabi.jpg" alt="Trinity Exams at AKM Music" class="post-hero-image">
                <div class="post-content">
                    <p>Students can now learn, practice, and earn internationally recognized certificates at our Abu Dhabi centre.</p>
                    <p><strong>Available Instruments:</strong> Piano, Guitar, Violin, Vocals, and Theory of Music. <strong>Certificates:</strong> Grades 1–8.</p>
                </div>
            `
        },
        {
            id: 'music-workshops-recitals-abu-dhabi',
            title: 'Upcoming Music Workshops & Recitals in Abu Dhabi',
            category: 'news',
            date: '2024-11-25',
            readTime: '3 min',
            excerpt: 'Join our student performances and masterclasses designed to build confidence and showcase progress.',
            image: 'assets/Blog_images/music-workshops-recitals-abu-dhabi.jpg',
            tags: ['music workshops Abu Dhabi','piano recital UAE','music events Abu Dhabi','music school UAE'],
            content: `
                <h2>Upcoming Music Workshops & Recitals in Abu Dhabi</h2>
                <div class="post-meta">
                    <span class="post-date"><i class="fas fa-calendar"></i> November 25, 2024</span>
                    <span class="read-time"><i class="fas fa-clock"></i> 3 min read</span>
                    <span class="post-category">News</span>
                </div>
                <img src="assets/Blog_images/music-workshops-recitals-abu-dhabi.jpg" alt="Music Workshops and Recitals Abu Dhabi" class="post-hero-image">
                <div class="post-content">
                    <ul>
                        <li>Student recital nights</li>
                        <li>Masterclasses by visiting artists</li>
                        <li>Summer and winter music camps</li>
                    </ul>
                </div>
            `
        },
        {
            id: 'musical-instruments-new-arrivals-uae',
            title: 'New Arrivals: Musical Instruments in UAE',
            category: 'news',
            date: '2024-11-10',
            readTime: '4 min',
            excerpt: 'From Yamaha keyboards to Kawai uprights and guitar bundles — discover what’s new at AKM Music Centre.',
            image: 'assets/Blog_images/musical-instruments-new-arrivals-uae.jpg',
            tags: ['musical instruments Abu Dhabi','guitar sale UAE','Yamaha keyboard UAE','new arrivals music gear'],
            content: `
                <h2>New Arrivals: Musical Instruments in UAE</h2>
                <div class="post-meta">
                    <span class="post-date"><i class="fas fa-calendar"></i> November 10, 2024</span>
                    <span class="read-time"><i class="fas fa-clock"></i> 4 min read</span>
                    <span class="post-category">News</span>
                </div>
                <img src="assets/Blog_images/musical-instruments-new-arrivals-uae.jpg" alt="New Musical Instruments in UAE" class="post-hero-image">
                <div class="post-content">
                    <ul>
                        <li>Yamaha PSR series keyboards</li>
                        <li>Kawai upright pianos</li>
                        <li>Beginner violin and guitar packages</li>
                    </ul>
                </div>
            `
        },

        // TIPS
        {
            id: 'piano-tuning-maintenance-uae',
            title: 'How to Keep Your Piano in Perfect Tune in UAE Weather',
            category: 'tips',
            date: '2024-10-28',
            readTime: '6 min',
            excerpt: 'Humidity and AC airflow affect tuning and wood. Use our pro care checklist to protect your piano year‑round.',
            image: 'assets/Blog_images/piano-tuning-maintenance-uae.jpg',
            tags: ['piano tuning Abu Dhabi','piano maintenance UAE','piano repair Abu Dhabi','dehumidifier for piano'],
            content: `
                <h2>How to Keep Your Piano in Perfect Tune in UAE Weather</h2>
                <div class="post-meta">
                    <span class="post-date"><i class="fas fa-calendar"></i> October 28, 2024</span>
                    <span class="read-time"><i class="fas fa-clock"></i> 6 min read</span>
                    <span class="post-category">Tips</span>
                </div>
                <img src="assets/Blog_images/piano-tuning-maintenance-uae.jpg" alt="Piano Tuning and Maintenance UAE" class="post-hero-image">
                <div class="post-content">
                    <ul>
                        <li>Keep away from direct AC airflow and sunlight</li>
                        <li>Use a dehumidifier during high humidity</li>
                        <li>Schedule tuning at least twice a year</li>
                    </ul>
                </div>
            `
        },
        {
            id: 'music-practice-tips-students',
            title: '5 Essential Practice Habits for Music Students',
            category: 'tips',
            date: '2024-10-15',
            readTime: '4 min',
            excerpt: 'Set routines, focus on one skill, record progress, take breaks, and celebrate wins — here’s how to practice smarter.',
            image: 'assets/Blog_images/music-practice-tips-students.jpg',
            tags: ['music practice tips UAE','improve piano skills','Trinity exam preparation Abu Dhabi','practice routine'],
            content: `
                <h2>5 Essential Practice Habits for Music Students</h2>
                <div class="post-meta">
                    <span class="post-date"><i class="fas fa-calendar"></i> October 15, 2024</span>
                    <span class="read-time"><i class="fas fa-clock"></i> 4 min read</span>
                    <span class="post-category">Tips</span>
                </div>
                <img src="assets/Blog_images/music-practice-tips-students.jpg" alt="Practice Tips for Music Students" class="post-hero-image">
                <div class="post-content">
                    <ol>
                        <li>Set a daily 20-minute routine</li>
                        <li>Focus on one skill at a time</li>
                        <li>Record yourself to track progress</li>
                        <li>Take short breaks to avoid fatigue</li>
                        <li>Celebrate small milestones</li>
                    </ol>
                </div>
            `
        },
        {
            id: 'buy-musical-instruments-smart-uae',
            title: 'Saving Money on Music Gear — Buy Smart in UAE',
            category: 'tips',
            date: '2024-10-08',
            readTime: '5 min',
            excerpt: 'Buy verified used instruments, choose bundles, and use our trade‑in offers to stretch your budget.',
            image: 'assets/Blog_images/buy-musical-instruments-smart-uae.jpg',
            tags: ['affordable musical instruments UAE','used piano Abu Dhabi','guitar deals UAE','music gear bundle UAE'],
            content: `
                <h2>Saving Money on Music Gear — Buy Smart in UAE</h2>
                <div class="post-meta">
                    <span class="post-date"><i class="fas fa-calendar"></i> October 8, 2024</span>
                    <span class="read-time"><i class="fas fa-clock"></i> 5 min read</span>
                    <span class="post-category">Tips</span>
                </div>
                <img src="assets/Blog_images/buy-musical-instruments-smart-uae.jpg" alt="Buy Musical Instruments Smart in UAE" class="post-hero-image">
                <div class="post-content">
                    <ul>
                        <li>Choose verified used instruments</li>
                        <li>Look for bundle deals with stands and cases</li>
                        <li>Leverage our trade-in program</li>
                    </ul>
                </div>
            `
        },

        // EDUCATION
        {
            id: 'music-education-benefits-uae',
            title: 'Why Music Education Matters for Every Child',
            category: 'education',
            date: '2024-09-20',
            readTime: '5 min',
            excerpt: 'Music builds discipline, memory, and confidence. Here’s why lessons create lifelong benefits for students.',
            image: 'assets/Blog_images/music-education-benefits-uae.jpg',
            tags: ['music education UAE','music classes for kids Abu Dhabi','benefits of learning music','music and brain development'],
            content: `
                <h2>Why Music Education Matters for Every Child</h2>
                <div class="post-meta">
                    <span class="post-date"><i class="fas fa-calendar"></i> September 20, 2024</span>
                    <span class="read-time"><i class="fas fa-clock"></i> 5 min read</span>
                    <span class="post-category">Education</span>
                </div>
                <img src="assets/Blog_images/music-education-benefits-uae.jpg" alt="Benefits of Music Education UAE" class="post-hero-image">
                <div class="post-content">
                    <p>Music isn’t just art — it’s brain training. Learning an instrument improves focus, memory, and emotional balance.</p>
                </div>
            `
        },
        {
            id: 'trinity-exam-preparation-guide',
            title: 'How to Prepare for Trinity College Music Exams',
            category: 'education',
            date: '2024-09-10',
            readTime: '6 min',
            excerpt: 'Know your syllabus, practice scales daily, take mock exams, and focus on musicality — your step-by-step success plan.',
            image: 'assets/Blog_images/trinity-exam-preparation-guide.jpg',
            tags: ['Trinity exam preparation UAE','music exam tips Abu Dhabi','Trinity piano guide UAE','grade exams music UAE'],
            content: `
                <h2>How to Prepare for Trinity College Music Exams</h2>
                <div class="post-meta">
                    <span class="post-date"><i class="fas fa-calendar"></i> September 10, 2024</span>
                    <span class="read-time"><i class="fas fa-clock"></i> 6 min read</span>
                    <span class="post-category">Education</span>
                </div>
                <img src="assets/Blog_images/trinity-exam-preparation-guide.jpg" alt="Trinity Exam Preparation Guide" class="post-hero-image">
                <div class="post-content">
                    <ol>
                        <li>Know your grade syllabus</li>
                        <li>Practice scales daily</li>
                        <li>Take mock exams with AKM instructors</li>
                        <li>Focus on expression and phrasing</li>
                        <li>Manage time effectively before exam week</li>
                    </ol>
                </div>
            `
        },
        {
            id: 'group-vs-private-music-lessons',
            title: 'Choosing Between Group and Private Music Lessons',
            category: 'education',
            date: '2024-09-01',
            readTime: '5 min',
            excerpt: 'Group is social and motivating, private is personalized and flexible. Choose one — or mix both for faster progress.',
            image: 'assets/Blog_images/group-vs-private-music-lessons.jpg',
            tags: ['private music lessons Abu Dhabi','group music classes UAE','best music teachers UAE','music lessons comparison'],
            content: `
                <h2>Choosing Between Group and Private Music Lessons</h2>
                <div class="post-meta">
                    <span class="post-date"><i class="fas fa-calendar"></i> September 1, 2024</span>
                    <span class="read-time"><i class="fas fa-clock"></i> 5 min read</span>
                    <span class="post-category">Education</span>
                </div>
                <img src="assets/Blog_images/group-vs-private-music-lessons.jpg" alt="Group vs Private Music Lessons" class="post-hero-image">
                <div class="post-content">
                    <p>Both group and private lessons have unique benefits. At AKM Music, you can choose either — or mix both to maximize learning!</p>
                </div>
            `
        },

        // ABOUT / BRAND (mapped under news for filtering)
        {
            id: 'akm-music-centre-abu-dhabi',
            title: 'About AKM Music Centre Abu Dhabi',
            category: 'news',
            date: '2024-08-20',
            readTime: '4 min',
            excerpt: 'AKM Music Centre is a hub for learning, performing, and buying quality instruments in Abu Dhabi since 1984.',
            image: 'assets/Blog_images/akm-music-centre-abu-dhabi.jpg',
            tags: ['AKM Music Abu Dhabi','music school UAE','piano shop Abu Dhabi','Trinity exams UAE','music store Abu Dhabi'],
            content: `
                <h2>About AKM Music Centre Abu Dhabi</h2>
                <div class="post-meta">
                    <span class="post-date"><i class="fas fa-calendar"></i> August 20, 2024</span>
                    <span class="read-time"><i class="fas fa-clock"></i> 4 min read</span>
                    <span class="post-category">About</span>
                </div>
                <img src="assets/Blog_images/akm-music-centre-abu-dhabi.jpg" alt="About AKM Music Centre Abu Dhabi" class="post-hero-image">
                <div class="post-content">
                    <ul>
                        <li>Music school with qualified instructors</li>
                        <li>Trinity exam registration and preparation</li>
                        <li>Piano sales, tuning, repairs, and rentals</li>
                        <li>Buy-back and maintenance services</li>
                    </ul>
                    <p><strong>Visit:</strong> AKM Music Centre, Abu Dhabi • <strong>Call:</strong> 02 621 9929 • <strong>Email:</strong> sales@akm-music.com</p>
                </div>
            `
        }
    ];

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
        <article class="blog-card" data-category="${post.category}" data-date="${post.date}">
          <div class="card-image">
            <img src="${post.image}" alt="${post.title}" loading="lazy">
          </div>
          <div class="card-content">
            <h3>${post.title}</h3>
            <p>${post.excerpt}</p>
            <button class="read-more-btn" onclick="openPost('${post.id}')">Read More <i class="fas fa-arrow-right"></i></button>
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

// Open Blog Post in Modal
function openPost(postId) {
    const post = blogPosts.find(p => p.id === postId);
    if (!post) return;
    
    const modal = document.getElementById('blogModal');
    const modalContent = document.getElementById('modalContent');
    
    modalContent.innerHTML = post.content;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Track blog post view
    if (typeof gtag !== 'undefined') {
        gtag('event', 'blog_post_view', {
            'blog_post_id': postId,
            'blog_post_title': post.title
        });
    }
}

// Expose handlers for inline HTML attributes
window.openPost = openPost;
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
