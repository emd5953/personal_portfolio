// Clean, minimal story page interactions with dynamic music
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 Story loaded');

    initNavigation();
    initScrollAnimations();
    initDynamicMusicPlayer();
    initProgressIndicator();
    initInlineEditing();
    loadDynamicContent();

    console.log(' Ready');
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
    console.log('🎵 Loading Spotify data...');

    try {
        // Use your working API endpoint
        const response = await fetch('/api/spotify');

        if (!response.ok) {
            console.warn(` Spotify API returned ${response.status}: ${response.statusText}`);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Spotify data loaded:', data);
        console.log('🔍 Debug - lastPlayed exists:', !!data.lastPlayed);
        console.log('🔍 Debug - mostPlayedToday exists:', !!data.mostPlayedToday);
        console.log('🔍 Debug - mostPlayedToday data:', data.mostPlayedToday);
        
        if (data.lastPlayed) {
            console.log(' Processing lastPlayed...');
        }
        
        if (data.mostPlayedToday) {
            console.log(' Processing mostPlayedToday...');
        } else {
            console.log(' No mostPlayedToday data found');
        }

        if (data.lastPlayed) {
            // Update the current track display with last played
            const trackTitle = document.querySelector('.track-title');
            const trackArtist = document.querySelector('.track-artist');
            const trackMood = document.querySelector('.track-mood');
            const indicator = document.querySelector('.today-indicator');

            if (trackTitle) trackTitle.textContent = data.lastPlayed.name;
            if (trackArtist) trackArtist.textContent = data.lastPlayed.artist;
            if (trackMood) trackMood.textContent = `from ${data.lastPlayed.album}`;
            if (indicator) {
                indicator.innerHTML = `last played <span style="color: var(--text-secondary); font-weight: normal;">(${new Date(data.lastPlayed.playedAt).toLocaleTimeString()})</span>`;
            }

            // Add Spotify embed for the last played track
            const musicPlayer = document.querySelector('.music-player');
            let embedContainer = document.getElementById('spotify-embed-container');

            if (!embedContainer) {
                embedContainer = document.createElement('div');
                embedContainer.id = 'spotify-embed-container';
                embedContainer.style.marginTop = '20px';
                const featuredHeader = document.querySelector('.featured-playlists-header');
                if (featuredHeader && musicPlayer) {
                    musicPlayer.insertBefore(embedContainer, featuredHeader);
                }
            }

            embedContainer.innerHTML = `
                <h4 style="margin-bottom: 15px; color: #333;"> Last Played</h4>
                <iframe style="border-radius:12px"
                        src="https://open.spotify.com/embed/track/${data.lastPlayed.trackId}?utm_source=generator&theme=0"
                        width="100%"
                        height="152"
                        frameBorder="0"
                        allowfullscreen=""
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy">
                </iframe>
            `;
        }

        // Show most played of the day
        if (data.mostPlayedToday) {
            const musicPlayer = document.querySelector('.music-player');
            let mostPlayedContainer = document.getElementById('most-played-container');

            if (!mostPlayedContainer) {
                mostPlayedContainer = document.createElement('div');
                mostPlayedContainer.id = 'most-played-container';
                mostPlayedContainer.style.marginTop = '20px';
                const embedContainer = document.getElementById('spotify-embed-container');
                if (embedContainer && musicPlayer) {
                    musicPlayer.insertBefore(mostPlayedContainer, embedContainer.nextSibling);
                } else if (musicPlayer) {
                    musicPlayer.appendChild(mostPlayedContainer);
                }
            }

            mostPlayedContainer.innerHTML = `
                <h4 style="margin-bottom: 15px; color: #333;"> Most Played Today ${data.mostPlayedToday.playCount ? `(${data.mostPlayedToday.playCount} plays)` : ''}</h4>
                <iframe style="border-radius:12px"
                        src="https://open.spotify.com/embed/track/${data.mostPlayedToday.trackId}?utm_source=generator&theme=0"
                        width="100%"
                        height="152"
                        frameBorder="0"
                        allowfullscreen=""
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy">
                </iframe>
            `;
        }

        if (data.randomPlaylists && data.randomPlaylists.length > 0) {
            // Update playlist grid with 3 random user-created playlists
            const playlistGrid = document.getElementById('dynamic-playlists');
            if (playlistGrid) {
                playlistGrid.innerHTML = data.randomPlaylists.map(playlist => `
                    <div class="playlist-embed-container">
                        <h4 style="margin-bottom: 10px; color: #333;">${playlist.name}</h4>
                        <p style="margin-bottom: 15px; color: #666; font-size: 14px;">${playlist.tracks} tracks • Created by me</p>
                        <iframe style="border-radius:12px"
                                src="https://open.spotify.com/embed/playlist/${playlist.id}?utm_source=generator&theme=0"
                                width="100%"
                                height="380"
                                frameBorder="0"
                                allowfullscreen=""
                                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                loading="lazy">
                        </iframe>
                    </div>
                `).join('');
            }
        }

        // Hide the placeholder player controls since we're using embeds
        const playerControls = document.querySelector('.player-controls');
        if (playerControls) {
            playerControls.style.display = 'none';
        }

    } catch (error) {
        console.error(' Error loading Spotify data:', error);

        // Update display with error message
        const trackTitle = document.querySelector('.track-title');
        const trackArtist = document.querySelector('.track-artist');
        const trackMood = document.querySelector('.track-mood');

        if (trackTitle) trackTitle.textContent = 'Unable to load';
        if (trackArtist) trackArtist.textContent = 'Check console for details';
        if (trackMood) trackMood.textContent = error.message;
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
            showNotification(` ${title}`);

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
            showNotification(` ${title}`);

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
 story mode - dynamic edition

today's music updates automatically!
- most played song of the day is featured
- 3 random playlists rotate daily
- play counts track your listening

navigation:
- scroll or arrow keys: move between sections
- numbers 1-4: jump to specific sections
- esc: return home

click anything to interact 
`);

// Inline Editing System
let isEditMode = false;
let authToken = localStorage.getItem('storyEditToken');
let sessionTimeout = null;
const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

function initInlineEditing() {
    // Add section edit buttons instead of header login
    addSectionEditButtons();
    
    // Check if user is already authenticated
    if (authToken) {
        // Check if session is still valid
        const sessionStart = localStorage.getItem('sessionStart');
        const now = Date.now();
        
        if (sessionStart && (now - parseInt(sessionStart)) > SESSION_DURATION) {
            // Session expired
            logout();
            showNotification('⏰ Session expired. Please log in again.');
            return;
        }
        
        isEditMode = true;
        document.body.classList.add('edit-mode');
        startSessionTimer();
        
        // Enable both sections for editing
        const thoughtsSection = document.querySelector('.section-thoughts');
        const timelineSection = document.querySelector('.section-timeline');
        
        if (thoughtsSection) {
            thoughtsSection.classList.add('editing');
            const thoughtsBtn = document.querySelector('.thoughts-edit-btn');
            if (thoughtsBtn) thoughtsBtn.textContent = 'looks good';
        }
        
        if (timelineSection) {
            timelineSection.classList.add('editing');
        }
    }
}

function addSectionEditButtons() {
    // Add edit button to thoughts section - positioned above the grid
    const thoughtsContainer = document.querySelector('.section-thoughts .section-container');
    if (thoughtsContainer) {
        const thoughtsGrid = thoughtsContainer.querySelector('.thoughts-grid');
        const editBtn = document.createElement('div');
        editBtn.className = 'section-edit-btn thoughts-edit-btn';
        editBtn.textContent = 'add/edit an entry.....';
        editBtn.onclick = () => toggleSectionEdit('thoughts');
        
        // Insert before the thoughts grid
        thoughtsContainer.insertBefore(editBtn, thoughtsGrid);
    }
    
    // Timeline section gets no visible edit button, but will be enabled when thoughts is enabled
    
    // Add logout button
    addLogoutButton();
}

function addLogoutButton() {
    // Only add if authenticated
    if (!authToken) return;
    
    // Show the logout button in the navigation
    const logoutBtn = document.querySelector('#logout-btn');
    if (logoutBtn) {
        logoutBtn.style.display = 'block';
        logoutBtn.onclick = logout;
        console.log('✅ Logout button shown');
    } else {
        console.log('❌ Logout button element not found');
    }
}

function logout() {
    // Clear session timer
    if (sessionTimeout) {
        clearTimeout(sessionTimeout);
        sessionTimeout = null;
    }
    
    // Clear auth token and session data
    authToken = null;
    localStorage.removeItem('storyEditToken');
    localStorage.removeItem('sessionStart');
    
    // Disable edit mode
    isEditMode = false;
    document.body.classList.remove('edit-mode');
    
    // Exit all edit modes
    document.querySelectorAll('.section-thoughts, .section-timeline').forEach(section => {
        section.classList.remove('editing');
    });
    
    // Reset edit button text
    document.querySelectorAll('.section-edit-btn:not(.logout-btn)').forEach(btn => {
        if (btn.classList.contains('thoughts-edit-btn')) {
            btn.textContent = 'add/edit an entry.....';
        } else if (btn.classList.contains('timeline-edit-btn')) {
            btn.textContent = 'add/edit an entry';
        }
    });
    
    // Remove all edit buttons
    removeEditButtons('thoughts');
    removeEditButtons('timeline');
    
    // Hide logout button in navigation
    const logoutBtn = document.querySelector('#logout-btn');
    if (logoutBtn) logoutBtn.style.display = 'none';
    
    showNotification('Logged out successfully');
}

function startSessionTimer() {
    // Clear existing timer
    if (sessionTimeout) {
        clearTimeout(sessionTimeout);
    }
    
    // Set new timer
    sessionTimeout = setTimeout(() => {
        logout();
        showNotification('⏰ Session expired due to inactivity');
    }, SESSION_DURATION);
}

function resetSessionTimer() {
    if (authToken && isEditMode) {
        localStorage.setItem('sessionStart', Date.now().toString());
        startSessionTimer();
    }
}

async function toggleSectionEdit(sectionType) {
    const editBtn = document.querySelector(`.section-${sectionType} .section-edit-btn`);
    
    if (!authToken) {
        // Show password modal instead of prompt
        showPasswordModal(sectionType);
        return;
    }
    
    // Toggle edit mode for this section
    const section = document.querySelector(`.section-${sectionType}`);
    const isEditing = section.classList.contains('editing');
    
    if (isEditing) {
        // Instead of just exiting edit mode, logout completely
        logout();
    } else {
        // Enter edit mode
        section.classList.add('editing');
        editBtn.textContent = 'looks good';
        addEditButtons(sectionType);
    }
}

function showPasswordModal(sectionType) {
    const modal = document.createElement('div');
    modal.className = 'password-modal';
    modal.innerHTML = `
        <div class="password-modal-content">
            <h3> enter password</h3>
            <div class="password-input-container">
                <input type="password" id="edit-password" placeholder="" autocomplete="current-password">
                <div class="password-toggle" onclick="togglePasswordVisibility()"></div>
            </div>
            <div class="password-buttons">
                <button class="primary-btn" onclick="authenticateForSection('${sectionType}')">Unlock</button>
                <button class="secondary-btn" onclick="closePasswordModal()">Cancel</button>
            </div>
        </div>
        <div class="modal-backdrop" onclick="closePasswordModal()"></div>
    `;
    document.body.appendChild(modal);
    
    // Focus password input
    setTimeout(() => {
        const passwordInput = document.getElementById('edit-password');
        passwordInput.focus();
        
        // Enter key to submit
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                authenticateForSection(sectionType);
            }
        });
    }, 100);
}

function togglePasswordVisibility() {
    const passwordInput = document.getElementById('edit-password');
    const toggleBtn = document.querySelector('.password-toggle');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleBtn.textContent = '';
    } else {
        passwordInput.type = 'password';
        toggleBtn.textContent = '';
    }
}

function closePasswordModal() {
    const modal = document.querySelector('.password-modal');
    if (modal) modal.remove();
}

async function authenticateForSection(sectionType) {
    const password = document.getElementById('edit-password').value;
    
    if (!password) {
        showNotification(' Please enter a password');
        return;
    }
    
    // Show loading state
    const unlockBtn = document.querySelector('.password-modal .primary-btn');
    const originalText = unlockBtn.textContent;
    unlockBtn.textContent = 'Authenticating...';
    unlockBtn.disabled = true;
    
    try {
        // Test authentication by trying to fetch existing data instead of creating test entries
        const response = await fetch('/api/content?type=thoughts', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + password
            }
        });
        
        if (response.ok) {
            authToken = password;
            localStorage.setItem('storyEditToken', password);
            localStorage.setItem('sessionStart', Date.now().toString());
            closePasswordModal();
            showNotification(' Authentication successful');
            startSessionTimer();
            
            // Set global edit mode to true
            isEditMode = true;
            document.body.classList.add('edit-mode');
            
            // Enable both thoughts and timeline sections for editing
            const thoughtsSection = document.querySelector('.section-thoughts');
            const timelineSection = document.querySelector('.section-timeline');
            
            if (thoughtsSection) {
                thoughtsSection.classList.add('editing');
                const thoughtsBtn = document.querySelector('.thoughts-edit-btn');
                if (thoughtsBtn) thoughtsBtn.textContent = 'looks good';
                addEditButtons('thoughts');
            }
            
            if (timelineSection) {
                timelineSection.classList.add('editing');
                // Timeline has no visible button, but enable editing
                addEditButtons('timeline');
            }
            
        } else {
            const errorData = await response.json();
            if (response.status === 429) {
                showNotification(`🔒 ${errorData.error}`);
            } else {
                showNotification(' Invalid password');
            }
            unlockBtn.textContent = originalText;
            unlockBtn.disabled = false;
            
            // Shake animation for wrong password
            const modal = document.querySelector('.password-modal-content');
            modal.style.animation = 'shake 0.5s ease-in-out';
            setTimeout(() => {
                modal.style.animation = '';
            }, 500);
        }
    } catch (error) {
        showNotification(' Authentication failed');
        unlockBtn.textContent = originalText;
        unlockBtn.disabled = false;
        console.error('Auth error:', error);
    }
}

function addEditButtons(sectionType) {
    console.log(`Adding edit buttons for ${sectionType}`);
    
    if (sectionType === 'thoughts') {
        addNewThoughtButton();
        makeThoughtsEditable();
    } else if (sectionType === 'timeline') {
        addNewTimelineButton();
        makeTimelineEditable();
    }
}

function removeEditButtons(sectionType) {
    if (sectionType === 'thoughts') {
        document.querySelectorAll('.section-thoughts .add-new-btn, .section-thoughts .edit-btn, .section-thoughts .delete-btn').forEach(btn => btn.remove());
        document.querySelectorAll('.section-thoughts .thought-card').forEach(item => {
            item.classList.remove('editable');
            item.onclick = null;
        });
    } else if (sectionType === 'timeline') {
        document.querySelectorAll('.section-timeline .add-new-btn, .section-timeline .edit-btn, .section-timeline .delete-btn').forEach(btn => btn.remove());
        document.querySelectorAll('.section-timeline .timeline-content').forEach(item => {
            item.classList.remove('editable');
            item.onclick = null;
        });
    }
}

function addNewThoughtButton() {
    const thoughtsGrid = document.querySelector('.thoughts-grid');
    
    // Check if add button already exists
    if (thoughtsGrid && thoughtsGrid.querySelector('.add-new-btn')) {
        console.log('Thoughts add button already exists, skipping');
        return;
    }
    
    const addBtn = document.createElement('div');
    addBtn.className = 'thought-card add-new-btn';
    addBtn.innerHTML = `
        <div class="add-new-content">
            <div class="add-icon">+</div>
            <div class="add-text">add new thought</div>
        </div>
    `;
    addBtn.onclick = () => showNewThoughtModal();
    thoughtsGrid.insertBefore(addBtn, thoughtsGrid.firstChild);
}

function addNewTimelineButton() {
    const timelineContainer = document.querySelector('.timeline-container');
    console.log('Timeline container found:', timelineContainer);
    
    // Check if add button already exists
    if (timelineContainer && timelineContainer.querySelector('.add-new-btn')) {
        console.log('Timeline add button already exists, skipping');
        return;
    }
    
    if (!timelineContainer) {
        console.log('Timeline container NOT found');
        return;
    }
    
    const addBtn = document.createElement('div');
    addBtn.className = 'timeline-item add-new-btn';
    addBtn.innerHTML = `
        <div class="timeline-marker"></div>
        <div class="timeline-content">
            <div class="add-new-content">
                <div class="add-icon">+</div>
                <div class="add-text">add new timeline entry</div>
            </div>
        </div>
    `;
    addBtn.onclick = () => showNewTimelineModal();
    
    // Insert after the timeline line if it exists
    const timelineLine = timelineContainer.querySelector('.timeline-line');
    if (timelineLine) {
        timelineContainer.insertBefore(addBtn, timelineLine.nextSibling);
    } else {
        timelineContainer.insertBefore(addBtn, timelineContainer.firstChild);
    }
    console.log('Timeline add button created and inserted');
}

function makeThoughtsEditable() {
    document.querySelectorAll('.thought-card:not(.add-new-btn)').forEach(card => {
        // Skip if already has edit buttons
        if (card.querySelector('.edit-btn')) return;
        
        card.classList.add('editable');
        
        // Add edit/delete buttons
        const editBtn = document.createElement('button');
        editBtn.className = 'edit-btn';
        editBtn.innerHTML = '✏️';
        editBtn.onclick = (e) => {
            e.stopPropagation();
            editThought(card);
        };
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '🗑️';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            deleteThought(card);
        };
        
        card.appendChild(editBtn);
        card.appendChild(deleteBtn);
    });
}

function makeTimelineEditable() {
    document.querySelectorAll('.timeline-content:not(.add-new-btn .timeline-content)').forEach(content => {
        // Skip if already has edit buttons
        if (content.querySelector('.edit-btn')) return;
        
        content.classList.add('editable');
        
        // Add edit/delete buttons
        const editBtn = document.createElement('button');
        editBtn.className = 'edit-btn';
        editBtn.innerHTML = '✏️';
        editBtn.onclick = (e) => {
            e.stopPropagation();
            editTimelineEntry(content);
        };
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '🗑️';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            deleteTimelineEntry(content);
        };
        
        content.appendChild(editBtn);
        content.appendChild(deleteBtn);
    });
}

// Modal functions for adding/editing content
function showNewThoughtModal() {
    showThoughtModal({
        title: '',
        preview: '',
        tag: 'reflection'
    }, true);
}

function editThought(card) {
    const data = {
        id: card.dataset.id,
        title: card.querySelector('.thought-title').textContent,
        preview: card.querySelector('.thought-preview').textContent,
        tag: card.querySelector('.thought-tag').textContent
    };
    showThoughtModal(data, false);
}

function showThoughtModal(data, isNew) {
    const modal = document.createElement('div');
    modal.className = 'edit-modal';
    modal.innerHTML = `
        <div class="edit-modal-content">
            <h3>${isNew ? 'Add New Thought' : 'Edit Thought'}</h3>
            <form id="thought-form">
                <input type="text" id="thought-title" placeholder="Title" value="${data.title}" required>
                <select id="thought-tag">
                    <option value="reflection" ${data.tag === 'reflection' ? 'selected' : ''}>reflection</option>
                    <option value="tech" ${data.tag === 'tech' ? 'selected' : ''}>tech</option>
                    <option value="life" ${data.tag === 'life' ? 'selected' : ''}>life</option>
                    <option value="journey" ${data.tag === 'journey' ? 'selected' : ''}>journey</option>
                    <option value="code" ${data.tag === 'code' ? 'selected' : ''}>code</option>
                    <option value="memory" ${data.tag === 'memory' ? 'selected' : ''}>memory</option>
                    <option value="nostalgia" ${data.tag === 'nostalgia' ? 'selected' : ''}>nostalgia</option>
                </select>
                <textarea id="thought-preview" placeholder="Your thoughts..." required>${data.preview}</textarea>
                <div class="modal-buttons">
                    <button type="submit">${isNew ? 'Add' : 'Save'}</button>
                    <button type="button" onclick="closeEditModal()">Cancel</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    
    document.getElementById('thought-form').onsubmit = (e) => {
        e.preventDefault();
        saveThought(data.id, isNew);
    };
    
    // Focus title input
    setTimeout(() => document.getElementById('thought-title').focus(), 100);
}

function showNewTimelineModal() {
    showTimelineModal({
        period: '',
        title: '',
        description: '',
        tags: []
    }, true);
}

function editTimelineEntry(content) {
    const data = {
        id: content.parentElement.dataset.id,
        period: content.querySelector('.timeline-period').textContent,
        title: content.querySelector('.timeline-title').textContent,
        description: content.querySelector('.timeline-description').textContent,
        tags: Array.from(content.querySelectorAll('.timeline-tag')).map(tag => tag.textContent)
    };
    showTimelineModal(data, false);
}

function showTimelineModal(data, isNew) {
    const modal = document.createElement('div');
    modal.className = 'edit-modal';
    modal.innerHTML = `
        <div class="edit-modal-content">
            <h3>${isNew ? 'Add New Timeline Entry' : 'Edit Timeline Entry'}</h3>
            <form id="timeline-form">
                <input type="text" id="timeline-period" placeholder="Time period (e.g., 2021 - present)" value="${data.period}" required>
                <input type="text" id="timeline-title" placeholder="Title" value="${data.title}" required>
                <textarea id="timeline-description" placeholder="Description..." required>${data.description}</textarea>
                <input type="text" id="timeline-tags" placeholder="Tags (comma separated)" value="${data.tags.join(', ')}">
                <div class="modal-buttons">
                    <button type="submit">${isNew ? 'Add' : 'Save'}</button>
                    <button type="button" onclick="closeEditModal()">Cancel</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    
    document.getElementById('timeline-form').onsubmit = (e) => {
        e.preventDefault();
        saveTimelineEntry(data.id, isNew);
    };
    
    // Focus period input
    setTimeout(() => document.getElementById('timeline-period').focus(), 100);
}

function closeEditModal() {
    const modal = document.querySelector('.edit-modal');
    if (modal) modal.remove();
}

// Save functions
async function saveThought(id, isNew) {
    resetSessionTimer(); // Reset session on activity
    
    const title = document.getElementById('thought-title').value;
    const preview = document.getElementById('thought-preview').value;
    const tag = document.getElementById('thought-tag').value;
    
    try {
        const method = isNew ? 'POST' : 'PUT';
        const body = isNew ? { title, preview, tag } : { id, title, preview, tag };
        
        const response = await fetch('/api/content?type=thoughts', {
            method,
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        
        if (response.ok) {
            closeEditModal();
            // Maintain edit mode after reload
            isEditMode = true;
            document.body.classList.add('edit-mode');
            loadDynamicContent(); // Reload content
            showNotification(` Thought ${isNew ? 'added' : 'updated'}`);
        } else {
            showNotification(' Failed to save thought');
        }
    } catch (error) {
        showNotification(' Error saving thought');
        console.error('Save error:', error);
    }
}

async function saveTimelineEntry(id, isNew) {
    resetSessionTimer(); // Reset session on activity
    
    const period = document.getElementById('timeline-period').value;
    const title = document.getElementById('timeline-title').value;
    const description = document.getElementById('timeline-description').value;
    const tags = document.getElementById('timeline-tags').value.split(',').map(tag => tag.trim()).filter(tag => tag);
    
    try {
        const method = isNew ? 'POST' : 'PUT';
        const body = isNew ? { period, title, description, tags } : { id, period, title, description, tags };
        
        const response = await fetch('/api/content?type=timeline', {
            method,
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        
        if (response.ok) {
            closeEditModal();
            // Maintain edit mode after reload
            isEditMode = true;
            document.body.classList.add('edit-mode');
            loadDynamicContent(); // Reload content
            showNotification(` Timeline entry ${isNew ? 'added' : 'updated'}`);
        } else {
            showNotification(' Failed to save timeline entry');
        }
    } catch (error) {
        showNotification(' Error saving timeline entry');
        console.error('Save error:', error);
    }
}

// Delete functions
async function deleteThought(card) {
    if (!confirm('Are you sure you want to delete this thought?')) return;
    
    try {
        const response = await fetch('/api/content?type=thoughts', {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: card.dataset.id })
        });
        
        if (response.ok) {
            // Maintain edit mode after reload
            isEditMode = true;
            document.body.classList.add('edit-mode');
            loadDynamicContent(); // Reload content
            showNotification(' Thought deleted');
        } else {
            showNotification(' Failed to delete thought');
        }
    } catch (error) {
        showNotification(' Error deleting thought');
        console.error('Delete error:', error);
    }
}

async function deleteTimelineEntry(content) {
    if (!confirm('Are you sure you want to delete this timeline entry?')) return;
    
    try {
        const response = await fetch('/api/content?type=timeline', {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: content.parentElement.dataset.id })
        });
        
        if (response.ok) {
            // Maintain edit mode after reload
            isEditMode = true;
            document.body.classList.add('edit-mode');
            loadDynamicContent(); // Reload content
            showNotification(' Timeline entry deleted');
        } else {
            showNotification(' Failed to delete timeline entry');
        }
    } catch (error) {
        showNotification(' Error deleting timeline entry');
        console.error('Delete error:', error);
    }
}

// Load dynamic content from API
async function loadDynamicContent() {
    try {
        // Load thoughts
        const thoughtsResponse = await fetch('/api/content?type=thoughts');
        if (thoughtsResponse.ok) {
            const thoughtsData = await thoughtsResponse.json();
            renderThoughts(thoughtsData.data);
        }
        
        // Load timeline
        const timelineResponse = await fetch('/api/content?type=timeline');
        if (timelineResponse.ok) {
            const timelineData = await timelineResponse.json();
            renderTimeline(timelineData.data);
        }
    } catch (error) {
        console.error('Error loading dynamic content:', error);
    }
}

function renderThoughts(thoughts) {
    const thoughtsGrid = document.querySelector('.thoughts-grid');
    
    // Clear existing thoughts (but keep add button if in edit mode)
    const addBtn = thoughtsGrid.querySelector('.add-new-btn');
    thoughtsGrid.innerHTML = '';
    
    thoughts.forEach(thought => {
        const thoughtCard = document.createElement('article');
        thoughtCard.className = 'thought-card scroll-reveal';
        thoughtCard.dataset.id = thought.id;
        thoughtCard.innerHTML = `
            <div class="thought-meta">
                <span class="thought-date">${thought.date}</span>
                <span class="thought-tag">${thought.tag}</span>
            </div>
            <h3 class="thought-title">${thought.title}</h3>
            <p class="thought-preview">${thought.preview}</p>
        `;
        
        thoughtsGrid.appendChild(thoughtCard);
    });
    
    // Re-enable edit mode if active - check both isEditMode and section class
    const thoughtsSection = document.querySelector('.section-thoughts');
    if (isEditMode || (thoughtsSection && thoughtsSection.classList.contains('editing'))) {
        console.log('RE-ENABLING THOUGHTS EDIT MODE');
        isEditMode = true; // Ensure this is set
        document.body.classList.add('edit-mode');
        addNewThoughtButton();
        makeThoughtsEditable();
    }
    
    // Re-initialize scroll animations for new elements
    initScrollAnimations();
}

function renderTimeline(timeline) {
    const timelineContainer = document.querySelector('.timeline-container');
    
    // Clear existing timeline (but keep add button and line if in edit mode)
    const addBtn = timelineContainer.querySelector('.add-new-btn');
    const timelineLine = timelineContainer.querySelector('.timeline-line');
    timelineContainer.innerHTML = '';
    if (timelineLine) timelineContainer.appendChild(timelineLine);
    
    timeline.forEach(entry => {
        const timelineItem = document.createElement('div');
        timelineItem.className = 'timeline-item scroll-reveal';
        timelineItem.dataset.id = entry.id;
        timelineItem.innerHTML = `
            <div class="timeline-marker"></div>
            <div class="timeline-content">
                <div class="timeline-period">${entry.period}</div>
                <h3 class="timeline-title">${entry.title}</h3>
                <p class="timeline-description">${entry.description}</p>
                <div class="timeline-tags">
                    ${entry.tags.map(tag => `<span class="timeline-tag">${tag}</span>`).join('')}
                </div>
            </div>
        `;
        
        timelineContainer.appendChild(timelineItem);
    });
    
    // Re-enable edit mode if active - check both isEditMode and section class
    const timelineSection = document.querySelector('.section-timeline');
    if (isEditMode || (timelineSection && timelineSection.classList.contains('editing'))) {
        console.log('RE-ENABLING TIMELINE EDIT MODE');
        isEditMode = true; // Ensure this is set
        document.body.classList.add('edit-mode');
        addNewTimelineButton();
        makeTimelineEditable();
    }
    
    // Re-initialize scroll animations for new elements
    initScrollAnimations();
}
// Export/Sync functionality
async function exportContent() {
    try {
        showNotification(' Downloading content...');
        
        const response = await fetch('/api/content?action=export', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Export failed');
        }
        
        const result = await response.json();
        const { thoughts, timeline, timestamp } = result.data;
        
        // Create downloadable files
        downloadFile('thoughts.json', JSON.stringify(thoughts, null, 2));
        downloadFile('timeline.json', JSON.stringify(timeline, null, 2));
        
        // Create a sync info file
        const syncInfo = {
            exportedAt: timestamp,
            thoughtsCount: thoughts.length,
            timelineCount: timeline.length,
            instructions: [
                "1. Replace your local data/thoughts.json with the downloaded thoughts.json",
                "2. Replace your local data/timeline.json with the downloaded timeline.json", 
                "3. Commit and push the changes to keep your repo in sync",
                "4. Your local and live content are now synchronized!"
            ]
        };
        downloadFile('sync-info.json', JSON.stringify(syncInfo, null, 2));
        
        showNotification(' Content downloaded! Check your downloads folder');
        
    } catch (error) {
        showNotification(' Export failed');
        console.error('Export error:', error);
    }
}

function downloadFile(filename, content) {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}