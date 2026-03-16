// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async function() {
    await loadUnifiedData();
    
    initNavigation();
    initScrollEffects();
    initAnimations();
    initVideoBackground();
    initDeveloperAccess();

    // Initial Renders
    renderPortfolioTabs();
    renderPortfolio('all');
    renderClients();

    // Auto-Refresh Logic: Every 3 seconds, check if data.json changed on the server
    let lastUpdateCheck = JSON.stringify(window.unifiedData);
    setInterval(async () => {
        const response = await fetch('/api/data?t=' + Date.now());
        if (response.ok) {
            const freshData = await response.json();
            const freshDataString = JSON.stringify(freshData);
            if (freshDataString !== lastUpdateCheck) {
                window.unifiedData = freshData;
                lastUpdateCheck = freshDataString;
                console.log('🔄 Data update synced from server');
                renderPortfolioTabs();
                // Stay on current category or default to all
                const activeCat = document.querySelector('.portfolio-tab-btn.active')?.dataset.category || 'all';
                renderPortfolio(activeCat);
                renderClients();
            }
        }
    }, 3000);
});

// --- DATA FETCHING ---
async function loadUnifiedData() {
    try {
        const response = await fetch('/api/data?t=' + Date.now());
        if (response.ok) {
            window.unifiedData = await response.json();
        } else {
            // Fallback empty structure
            window.unifiedData = { projects: [], portfolioTabs: [], clients: [], showClients: true };
        }
    } catch (e) {
        console.error('Failed to load studio data:', e);
    }
}

// --- PORTFOLIO SYSTEM ---
function renderPortfolioTabs() {
    const data = window.unifiedData;
    const tabsContainer = document.querySelector('.portfolio-tabs');
    if (!tabsContainer || !data.portfolioTabs) return;

    // Support both old Object format and new Array format
    const tabs = Array.isArray(data.portfolioTabs) ? data.portfolioTabs : 
                 Object.keys(data.portfolioTabs).map(id => ({ id, ...data.portfolioTabs[id] }));

    let tabsHTML = '<button class="portfolio-tab-btn active" data-category="all">All Projects</button>';
    tabs.forEach(tab => {
        tabsHTML += `<button class="portfolio-tab-btn" data-category="${tab.id}">${tab.name}</button>`;
    });
    tabsContainer.innerHTML = tabsHTML;

    // Attach Click Events
    document.querySelectorAll('.portfolio-tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.portfolio-tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            renderPortfolio(this.dataset.category);
        });
    });
}

function renderPortfolio(filterCategory = 'all') {
    const data = window.unifiedData;
    const grid = document.getElementById('portfolioGrid');
    if (!grid) return;

    // Get projects from portfolioData and flatten by category
    let allProjects = [];
    const portfolioData = data.portfolioData || {};
    
    Object.keys(portfolioData).forEach(cat => {
        const catProjects = portfolioData[cat] || [];
        catProjects.forEach(p => {
            if (p.url) { // Only add projects with valid URLs
                allProjects.push({ ...p, categoryId: cat });
            }
        });
    });

    let displayList = allProjects;

    // Filter logic
    if (filterCategory !== 'all') {
        displayList = displayList.filter(v => v.categoryId === filterCategory);
    }

    if (displayList.length === 0) {
        grid.innerHTML = `<div class="portfolio-placeholder"><h3>No Projects found in this category.</h3></div>`;
        return;
    }

    // Render cards (Respects the exact index order from the master list)
    grid.innerHTML = displayList.map(video => {
        const ytId = video.url.match(/(?:youtu\.be\/|youtube\.com\/(?:shorts\/|watch\?v=))([\w-]{11})/)?.[1];
        const thumb = `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`;

        return `
            <div class="portfolio-item">
                <div class="portfolio-image">
                    <img src="${thumb}" alt="${video.title}" onerror="this.src='icon.png'">
                    <div class="portfolio-overlay">
                        <div class="portfolio-info">
                            <h3>${video.title}</h3>
                            <button class="portfolio-link" onclick="openVideoModal('${video.url}', '${video.title}')">
                                <i class="fas fa-play"></i> Watch Video
                            </button>
                        </div>
                    </div>
                </div>
            </div>`;
    }).join('');
}

// --- CLIENTS SYSTEM ---
function renderClients() {
    const data = window.unifiedData;
    const grid = document.getElementById('clientsGrid');
    const section = document.getElementById('clients');
    if (!grid) return;

    // Global toggle from developer panel
    if (data.showClients === false) {
        if (section) section.style.display = 'none';
        return;
    } else if (section) {
        section.style.display = 'block';
    }

    if (!data.clients || data.clients.length === 0) {
        grid.innerHTML = '<p style="text-align:center; color:#666; grid-column: 1/-1">Client showcase coming soon.</p>';
        return;
    }

    grid.innerHTML = data.clients.map(c => `
        <div class="client-card">
            <div class="client-header">
                <img src="${c.thumbnailUrl}" class="client-logo" alt="${c.name}">
                <div class="client-info">
                    <h3>${c.name}</h3>
                    <a href="${c.channelUrl}" target="_blank" class="channel-link">
                        <i class="fab fa-youtube"></i> View Channel
                    </a>
                </div>
            </div>
            ${c.subscribers ? `
                <div class="client-stats">
                    <div class="stat-item">
                        <span class="stat-number">${c.subscribers}</span>
                        <div class="stat-label">Subscribers</div>
                    </div>
                </div>` : ''}
        </div>
    `).join('');
}

// --- SECURITY: DISCORD OTP ACCESS ---
function initDeveloperAccess() {
    let keys = "";
    document.addEventListener('keydown', (e) => {
        // Prevent typing keys when a modal is already open
        if (document.querySelector('.auth-modal')) return;

        if (e.ctrlKey) {
            keys += e.key;
            if (keys.includes("15987530")) {
                keys = "";
                requestStudioAccess();
            }
        }
    });
}

async function requestStudioAccess() {
    // 1. Force logout of any ghost sessions first
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});

    // 2. Request OTP to Discord
    const res = await fetch('/api/auth/request', { method: 'POST' });
    if (!res.ok) return alert("Security system offline.");

    // 3. Show Verification UI
    const modal = document.createElement('div');
    modal.className = 'auth-modal';
    modal.style.cssText = `position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.98); z-index:200000; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(15px); color:#fff; font-family: sans-serif;`;
    modal.innerHTML = `
        <div style="background:#111; padding:40px; border-radius:25px; border:1px solid #ff6b35; text-align:center; width:360px; box-shadow: 0 0 50px rgba(255,107,53,0.2);">
            <div style="font-size:3rem; color:#ff6b35; margin-bottom:15px;"><i class="fas fa-user-shield"></i></div>
            <h2 style="margin:0 0 10px 0; font-weight:800; letter-spacing:-1px;">Studio Access</h2>
            <p style="color:#777; margin-bottom:25px; font-size:0.9rem;">A verification code was sent to your Discord. Enter it to unlock the command center.</p>
            <input type="text" id="otp-input" placeholder="000000" maxlength="6" style="width:100%; padding:15px; background:#000; border:1px solid #222; color:#fff; border-radius:12px; text-align:center; font-size:1.8rem; font-weight:700; letter-spacing:8px; margin-bottom:20px;">
            <button id="verify-btn" style="width:100%; background:#ff6b35; color:#fff; border:none; padding:16px; border-radius:12px; font-weight:800; cursor:pointer; font-size:1rem; transition: 0.3s;">Verify & Unlock</button>
            <button onclick="this.closest('.auth-modal').remove()" style="background:none; border:none; color:#444; margin-top:15px; cursor:pointer; font-weight:600;">Cancel Request</button>
        </div>`;
    document.body.appendChild(modal);

    document.getElementById('verify-btn').onclick = async (e) => {
        const btn = e.target;
        const code = document.getElementById('otp-input').value;
        btn.innerText = "Verifying...";
        btn.style.opacity = "0.5";

        const verifyRes = await fetch('/api/auth/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
        });

        const result = await verifyRes.json();
        if (result.success) {
            window.location.href = "/developer";
        } else {
            alert("Invalid Code. Access Denied.");
            modal.remove();
        }
    };
}

// --- MODAL & UI HELPERS ---
function openVideoModal(url, title) {
    const ytId = url.match(/(?:youtu\.be\/|youtube\.com\/(?:shorts\/|watch\?v=))([\w-]{11})/)?.[1];
    const embedUrl = `https://www.youtube.com/embed/${ytId}?autoplay=1`;
    
    const modal = document.createElement('div');
    modal.className = 'video-modal';
    modal.style.cssText = `position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.9); z-index:10000; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(5px);`;
    modal.innerHTML = `
        <div style="background:#111; padding:20px; border-radius:20px; width:90%; max-width:900px; position:relative; border:1px solid #333;">
            <div style="display:flex; justify-content:space-between; margin-bottom:15px; color:#fff; align-items:center;">
                <h3 style="margin:0; font-weight:700;">${title}</h3>
                <button onclick="this.closest('.video-modal').remove()" style="background:#222; border:none; color:#fff; width:35px; height:35px; border-radius:50%; cursor:pointer; font-size:1.2rem;">&times;</button>
            </div>
            <div style="position:relative; padding-bottom:56.25%; height:0; border-radius:12px; overflow:hidden;">
                <iframe src="${embedUrl}" style="position:absolute; top:0; left:0; width:100%; height:100%; border:none;" allowfullscreen allow="autoplay"></iframe>
            </div>
        </div>`;
    document.body.appendChild(modal);

    modal.onclick = (e) => { if(e.target === modal) modal.remove(); };
}

// --- BASE UI FUNCTIONS ---
function initNavigation() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });
    document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    }));
}

function initScrollEffects() {
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(10, 10, 10, 0.98)';
            navbar.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
        } else {
            navbar.style.background = 'rgba(10, 10, 10, 0.95)';
            navbar.style.boxShadow = 'none';
        }
    });
}

function initAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.service-card, .portfolio-item, .client-card, .skill-item').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = '0.8s cubic-bezier(0.2, 0.8, 0.2, 1)';
        observer.observe(el);
    });
}

function initVideoBackground() {
    const video = document.querySelector('.video-background video');
    if (video) {
        video.play().catch(() => {
            console.log("Autoplay was blocked by browser. Interaction required.");
        });
    }
}
