// Clean, minimal story page interactions
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 Story loaded');
    
    initNavigation();
    initScrollAnimations();
    initMusicPlayer();
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

// Music player functionality
function initMusicPlayer() {
    const controlBtns = document.querySelectorAll('.control-btn');
    const tracks = [
        { title: "obstacles", artist: "syd matters", mood: "nostalgic" },
        { title: "spanish sahara", artist: "foals", mood: "melancholy" },
        { title: "mountains", artist: "message to bears", mood: "dreamy" },
        { title: "something good", artist: "alt-j", mood: "hopeful" },
        { title: "crosses", artist: "josé gonzález", mood: "peaceful" }
    ];
    
    let currentTrack = 0;
    
    controlBtns.forEach((btn, index) => {
        btn.addEventListener('click', function() {
            // Simple click feedback
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 100);
            
            if (index === 1) { // Play button
                playTrack();
            } else if (index === 2) { // Next button
                nextTrack();
            } else if (index === 0) { // Previous button
                prevTrack();
            }
        });
    });
    
    function updateTrackDisplay() {
        const track = tracks[currentTrack];
        const titleEl = document.querySelector('.track-title');
        const artistEl = document.querySelector('.track-artist');
        const moodEl = document.querySelector('.track-mood');
        
        if (titleEl && artistEl && moodEl) {
            titleEl.textContent = track.title;
            artistEl.textContent = track.artist;
            moodEl.textContent = track.mood;
        }
    }
    
    function playTrack() {
        updateTrackDisplay();
        showNotification(`♪ playing ${tracks[currentTrack].title}`);
    }
    
    function nextTrack() {
        currentTrack = (currentTrack + 1) % tracks.length;
        updateTrackDisplay();
        showNotification(`→ ${tracks[currentTrack].title}`);
    }
    
    function prevTrack() {
        currentTrack = currentTrack === 0 ? tracks.length - 1 : currentTrack - 1;
        updateTrackDisplay();
        showNotification(`← ${tracks[currentTrack].title}`);
    }
    
    // Playlist interactions
    document.querySelectorAll('.playlist-item').forEach(item => {
        item.addEventListener('click', function() {
            const name = this.querySelector('.playlist-name').textContent;
            showNotification(`🎵 ${name}`);
            
            // Visual feedback
            this.style.transform = 'translateY(-4px)';
            setTimeout(() => {
                this.style.transform = 'translateY(0)';
            }, 200);
        });
    });
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
📄 story mode

navigation:
- scroll or arrow keys: move between sections
- numbers 1-4: jump to specific sections
- esc: return home

click anything to interact ✨
`);