// Clean, minimal story page interactions with dynamic music
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 Story loaded');
    
    initNavigation();
    initScrollAnimations();
    initDynamicMusicPlayer();
    initProgressIndicator();
    
    console.log('✨ Ready');
});

// Navigation functionality
function initNavigation() {
    // Smooth scroll for nav links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offset = 70; // Account for fixed nav
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - offset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Update active nav item on scroll
    window.addEventListener('scroll', updateActiveNavItem);
}

function updateActiveNavItem() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-section');
    
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.getBoundingClientRect().top;
        if (sectionTop <= 100) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
}

// Scroll reveal animations
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
            }
        });
    }, observerOptions);

    // Observe all scroll-reveal elements
    document.querySelectorAll('.scroll-reveal').forEach(el => {
        observer.observe(el);
    });
}

// Dynamic Music Player functionality with Spotify Integration
function initDynamicMusicPlayer() {
    // Load Spotify data from your API
    loadSpotifyData();
    
    // Refresh every 5 minutes
    setInterval(loadSpotifyData, 5 * 60 * 1000);
}

async function loadSpotifyData() {
    try {
        const response = await fetch('https://enrinjr.com/api/spotify');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.mostPlayed) {
            // Update the current track display
            const trackTitle = document.querySelector('.track-title');
            const trackArtist = document.querySelector('.track-artist');
            const trackMood = document.querySelector('.track-mood');
            const indicator = document.querySelector('.today-indicator');
            
            if (trackTitle) trackTitle.textContent = data.mostPlayed.name;
            if (trackArtist) trackArtist.textContent = data.mostPlayed.artist;
            if (trackMood) trackMood.textContent = 'vibes';
            if (indicator) {
                indicator.innerHTML = `today's most played <span style="color: var(--text-secondary); font-weight: normal;">(${data.mostPlayed.playCount} plays)</span>`;
            }
            
            // Add Spotify embed for the most played track
            const musicPlayer = document.querySelector('.music-player');
            let embedContainer = document.getElementById('spotify-embed-container');
            
            if (!embedContainer) {
                embedContainer = document.createElement('div');
                embedContainer.id = 'spotify-embed-container';
                embedContainer.style.marginTop = '20px';
                musicPlayer.insertBefore(embedContainer, document.querySelector('.featured-playlists-header'));
            }
            
            embedContainer.innerHTML = `
                <iframe style="border-radius:12px" 
                        src="https://open.spotify.com/embed/track/${data.mostPlayed.trackId}?utm_source=generator&theme=0" 
                        width="100%" 
                        height="152" 
                        frameBorder="0" 
                        allowfullscreen="" 
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                        loading="lazy">
                </iframe>
            `;
        }
        
        if (data.playlists && data.playlists.length > 0) {
            // Update playlist grid
            const playlistGrid = document.getElementById('dynamic-playlists');
            if (playlistGrid) {
                playlistGrid.innerHTML = data.playlists.map(playlist => `
                    <div class="playlist-item">
                        <iframe style="border-radius:12px" 
                                src="https://open.spotify.com/embed/playlist/${playlist.id}?utm_source=generator&theme=0" 
                                width="100%" 
                                height="152" 
                                frameBorder="0" 
                                allowfullscreen="" 
                                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                                loading="lazy">
                        </iframe>
                        <div class="playlist-name">${playlist.name}</div>
                    </div>
                `).join('');
            }
        }
        
    } catch (error) {
        console.error('Error loading Spotify data:', error);
        // Fallback to static example embeds
        console.log('Using fallback Spotify embeds');
        
        // Update display with fallback data
        const trackTitle = document.querySelector('.track-title');
        const trackArtist = document.querySelector('.track-artist');
        const trackMood = document.querySelector('.track-mood');
        
        if (trackTitle) trackTitle.textContent = 'No data available';
        if (trackArtist) trackArtist.textContent = 'Connect Spotify API';
        if (trackMood) trackMood.textContent = 'offline mode';
        
        // Add example embed
        const musicPlayer = document.querySelector('.music-player');
        let embedContainer = document.getElementById('spotify-embed-container');
        
        if (!embedContainer) {
            embedContainer = document.createElement('div');
            embedContainer.id = 'spotify-embed-container';
            embedContainer.style.marginTop = '20px';
            musicPlayer.insertBefore(embedContainer, document.querySelector('.featured-playlists-header'));
        }
        
        // Example track embed (replace with your favorite track ID)
        embedContainer.innerHTML = `
            <iframe style="border-radius:12px" 
                    src="https://open.spotify.com/embed/track/3n3Ppam7vgaVa1iaRUc9Lp?utm_source=generator&theme=0" 
                    width="100%" 
                    height="152" 
                    frameBorder="0" 
                    allowfullscreen="" 
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                    loading="lazy">
            </iframe>
        `;
        
        // Add example playlists
        const playlistGrid = document.getElementById('dynamic-playlists');
        if (playlistGrid) {
            playlistGrid.innerHTML = `
                <div class="playlist-item">
                    <div class="playlist-icon">🎵</div>
                    <div class="playlist-name">late night coding</div>
                    <div class="playlist-description">focus mode activated</div>
                </div>
                <div class="playlist-item">
                    <div class="playlist-icon">☕</div>
                    <div class="playlist-name">morning vibes</div>
                    <div class="playlist-description">start the day right</div>
                </div>
                <div class="playlist-item">
                    <div class="playlist-icon">🌃</div>
                    <div class="playlist-name">midnight thoughts</div>
                    <div class="playlist-description">deep contemplation</div>
                </div>
            `;
        }
    }
}

// Progress indicator functionality
function initProgressIndicator() {
    const progressDots = document.querySelectorAll('.progress-dot');
    const sections = document.querySelectorAll('section[id]');
    
    // Click to scroll to section
    progressDots.forEach(dot => {
        dot.addEventListener('click', function() {
            const targetSection = this.dataset.section;
            const target = document.getElementById(targetSection);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Update active dot on scroll
    function updateProgressIndicator() {
        let current = 'intro';
        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            if (rect.top <= window.innerHeight / 2) {
                current = section.id;
            }
        });
        
        progressDots.forEach(dot => {
            dot.classList.remove('active');
            if (dot.dataset.section === current) {
                dot.classList.add('active');
            }
        });
    }
    
    window.addEventListener('scroll', updateProgressIndicator);
}

// Card interactions
document.addEventListener('DOMContentLoaded', function() {
    // Thought card clicks
    document.querySelectorAll('.thought-card').forEach(card => {
        card.addEventListener('click', function() {
            const title = this.querySelector('.thought-title').textContent;
            showNotification(`📖 ${title}`);
            
            // Visual feedback
            this.style.transform = 'translateY(-8px)';
            setTimeout(() => {
                this.style.transform = 'translateY(0)';
            }, 300);
        });
    });
    
    // Timeline interactions
    document.querySelectorAll('.timeline-content').forEach(content => {
        content.addEventListener('click', function() {
            const title = this.querySelector('.timeline-title').textContent;
            showNotification(`📅 ${title}`);
            
            // Mark as read
            const marker = this.parentElement.querySelector('.timeline-marker');
            marker.style.background = '#666';
        });
    });
});

// Simple notification system
function showNotification(message) {
    // Remove existing notification
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--accent-dark);
        color: white;
        padding: 12px 24px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.opacity = '1';
    }, 10);
    
    // Remove after delay
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 2000);
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    switch(e.key) {
        case 'Escape':
            window.location.href = '../index.html';
            break;
        case 'ArrowDown':
        case ' ':
            e.preventDefault();
            scrollToNext();
            break;
        case 'ArrowUp':
            e.preventDefault();
            scrollToPrev();
            break;
        case '1':
            document.getElementById('intro').scrollIntoView({ behavior: 'smooth' });
            break;
        case '2':
            document.getElementById('thoughts').scrollIntoView({ behavior: 'smooth' });
            break;
        case '3':
            document.getElementById('sounds').scrollIntoView({ behavior: 'smooth' });
            break;
        case '4':
            document.getElementById('timeline').scrollIntoView({ behavior: 'smooth' });
            break;
    }
});

function scrollToNext() {
    const currentActive = document.querySelector('.progress-dot.active');
    const nextDot = currentActive ? currentActive.nextElementSibling : null;
    if (nextDot) {
        nextDot.click();
    }
}

function scrollToPrev() {
    const currentActive = document.querySelector('.progress-dot.active');
    const prevDot = currentActive ? currentActive.previousElementSibling : null;
    if (prevDot) {
        prevDot.click();
    }
}

// Mobile touch enhancements
if ('ontouchstart' in window) {
    document.addEventListener('touchstart', function(e) {
        if (e.target.classList.contains('thought-card') || 
            e.target.classList.contains('timeline-content') || 
            e.target.classList.contains('playlist-item')) {
            e.target.style.transform += ' scale(0.98)';
        }
    });
    
    document.addEventListener('touchend', function(e) {
        if (e.target.classList.contains('thought-card') || 
            e.target.classList.contains('timeline-content') || 
            e.target.classList.contains('playlist-item')) {
            setTimeout(() => {
                e.target.style.transform = e.target.style.transform.replace(' scale(0.98)', '');
            }, 100);
        }
    });
}

// Performance optimization
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// Apply throttling to scroll events
window.addEventListener('scroll', throttle(function() {
    updateActiveNavItem();
}, 100));

// Console info
console.log(`
📄 story mode - dynamic edition

today's music updates automatically!
- most played song of the day is featured
- 3 random playlists rotate daily
- play counts track your listening

navigation:
- scroll or arrow keys: move between sections
- numbers 1-4: jump to specific sections
- esc: return home

click anything to interact ✨
`);