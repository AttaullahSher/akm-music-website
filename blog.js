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
        {
            id: 'best-beginner-guitars-uae-2026',
            title: 'Best Beginner Guitars in the UAE (2026): Acoustic, Classical & Electric',
            category: 'guides',
            date: '2026-06-10',
            readTime: '6 min',
            excerpt: 'Starting guitar in 2026? Our Abu Dhabi experts compare acoustic, classical and electric starters, what to spend, and the exact models we recommend from our shelves.',
            image: 'assets/Blog_images/piano-buying-guide-uae.jpg',
            tags: ['beginner guitar UAE','buy guitar abu dhabi','best first guitar','classical guitar for beginners','electric guitar starter UAE'],
            content: `
                <h2>Best Beginner Guitars in the UAE (2026)</h2>
                <div class="post-content">
                    <p>The best first guitar is the one you will actually pick up every day. At <strong>AKM Music Abu Dhabi</strong> we put hundreds of beginners on the right instrument every year — here is the honest version of the advice we give in the showroom.</p>
                    <h3>Classical, acoustic or electric?</h3>
                    <ul>
                        <li><strong>Classical (nylon strings)</strong> — softest on the fingers, ideal for kids and school programs. Great starters from <a href="shop.html?dept=Guitars%20%26%20Basses&cat=Classical%20%26%20Flamenco">our classical range</a> begin around AED 400.</li>
                        <li><strong>Acoustic (steel strings)</strong> — the singer-songwriter sound. Expect AED 500–1,200 for a quality starter in <a href="shop.html?dept=Guitars%20%26%20Basses&cat=Acoustic%20Guitars">acoustic guitars</a>.</li>
                        <li><strong>Electric</strong> — easiest necks and quietest practice with headphones. Ibanez starters in <a href="shop.html?dept=Guitars%20%26%20Basses&cat=Electric%20Guitars">our electric range</a> start near AED 800 plus a small amp.</li>
                    </ul>
                    <h3>What actually matters</h3>
                    <p>Correct size (3/4 for under-12s), low string action, and a setup check — every guitar we sell is inspected and set up in our workshop before it leaves. Skip the unbranded marketplace guitars: high action teaches bad habits and hurts.</p>
                    <h3>Our 2026 picks</h3>
                    <ul>
                        <li>Budget classical: Alhambra 1C — the school standard</li>
                        <li>Acoustic all-rounder: Ibanez acoustic-electric starters</li>
                        <li>Electric: Ibanez GRX series + a Vox Pathfinder amp</li>
                    </ul>
                    <p>Pair any of them with a tuner, spare strings and our <a href="resources.html">free chord charts</a>, and you are set for the first year.</p>
                    <div class="cta-section"><div class="cta-buttons">
                        <a href="shop.html?dept=Guitars%20%26%20Basses" class="cta-btn primary">Browse Guitars</a>
                        <a href="https://wa.me/97126219929" class="cta-btn secondary">Ask Us on WhatsApp</a>
                    </div></div>
                </div>
            `
        },
        {
            id: 'keyboard-61-76-88-keys-guide',
            title: '61 vs 76 vs 88 Keys: Which Keyboard Should You Buy?',
            category: 'guides',
            date: '2026-06-02',
            readTime: '5 min',
            excerpt: 'Confused by key counts? Here is exactly who should buy a 61-key arranger, a 76-key performer, or a full 88-key digital piano — with UAE prices.',
            image: 'assets/Blog_images/piano-buying-guide-uae.jpg',
            tags: ['keyboard abu dhabi','61 key vs 88 key','digital piano UAE','korg keyboard UAE','beginner keyboard'],
            content: `
                <h2>61 vs 76 vs 88 Keys: Which Keyboard Should You Buy?</h2>
                <div class="post-content">
                    <p>Key count is the first decision and the most common place buyers overspend or under-buy. Here is the showroom truth:</p>
                    <h3>61 keys — the smart start</h3>
                    <p>Perfect for absolute beginners, school requirements and producers. Light, portable, hundreds of sounds and rhythms. See <a href="shop.html?dept=Pianos%20%26%20Keyboards&cat=Keyboards%20%26%20Synths">keyboards &amp; synths</a> — quality starters from AED 500–1,500.</p>
                    <h3>76 keys — the gigging compromise</h3>
                    <p>Stage players who need more range without the weight of a full piano. Often semi-weighted — fine for keys parts, not ideal for classical technique.</p>
                    <h3>88 keys — for pianists</h3>
                    <p>If the goal is <em>piano</em> (exams, classical, proper technique), nothing replaces 88 weighted keys with graded hammer action. Browse <a href="shop.html?dept=Pianos%20%26%20Keyboards&cat=Digital%20Pianos">digital pianos</a> — Kawai and Korg models we trust start around AED 2,500.</p>
                    <h3>The one rule</h3>
                    <p>Buy weighted keys if piano lessons are involved. Unweighted keys make exam pieces harder to transfer to a real piano — teachers see it every term in our <a href="services.html#classes">music classes</a>.</p>
                    <div class="cta-section"><div class="cta-buttons">
                        <a href="shop.html?dept=Pianos%20%26%20Keyboards" class="cta-btn primary">Browse Pianos &amp; Keyboards</a>
                        <a href="services.html#classes" class="cta-btn secondary">Join Piano Classes</a>
                    </div></div>
                </div>
            `
        },
        {
            id: 'guitar-strings-guide-uae',
            title: 'Guitar Strings 101: Choosing the Right Set (and When to Change Them)',
            category: 'tips',
            date: '2026-05-20',
            readTime: '5 min',
            excerpt: "Dead strings make good guitars sound cheap. Gauges, materials, coated vs uncoated, and how often UAE humidity really makes you change strings.",
            image: 'assets/Blog_images/piano-buying-guide-uae.jpg',
            tags: ["guitar strings abu dhabi","d'addario UAE","ernie ball UAE","when to change guitar strings","string gauge guide"],
            content: `
                <h2>Guitar Strings 101</h2>
                <div class="post-content">
                    <p>Strings are the cheapest upgrade your guitar will ever get. Here is what we tell every customer at the counter:</p>
                    <h3>Gauge in one minute</h3>
                    <ul>
                        <li><strong>Light (.009–.010 electric, .011–.012 acoustic)</strong> — easier bends, kinder to beginners.</li>
                        <li><strong>Medium</strong> — fuller tone, slightly more effort. The default for most players.</li>
                        <li><strong>Nylon</strong> — classical guitars only; never put steel strings on a classical.</li>
                    </ul>
                    <h3>UAE reality: humidity and AC</h3>
                    <p>Moving between humid air and air-conditioned rooms kills uncoated strings fast. If you play daily, change monthly — or go coated (Elixir-style) and double the life. Hear the difference? Dull tone, rough feel, tuning drift: change them.</p>
                    <h3>What we stock</h3>
                    <p>Full ranges of <strong>Ernie Ball</strong>, <strong>D'Addario</strong> and <strong>La Bella</strong> in <a href="shop.html?dept=Strings%20%26%20Accessories&cat=Guitar%20Strings">guitar strings</a>, plus <a href="shop.html?dept=Strings%20%26%20Accessories&cat=Violin%20%26%20Oud%20Strings">violin &amp; oud strings</a>. Free fitting at the showroom with any set.</p>
                    <div class="cta-section"><div class="cta-buttons">
                        <a href="shop.html?dept=Strings%20%26%20Accessories&cat=Guitar%20Strings" class="cta-btn primary">Shop Strings</a>
                        <a href="services.html#repairs" class="cta-btn secondary">Book a Restring &amp; Setup</a>
                    </div></div>
                </div>
            `
        },
        {
            id: 'home-studio-abu-dhabi-budget',
            title: 'Home Studio in Abu Dhabi on a Budget: The AED 2,000 Starter Setup',
            category: 'guides',
            date: '2026-05-12',
            readTime: '6 min',
            excerpt: 'Record vocals and instruments at home with gear that actually lasts: interface, mic, headphones and monitoring — a realistic UAE shopping list.',
            image: 'assets/Blog_images/piano-buying-guide-uae.jpg',
            tags: ['home studio UAE','audio interface abu dhabi','recording microphone UAE','podcast setup abu dhabi'],
            content: `
                <h2>Home Studio in Abu Dhabi on a Budget</h2>
                <div class="post-content">
                    <p>You do not need a treated room and AED 20,000 to release music. You need four things that work together:</p>
                    <h3>The AED ~2,000 list</h3>
                    <ul>
                        <li><strong>Audio interface</strong> — 2-in/2-out USB is plenty. See <a href="shop.html?dept=Studio%2C%20PA%20%26%20Audio&cat=Recording%20Gear">recording gear</a>.</li>
                        <li><strong>Closed-back headphones</strong> — track without bleed: <a href="shop.html?dept=Studio%2C%20PA%20%26%20Audio&cat=Headphones">headphones</a>.</li>
                        <li><strong>Cables &amp; stands</strong> — the unglamorous 10%: <a href="shop.html?dept=Studio%2C%20PA%20%26%20Audio&cat=Stands%2C%20Cables%20%26%20Wireless">stands &amp; cables</a>.</li>
                        <li><strong>Free DAW</strong> — GarageBand, Cakewalk or Reaper trial. Spend on hardware, not software, in year one.</li>
                    </ul>
                    <h3>The order to upgrade</h3>
                    <p>Room first (rugs, curtains), then microphone, then monitors. And before buying anything for a band: try a session in <a href="services.html#studio">our studio</a> (AED 100/hr solo) to learn what you actually need.</p>
                    <div class="cta-section"><div class="cta-buttons">
                        <a href="shop.html?dept=Studio%2C%20PA%20%26%20Audio" class="cta-btn primary">Browse Studio Gear</a>
                        <a href="services.html#studio" class="cta-btn secondary">Book Our Studio</a>
                    </div></div>
                </div>
            `
        },
        {
            id: 'uae-school-music-checklist',
            title: 'UAE School Music Checklist: Instruments & Free Resources for Teachers',
            category: 'education',
            date: '2026-04-28',
            readTime: '5 min',
            excerpt: 'Recorders, melodicas, ukuleles and percussion — what UAE school music programs actually need each term, plus free printable charts for the classroom.',
            image: 'assets/Blog_images/piano-buying-guide-uae.jpg',
            tags: ['school music UAE','recorder abu dhabi','melodica UAE','school band instruments','music teacher resources UAE'],
            content: `
                <h2>UAE School Music Checklist</h2>
                <div class="post-content">
                    <p>Every term we equip schools across Abu Dhabi. This is the checklist that covers 90% of classroom programs:</p>
                    <h3>The classroom core</h3>
                    <ul>
                        <li><strong>Recorders</strong> — the universal starter: <a href="shop.html?dept=Wind%20Instruments&cat=Melodicas%20%26%20Recorders">melodicas &amp; recorders</a> (Hohner &amp; Suzuki in stock)</li>
                        <li><strong>Melodicas</strong> — keyboard skills without keyboards</li>
                        <li><strong>Ukuleles</strong> — four strings, fast chords: <a href="shop.html?dept=Guitars%20%26%20Basses&cat=Ukulele%2C%20Violin%20%26%20Folk">ukuleles &amp; folk</a></li>
                        <li><strong>Hand percussion</strong> — rhythm for the whole class: <a href="shop.html?dept=Drums%20%26%20Percussion&cat=Hand%20Percussion">hand percussion</a></li>
                    </ul>
                    <h3>Free printables for your class</h3>
                    <p>Our <a href="resources.html">Resources page</a> has A4 print-ready charts teachers use every week: a <strong>recorder fingering chart</strong>, ukulele and guitar chords, manuscript paper, a theory cheat sheet and a weekly practice log. Free for schools — print as many as you need.</p>
                    <h3>School orders &amp; rentals</h3>
                    <p>Bulk class sets, instrument <a href="services.html#rentals">rentals for the term</a>, and repairs with school-friendly turnaround. Email <a href="mailto:sales@akm-music.com">sales@akm-music.com</a> for a quote on letterhead.</p>
                    <div class="cta-section"><div class="cta-buttons">
                        <a href="resources.html" class="cta-btn primary">Get Free Resources</a>
                        <a href="https://wa.me/97126219929" class="cta-btn secondary">School Orders on WhatsApp</a>
                    </div></div>
                </div>
            `
        },
        // GUIDES
        {
            id: 'ultimate-piano-buying-guide-uae',
            title: 'Ultimate Piano Buying Guide in UAE (Expert Tips from AKM Music)',
            category: 'guides',
            date: '2026-03-19',
            readTime: '7 min',
            excerpt: 'Choosing between digital, upright, and grand pianos? Our Abu Dhabi experts explain tone, touch, space, and budget to help you buy with confidence.',
            image: 'assets/Blog_images/piano-buying-guide-uae.jpg',
            tags: ['piano shop Abu Dhabi','piano for sale UAE','Yamaha piano UAE','piano tuning Abu Dhabi','buy piano Abu Dhabi','digital vs acoustic piano'],
            content: `
                <h2>Ultimate Piano Buying Guide in UAE (Expert Tips from AKM Music)</h2>
                <div class="post-meta">
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
                            <a href="contact.html" class="cta-btn primary">Contact Us for Piano Services</a>
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
            date: '2026-02-16',
            readTime: '5 min',
            excerpt: 'Concert, wedding, or studio session? Rent upright or grand pianos across the UAE with delivery, setup, and tuning from our pro team.',
            image: 'assets/Blog_images/piano-rental-uae.jpg',
            tags: ['piano rental Abu Dhabi','grand piano hire UAE','rent piano for event','upright piano rental Dubai','piano delivery UAE'],
            content: `
                <h2>Piano Rental in UAE — Affordable Options for Events & Practice</h2>
                <div class="post-meta">
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
                </div>
            `
        },
        {
            id: 'choose-right-instrument-kids',
            title: 'How to Choose the Right Instrument for Your Child',
            category: 'guides',
            date: '2026-04-07',
            readTime: '6 min',
            excerpt: 'Match your child’s age and interest to the right instrument — piano, violin, guitar, vocals, or drums — with teacher-backed advice.',
            image: 'assets/Blog_images/choose-right-instrument-kids.jpg',
            tags: ['best instrument for kids UAE','music school Abu Dhabi','beginner music lessons UAE','kids piano lessons Abu Dhabi'],
            content: `
                <h2>How to Choose the Right Instrument for Your Child</h2>
                <div class="post-meta">
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
                </div>
            `
        },

        // NEWS
        {
            id: 'trinity-exams-akm-music-abu-dhabi',
            title: 'Trinity College London Exams Now at AKM Music Centre',
            category: 'news',
            date: '2026-01-13',
            readTime: '4 min',
            excerpt: 'AKM Music Centre is now an official venue for Trinity College London exams. Prepare, practice, and certify in Abu Dhabi.',
            image: 'assets/Blog_images/trinity-exams-akm-music-abu-dhabi.jpg',
            tags: ['Trinity exams Abu Dhabi','Trinity College London UAE','music certificate Abu Dhabi','music exams UAE'],
            content: `
                <h2>Trinity College London Exams Now at AKM Music Centre</h2>
                <div class="post-meta">
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
            date: '2026-05-10',
            readTime: '3 min',
            excerpt: 'Join our student performances and masterclasses designed to build confidence and showcase progress.',
            image: 'assets/Blog_images/music-workshops-recitals-abu-dhabi.jpg',
            tags: ['music workshops Abu Dhabi','piano recital UAE','music events Abu Dhabi','music school UAE'],
            content: `
                <h2>Upcoming Music Workshops & Recitals in Abu Dhabi</h2>
                <div class="post-meta">
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
            date: '2026-03-26',
            readTime: '4 min',
            excerpt: 'From Yamaha keyboards to Kawai uprights and guitar bundles — discover what’s new at AKM Music Centre.',
            image: 'assets/Blog_images/musical-instruments-new-arrivals-uae.jpg',
            tags: ['musical instruments Abu Dhabi','guitar sale UAE','Yamaha keyboard UAE','new arrivals music gear'],
            content: `
                <h2>New Arrivals: Musical Instruments in UAE</h2>
                <div class="post-meta">
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
            date: '2026-02-23',
            readTime: '6 min',
            excerpt: 'Humidity and AC airflow affect tuning and wood. Use our pro care checklist to protect your piano year‑round.',
            image: 'assets/Blog_images/piano-tuning-maintenance-uae.jpg',
            tags: ['piano tuning Abu Dhabi','piano maintenance UAE','piano repair Abu Dhabi','dehumidifier for piano'],
            content: `
                <h2>How to Keep Your Piano in Perfect Tune in UAE Weather</h2>
                <div class="post-meta">
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
            date: '2026-01-20',
            readTime: '4 min',
            excerpt: 'Set routines, focus on one skill, record progress, take breaks, and celebrate wins — here’s how to practice smarter.',
            image: 'assets/Blog_images/music-practice-tips-students.jpg',
            tags: ['music practice tips UAE','improve piano skills','Trinity exam preparation Abu Dhabi','practice routine'],
            content: `
                <h2>5 Essential Practice Habits for Music Students</h2>
                <div class="post-meta">
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
            date: '2026-05-17',
            readTime: '5 min',
            excerpt: 'Buy verified used instruments, choose bundles, and use our trade‑in offers to stretch your budget.',
            image: 'assets/Blog_images/buy-musical-instruments-smart-uae.jpg',
            tags: ['affordable musical instruments UAE','used piano Abu Dhabi','guitar deals UAE','music gear bundle UAE'],
            content: `
                <h2>Saving Money on Music Gear — Buy Smart in UAE</h2>
                <div class="post-meta">
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
            date: '2026-04-14',
            readTime: '5 min',
            excerpt: 'Music builds discipline, memory, and confidence. Here’s why lessons create lifelong benefits for students.',
            image: 'assets/Blog_images/music-education-benefits-uae.jpg',
            tags: ['music education UAE','music classes for kids Abu Dhabi','benefits of learning music','music and brain development'],
            content: `
                <h2>Why Music Education Matters for Every Child</h2>
                <div class="post-meta">
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
            date: '2026-03-11',
            readTime: '6 min',
            excerpt: 'Know your syllabus, practice scales daily, take mock exams, and focus on musicality — your step-by-step success plan.',
            image: 'assets/Blog_images/trinity-exam-preparation-guide.jpg',
            tags: ['Trinity exam preparation UAE','music exam tips Abu Dhabi','Trinity piano guide UAE','grade exams music UAE'],
            content: `
                <h2>How to Prepare for Trinity College Music Exams</h2>
                <div class="post-meta">
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
            date: '2026-02-08',
            readTime: '5 min',
            excerpt: 'Group is social and motivating, private is personalized and flexible. Choose one — or mix both for faster progress.',
            image: 'assets/Blog_images/group-vs-private-music-lessons.jpg',
            tags: ['private music lessons Abu Dhabi','group music classes UAE','best music teachers UAE','music lessons comparison'],
            content: `
                <h2>Choosing Between Group and Private Music Lessons</h2>
                <div class="post-meta">
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
            date: '2026-01-05',
            readTime: '4 min',
            excerpt: 'AKM Music Centre is a hub for learning, performing, and buying quality instruments in Abu Dhabi since 1984.',
            image: 'assets/Blog_images/akm-music-centre-abu-dhabi.jpg',
            tags: ['AKM Music Abu Dhabi','music school UAE','piano shop Abu Dhabi','Trinity exams UAE','music store Abu Dhabi'],
            content: `
                <h2>About AKM Music Centre Abu Dhabi</h2>
                <div class="post-meta">
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
        <article class="blog-card" data-category="${post.category}" data-date="${post.date}" data-post-id="${post.id}">
          <div class="card-image">
            <img src="${post.image}" alt="${post.title}" loading="lazy">
          </div>
          <div class="card-content">
            <h3>${post.title}</h3>
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
        // Collapse
        card.classList.remove('expanded');
        excerpt.style.display = 'block';
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
