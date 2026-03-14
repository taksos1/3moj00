// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all functionality
    initNavigation();
    initScrollEffects();
    initAnimations();
    initContactForm();
    initVideoBackground();
});

// Navigation functionality
function initNavigation() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Mobile menu toggle
    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close mobile menu when clicking on a link
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // Smooth scrolling for navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 70; // Account for fixed navbar
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Active navigation link highlighting
    window.addEventListener('scroll', function() {
        const sections = document.querySelectorAll('section');
        const scrollPos = window.scrollY + 100;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            const correspondingLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);

            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                navLinks.forEach(link => link.classList.remove('active'));
                if (correspondingLink) {
                    correspondingLink.classList.add('active');
                }
            }
        });
    });
}

// Scroll effects and animations
function initScrollEffects() {
    const navbar = document.querySelector('.navbar');
    
    // Navbar background on scroll
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(10, 10, 10, 0.98)';
        } else {
            navbar.style.background = 'rgba(10, 10, 10, 0.95)';
        }
    });

    // Scroll to top functionality
    const scrollIndicator = document.querySelector('.scroll-indicator');
    if (scrollIndicator) {
        scrollIndicator.addEventListener('click', function() {
            document.querySelector('#about').scrollIntoView({
                behavior: 'smooth'
            });
        });
    }
}

// Intersection Observer for animations
function initAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Animate elements on scroll
    const animateElements = document.querySelectorAll('.service-card, .portfolio-item, .skill-item, .contact-item');
    animateElements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(element);
    });

    // Stagger animations for grids
    const serviceCards = document.querySelectorAll('.service-card');
    serviceCards.forEach((card, index) => {
        card.style.transitionDelay = `${index * 0.1}s`;
    });

    const portfolioItems = document.querySelectorAll('.portfolio-item');
    portfolioItems.forEach((item, index) => {
        item.style.transitionDelay = `${index * 0.1}s`;
    });
}

// Contact form functionality
function initContactForm() {
    const contactForm = document.querySelector('.contact-form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(contactForm);
            const name = formData.get('name');
            const email = formData.get('email');
            const subject = formData.get('subject');
            const message = formData.get('message');
            
            // Basic validation
            if (!name || !email || !subject || !message) {
                showNotification('Please fill in all fields.', 'error');
                return;
            }
            
            if (!isValidEmail(email)) {
                showNotification('Please enter a valid email address.', 'error');
                return;
            }
            
            // Simulate form submission
            showNotification('Thank you for your message! I\'ll get back to you soon.', 'success');
            contactForm.reset();
        });
    }
}

// Email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 90px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        z-index: 10000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        max-width: 350px;
    `;
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Close button functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => notification.remove(), 300);
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Video background functionality
function initVideoBackground() {
    const video = document.querySelector('.video-background video');
    
    if (video) {
        // Ensure video plays on mobile devices
        video.addEventListener('loadedmetadata', function() {
            video.play().catch(error => {
                console.log('Video autoplay failed:', error);
                // Fallback: show a static background
                const videoContainer = document.querySelector('.video-background');
                videoContainer.style.background = 'linear-gradient(135deg, #1a1a1a, #2a2a2a)';
            });
        });
        
        // Handle video loading errors
        video.addEventListener('error', function() {
            console.log('Video failed to load');
            const videoContainer = document.querySelector('.video-background');
            videoContainer.style.background = 'linear-gradient(135deg, #1a1a1a, #2a2a2a)';
        });
        
        // Optimize video playback
        video.addEventListener('canplay', function() {
            video.play();
        });
    }
}

// Utility functions
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

// Smooth reveal animation for text elements
function initTextAnimations() {
    const textElements = document.querySelectorAll('.hero-title, .hero-subtitle, .section-title');
    
    textElements.forEach(element => {
        const text = element.textContent;
        element.innerHTML = '';
        
        text.split('').forEach((char, index) => {
            const span = document.createElement('span');
            span.textContent = char === ' ' ? '\u00A0' : char;
            span.style.opacity = '0';
            span.style.transform = 'translateY(20px)';
            span.style.transition = `opacity 0.5s ease ${index * 0.05}s, transform 0.5s ease ${index * 0.05}s`;
            element.appendChild(span);
            
            setTimeout(() => {
                span.style.opacity = '1';
                span.style.transform = 'translateY(0)';
            }, 100);
        });
    });
}

// Portfolio item interactions
function initPortfolioInteractions() {
    const portfolioItems = document.querySelectorAll('.portfolio-item');
    
    portfolioItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    });
}

// Initialize additional features when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Add loading animation
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
    
    // Initialize portfolio interactions
    initPortfolioInteractions();
});

// Handle window resize
window.addEventListener('resize', debounce(function() {
    // Close mobile menu on resize
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (window.innerWidth > 768) {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    }
}, 250));

// Preload critical resources
function preloadResources() {
    const video = document.querySelector('.video-background video source');
    if (video) {
        const videoElement = document.createElement('video');
        videoElement.src = video.src;
        videoElement.preload = 'metadata';
    }
}

// Initialize preloading
preloadResources();

// Secret developer panel access
function initDeveloperAccess() {
    let keySequence = '';
    let ctrlPressed = false;
    const secretCode = '15987530';
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Control') {
            ctrlPressed = true;
            keySequence = ''; // Reset sequence when Ctrl is pressed
        }
        
        if (ctrlPressed && e.key !== 'Control') {
            keySequence += e.key.toLowerCase();
            
            // Check if the sequence matches our secret code
            if (keySequence === secretCode) {
                // Success! Redirect to developer panel
                showDeveloperAccess();
                keySequence = '';
            } else if (keySequence.length >= secretCode.length) {
                // Reset if sequence is too long
                keySequence = '';
            }
        }
    });
    
    document.addEventListener('keyup', function(e) {
        if (e.key === 'Control') {
            ctrlPressed = false;
            keySequence = '';
        }
    });
}

function showDeveloperAccess() {
    // Create access notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #ff6b35, #f7931e);
        color: white;
        padding: 2rem;
        border-radius: 15px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.5);
        z-index: 10000;
        text-align: center;
        font-family: 'Inter', sans-serif;
        max-width: 400px;
    `;
    
    notification.innerHTML = `
        <div style="font-size: 3rem; margin-bottom: 1rem;">
            <i class="fas fa-code"></i>
        </div>
        <h2 style="margin: 0 0 1rem 0; font-size: 1.5rem;">Developer Access Granted</h2>
        <p style="margin: 0 0 1.5rem 0; opacity: 0.9;">Welcome to the secret developer panel!</p>
        <button id="enterDevPanel" style="
            background: rgba(255,255,255,0.2);
            border: 2px solid white;
            color: white;
            padding: 10px 25px;
            border-radius: 25px;
            cursor: pointer;
            font-weight: 600;
            margin-right: 10px;
            transition: all 0.3s ease;
        ">Enter Panel</button>
        <button id="cancelDevAccess" style="
            background: transparent;
            border: 2px solid rgba(255,255,255,0.5);
            color: white;
            padding: 10px 25px;
            border-radius: 25px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s ease;
        ">Cancel</button>
    `;
    
    // Add backdrop
    const backdrop = document.createElement('div');
    backdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        z-index: 9999;
        backdrop-filter: blur(5px);
    `;
    
    document.body.appendChild(backdrop);
    document.body.appendChild(notification);
    
    // Button functionality
    document.getElementById('enterDevPanel').addEventListener('click', function() {
        window.location.href = 'developer.html';
    });
    
    document.getElementById('cancelDevAccess').addEventListener('click', function() {
        document.body.removeChild(backdrop);
        document.body.removeChild(notification);
    });
    
    // Close on backdrop click
    backdrop.addEventListener('click', function() {
        document.body.removeChild(backdrop);
        document.body.removeChild(notification);
    });
    
    // Auto-close after 10 seconds
    setTimeout(() => {
        if (document.body.contains(notification)) {
            document.body.removeChild(backdrop);
            document.body.removeChild(notification);
        }
    }, 10000);
}

// Initialize developer access
initDeveloperAccess();

// Load portfolio from unified data.json file
async function loadPortfolioFromJSON() {
    try {
        console.log('🔄 Loading data from unified data.json...');
        const response = await fetch('./data/data.json?t=' + Date.now()); // Cache busting
        console.log('Response status:', response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Unified data loaded successfully:', data);
        
        // Auto-sync tabs to localStorage
        if (data.portfolioTabs) {
            localStorage.setItem('portfolioTabs', JSON.stringify(data.portfolioTabs));
            console.log('📁 Tabs synced to localStorage');
        }
        
        // Auto-sync clients to localStorage
        if (data.clients) {
            localStorage.setItem('clientData', JSON.stringify(data.clients));
            console.log('👥 Clients synced to localStorage');
        }
        
        return data.portfolioData || {};
    } catch (error) {
        console.error('❌ Could not load portfolio from unified data.json file:', error);
        console.log('🔄 Using fallback portfolio structure');
        return DEFAULT_PORTFOLIO_CONFIG.data;
    }
}

// Load portfolio data with auto-refresh capability
async function loadPortfolioFromStorage() {
    // Only use data from the unified data.json file
    if (window.unifiedData && window.unifiedData.portfolioData) {
        return window.unifiedData.portfolioData;
    }
    
    // Return empty data if no data.json exists
    console.log('No portfolio data in data.json, using empty data');
    return DEFAULT_PORTFOLIO_CONFIG.data;
}

// Default portfolio configuration (fallback)
const DEFAULT_PORTFOLIO_CONFIG = {
    tabs: {
        'gaming': { name: 'Gaming', icon: 'fas fa-gamepad' },
        'music': { name: 'Music Videos', icon: 'fas fa-music' },
        'commercial': { name: 'Commercial', icon: 'fas fa-briefcase' },
        'social': { name: 'Social Media', icon: 'fab fa-instagram' }
    },
    data: {
        gaming: [],
        music: [],
        commercial: [],
        social: []
    }
};

// Portfolio Display Functions
function loadPortfolioTabs() {
    // Only use data from the unified data.json file
    if (window.unifiedData && window.unifiedData.portfolioTabs) {
        return window.unifiedData.portfolioTabs;
    }
    
    // Return default tabs only if no data.json exists
    console.log('No portfolio tabs in data.json, using default tabs');
    return DEFAULT_PORTFOLIO_CONFIG.tabs;
}

// Extract video ID from URL for main page
function extractVideoIdMain(url) {
    // Check if url exists and is a string
    if (!url || typeof url !== 'string') {
        return null;
    }
    
    // YouTube Shorts
    const shortsMatch = url.match(/(?:youtube\.com\/shorts\/|youtu\.be\/)([^&\n?#]+)/);
    if (shortsMatch) {
        return { type: 'youtube', id: shortsMatch[1] };
    }
    
    // YouTube regular videos
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/)([^&\n?#]+)/);
    if (youtubeMatch) {
        return { type: 'youtube', id: youtubeMatch[1] };
    }
    
    return null;
}

// Get YouTube thumbnail
function getYouTubeThumbnail(videoId) {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}


// Create portfolio item HTML
function createPortfolioItem(video, category) {
    // Validate video object
    if (!video || !video.title || !video.url) {
        console.warn('Invalid video object:', video);
        return '';
    }
    
    const videoInfo = extractVideoIdMain(video.url);
    let thumbnailUrl = '';
    let playIcon = '<i class="fas fa-play"></i>';
    
    // Check for custom thumbnail first
    if (video.thumbnail && video.thumbnail.trim()) {
        thumbnailUrl = video.thumbnail;
    } else if (videoInfo && videoInfo.type === 'youtube') {
        thumbnailUrl = getYouTubeThumbnail(videoInfo.id);
    }
    
    // Get category display name from tabs data
    const tabs = loadPortfolioTabs();
    const categoryName = tabs[category]?.name || category;
    
    return `
        <div class="portfolio-item" data-category="${category}">
            <div class="portfolio-image">
                ${thumbnailUrl ? 
                    `<img src="${thumbnailUrl}" alt="${video.title}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                     <div class="placeholder-video" style="display: none;">
                        ${playIcon}
                        <span>${categoryName}</span>
                     </div>` :
                    `<div class="placeholder-video">
                        ${playIcon}
                        <span>${categoryName}</span>
                     </div>`
                }
                <div class="portfolio-overlay">
                    <div class="portfolio-info">
                        <h3>${video.title}</h3>
                        <p>${video.description || 'Professional video editing project'}</p>
                        ${video.client ? `<p style="font-size: 0.9rem; opacity: 0.8;">Client: ${video.client}</p>` : ''}
                        ${video.brand ? `<p style="font-size: 0.9rem; opacity: 0.8;">Brand: ${video.brand}</p>` : ''}
                        ${video.artist ? `<p style="font-size: 0.9rem; opacity: 0.8;">Artist: ${video.artist}</p>` : ''}
                        <button class="portfolio-link" onclick="openVideoModal('${video.url}', '${video.title}')">
                            <i class="fas fa-play"></i> Watch Video
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Updated Portfolio Rendering to support Mixed Sorting
async function renderPortfolio(filterCategory = 'all') {
    // 1. Get data from the unified data.json
    const data = window.unifiedData;
    const portfolioGrid = document.getElementById('portfolioGrid');
    if (!portfolioGrid) return;

    // 2. Use the master "projects" list if it exists, otherwise fallback to old structure
    let allVideos = [];
    if (data.projects && Array.isArray(data.projects)) {
        allVideos = data.projects;
    } else if (data.portfolioData) {
        // Fallback for old data format
        Object.keys(data.portfolioData).forEach(catId => {
            data.portfolioData[catId].forEach(vid => {
                allVideos.push({ ...vid, categoryId: catId });
            });
        });
    }

    // 3. Filter videos based on the selected tab
    let displayVideos = allVideos;
    if (filterCategory !== 'all') {
        displayVideos = allVideos.filter(video => video.categoryId === filterCategory);
    }

    // 4. Check if empty
    if (displayVideos.length === 0) {
        portfolioGrid.innerHTML = `
            <div class="portfolio-placeholder">
                <i class="fas fa-video" style="font-size: 3rem; color: #ff6b35; margin-bottom: 1rem;"></i>
                <h3 style="color: #ffffff; margin-bottom: 1rem;">No Projects Found</h3>
                <p style="color: #cccccc;">Add projects in the developer panel to see them here.</p>
            </div>`;
        return;
    }

    // 5. Render (We DO NOT .reverse() here anymore so it follows your dev panel order)
    portfolioGrid.innerHTML = displayVideos.map(video => 
        createPortfolioItem(video, video.categoryId)
    ).join('');
}

// Render portfolio tabs dynamically
async function renderPortfolioTabs() {
    const portfolioData = await loadPortfolioFromStorage();
    const tabs = loadPortfolioTabs();
    const tabsContainer = document.querySelector('.portfolio-tabs');
    
    if (!tabsContainer) return;
    
    // Create "All Projects" tab
    let tabsHTML = '<button class="portfolio-tab-btn active" data-category="all">All Projects</button>';
    
    // Create tabs for each category
    Object.keys(tabs).forEach(tabId => {
        const tab = tabs[tabId];
        tabsHTML += `<button class="portfolio-tab-btn" data-category="${tabId}">${tab.name}</button>`;
    });
    
    tabsContainer.innerHTML = tabsHTML;
    
    // Add event listeners to new tabs
    initPortfolioTabs();
}

// Portfolio tab functionality
function initPortfolioTabs() {
    const tabButtons = document.querySelectorAll('.portfolio-tab-btn');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            tabButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Get category and render portfolio
            const category = this.getAttribute('data-category');
            renderPortfolio(category);
        });
    });
}

// Video modal functionality
function openVideoModal(url, title) {
    const videoInfo = extractVideoIdMain(url);
    let embedUrl = url;
    
    if (videoInfo && videoInfo.type === 'youtube') {
        embedUrl = `https://www.youtube.com/embed/${videoInfo.id}?autoplay=1`;
    }
    
    // Create modal
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.9);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(5px);
    `;
    
    modal.innerHTML = `
        <div style="
            background: #1a1a1a;
            border-radius: 15px;
            padding: 2rem;
            max-width: 90vw;
            max-height: 90vh;
            position: relative;
            border: 2px solid #ff6b35;
        ">
            <div style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1rem;
                color: white;
            ">
                <h3 style="margin: 0; color: #ff6b35;">${title}</h3>
                <button onclick="this.closest('.video-modal').remove()" style="
                    background: none;
                    border: none;
                    color: white;
                    font-size: 1.5rem;
                    cursor: pointer;
                    padding: 0.5rem;
                    border-radius: 50%;
                    transition: background 0.3s ease;
                " onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='none'">
                    &times;
                </button>
            </div>
            <iframe 
                src="${embedUrl}" 
                style="
                    width: 80vw;
                    max-width: 800px;
                    height: 45vw;
                    max-height: 450px;
                    border: none;
                    border-radius: 10px;
                " 
                allowfullscreen>
            </iframe>
        </div>
    `;
    
    modal.className = 'video-modal';
    document.body.appendChild(modal);
    
    // Close on backdrop click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    // Close on escape key
    const escapeHandler = function(e) {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
}

// Generate logo for main page (same as developer panel)
function generateClientLogoMain(channelName) {
    // Create a hash for consistent color generation
    let hash = 0;
    const str = channelName.toLowerCase();
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    hash = Math.abs(hash);
    
    // Generate initials from the channel name
    const initials = channelName.split(' ')
        .filter(word => word.length > 0)
        .map(word => word[0].toUpperCase())
        .slice(0, 2)
        .join('');
    
    // Choose color based on channel content type
    const isGaming = /gaming|game|boss|vampire|play|stream|fps|rpg|minecraft|fortnite/i.test(channelName);
    const isTech = /tech|review|unbox|gadget|phone|laptop|apple|samsung/i.test(channelName);
    const isMusic = /music|song|beat|audio|rap|hip|rock|pop|dj/i.test(channelName);
    
    let avatarColor;
    if (isGaming) {
        const gamingColors = ['ff6b35', 'FF4444', '9C27B0', '673AB7', 'E91E63'];
        avatarColor = gamingColors[hash % gamingColors.length];
    } else if (isTech) {
        const techColors = ['2196F3', '00BCD4', '4CAF50', '607D8B', '009688'];
        avatarColor = techColors[hash % techColors.length];
    } else if (isMusic) {
        const musicColors = ['FF9800', 'FF5722', '795548', 'FFC107', 'CDDC39'];
        avatarColor = musicColors[hash % musicColors.length];
    } else {
        const defaultColors = ['ff6b35', '4CAF50', '2196F3', 'FF9800', 'F44336', '9C27B0'];
        avatarColor = defaultColors[hash % defaultColors.length];
    }
    
    return `https://placehold.co/120x120/${avatarColor}/ffffff?text=${encodeURIComponent(initials)}&font=roboto`;
}

// Load clients from JSON file as fallback
async function loadClientsFromJSON() {
    try {
        console.log('Attempting to load clients.json...');
        const response = await fetch('./data/clients.json');
        console.log('Clients response status:', response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Clients JSON loaded successfully:', data);
        return data.clients;
    } catch (error) {
        console.error('Could not load clients from JSON file:', error);
        console.log('Using empty clients array');
        return [];
    }
}

// Load and render clients
async function loadAndRenderClients() {
    const clientsGrid = document.getElementById('clientsGrid');
    const clientsSection = clientsGrid ? clientsGrid.closest('.clients') : null;
    
    if (!clientsGrid) return;
    
    // Check if clients should be shown
    if (window.unifiedData && window.unifiedData.showClients === false) {
        if (clientsSection) {
            clientsSection.style.display = 'none';
        }
        return;
    }
    
    // Show clients section if it was hidden
    if (clientsSection) {
        clientsSection.style.display = 'block';
    }
    
    let clients = [];
    
    // Only use data from the unified data.json file
    if (window.unifiedData && window.unifiedData.clients) {
        clients = window.unifiedData.clients;
    }
    
    if (clients.length === 0) {
        clientsGrid.innerHTML = '<div style="text-align: center; color: #888; padding: 2rem; grid-column: 1 / -1;">No clients added yet.</div>';
        return;
    }
    
    // Update old logo URLs to use new service
    let needsUpdate = false;
    clients = clients.map(client => {
        if (client.thumbnailUrl && client.thumbnailUrl.includes('via.placeholder.com')) {
            client.thumbnailUrl = generateClientLogoMain(client.name);
            needsUpdate = true;
        }
        return client;
    });
    
    // Save updated data if needed
    if (needsUpdate) {
        localStorage.setItem('clientData', JSON.stringify(clients));
    }
    
    // Format numbers with K, M, B suffixes
    function formatNumber(num) {
        if (num >= 1000000000) {
            return (num / 1000000000).toFixed(1) + 'B';
        }
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }
    
    clientsGrid.innerHTML = clients.map(client => `
        <div class="client-card">
            <div class="client-header">
                <img src="${client.thumbnailUrl}" alt="${client.name}" class="client-logo" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div style="display: none; width: 60px; height: 60px; border-radius: 50%; background: #ff6b35; color: white; align-items: center; justify-content: center; font-weight: bold; font-size: 1.2rem; border: 3px solid #ff6b35;">${client.name.split(' ').filter(w => w.length > 0).map(w => w[0]).join('').substring(0,2).toUpperCase()}</div>
                <div class="client-info">
                    <h3>${client.name}</h3>
                    <a href="${client.channelUrl}" target="_blank" class="channel-link">
                        <i class="fab fa-youtube"></i> View Channel
                    </a>
                </div>
            </div>
            
            ${(client.subscriberCount || client.videoCount || client.viewCount) ? `
            <div class="client-stats" style="grid-template-columns: repeat(${[client.subscriberCount, client.videoCount, client.viewCount].filter(Boolean).length}, 1fr);">
                ${client.subscriberCount ? `
                <div class="stat-item">
                    <span class="stat-number">${formatNumber(client.subscriberCount)}</span>
                    <div class="stat-label">Subscribers</div>
                </div>` : ''}
                ${client.videoCount ? `
                <div class="stat-item">
                    <span class="stat-number">${formatNumber(client.videoCount)}</span>
                    <div class="stat-label">Videos</div>
                </div>` : ''}
                ${client.viewCount ? `
                <div class="stat-item">
                    <span class="stat-number">${formatNumber(client.viewCount)}</span>
                    <div class="stat-label">Views</div>
                </div>` : ''}
            </div>` : ''}
            
            ${client.description ? `<p class="client-description">${client.description}</p>` : ''}
        </div>
    `).join('');
}

// Auto-refresh mechanism to check for data updates
let lastDataUpdate = null;

async function checkForDataUpdates() {
    try {
        const response = await fetch('./data/data.json');
        if (response.ok) {
            const data = await response.json();
            const currentUpdate = data.lastUpdated;
            
            if (lastDataUpdate && currentUpdate && currentUpdate !== lastDataUpdate) {
                console.log('Data update detected, refreshing portfolio...');
                await renderPortfolioTabs();
                await renderPortfolio();
                showUpdateNotification();
            }
            
            lastDataUpdate = currentUpdate;
        }
    } catch (error) {
        console.log('Could not check for updates:', error);
    }
}

// Show update notification
function showUpdateNotification() {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #ff6b35, #f7931e);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 4px 20px rgba(255, 107, 53, 0.3);
        z-index: 10000;
        font-weight: 600;
        animation: slideIn 0.3s ease-out;
    `;
    
    notification.innerHTML = `
        <i class="fas fa-sync-alt" style="margin-right: 0.5rem;"></i>
        Portfolio updated with latest changes!
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, 3000);
}

// Load unified data from data.json
async function loadUnifiedData() {
    try {
        const response = await fetch('/data/data.json');
        if (response.ok) {
            const data = await response.json();
            window.unifiedData = data;
            console.log('✅ Loaded unified data from data.json:', data);
            return data;
        } else {
            console.log('⚠️ Could not load data.json, using empty data');
            window.unifiedData = {
                portfolioTabs: {},
                portfolioData: {},
                clients: []
            };
            return window.unifiedData;
        }
    } catch (error) {
        console.error('Error loading unified data:', error);
        window.unifiedData = {
            portfolioTabs: {},
            portfolioData: {},
            clients: []
        };
        return window.unifiedData;
    }
}

// Initialize portfolio on page load
document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM loaded, initializing portfolio...');
    
    // Load unified data first
    await loadUnifiedData();
    
    // Render dynamic portfolio tabs
    renderPortfolioTabs();
    
    // Load and render portfolio
    await renderPortfolio();
    
    // Load and render clients (this checks showClients setting)
    await loadAndRenderClients();
    
    // Initialize tab functionality
    initPortfolioTabs();
    
    // Set up auto-refresh (check every 30 seconds)
    setInterval(checkForDataUpdates, 30000);
    
    console.log('Portfolio initialization complete');
    
    // Also check for updates periodically (for same-tab updates) (when videos are added in developer panel)
    window.addEventListener('storage', function(e) {
        if (e.key === 'portfolioData' || e.key === 'portfolioTabs') {
            renderPortfolioTabs();
            renderPortfolio();
        }
        if (e.key === 'clientData') {
            loadAndRenderClients();
        }
    });
    
    // Auto-refresh will handle data updates from data.json
    
    // Also check for updates periodically (for same-tab updates)
    let lastUnifiedData = JSON.stringify(window.unifiedData);
    setInterval(async () => {
        // Reload unified data from data.json
        await loadUnifiedData();
        const currentUnifiedData = JSON.stringify(window.unifiedData);
        
        if (currentUnifiedData !== lastUnifiedData) {
            lastUnifiedData = currentUnifiedData;
            console.log('🔄 Data updated, refreshing display...');
            renderPortfolioTabs();
            await renderPortfolio();
            await loadAndRenderClients();
        }
    }, 1000);
});
