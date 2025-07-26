// Custom cursor functionality
const cursor = document.querySelector('.cursor');
let mouseX = 0;
let mouseY = 0;
let currentX = 0;
let currentY = 0;

// Update mouse position
document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

// Smooth cursor animation
function animateCursor() {
    const dx = mouseX - currentX;
    const dy = mouseY - currentY;
    
    currentX += dx * 0.2;
    currentY += dy * 0.2;
    
    cursor.style.left = currentX + 'px';
    cursor.style.top = currentY + 'px';
    
    requestAnimationFrame(animateCursor);
}

// Start cursor animation
animateCursor();

// Cursor hover effects
const hoverElements = document.querySelectorAll('.choose-path-btn, .path-content');
hoverElements.forEach(element => {
    element.addEventListener('mouseenter', () => {
        cursor.classList.add('hover');
    });
    
    element.addEventListener('mouseleave', () => {
        cursor.classList.remove('hover');
    });
});

// Path reveal functionality
const choosePathBtn = document.getElementById('choosePathBtn');
const pathsContainer = document.getElementById('pathsContainer');
let pathsRevealed = false;

choosePathBtn.addEventListener('click', () => {
    if (!pathsRevealed) {
        revealPaths();
    }
});

function revealPaths() {
    if (pathsRevealed) return;
    
    pathsRevealed = true;
    
    // Hide the button
    choosePathBtn.classList.add('hidden');
    
    // Show the paths
    setTimeout(() => {
        pathsContainer.classList.add('visible');
    }, 300);
}

// Navigation functions
function goToCareer() {
    document.body.style.transition = 'opacity 0.3s ease';
    document.body.style.opacity = '0';
    
    setTimeout(() => {
        window.location.href = '../pages/careerPage.html';
    }, 300);
}

function goToStory() {
    document.body.style.transition = 'opacity 0.3s ease';
    document.body.style.opacity = '0';
    
    setTimeout(() => {
        window.location.href = '../pages/storyPage.html';
    }, 300);
}

// Reset paths function
function resetPaths() {
    if (pathsRevealed) {
        pathsRevealed = false;
        pathsContainer.classList.remove('visible');
        choosePathBtn.classList.remove('hidden');
    }
}

// Reset page state function
function resetPageState() {
    // Reset all states
    pathsRevealed = false;
    pathsContainer.classList.remove('visible');
    choosePathBtn.classList.remove('hidden');
    
    // Reset body opacity
    document.body.style.opacity = '1';
    
    // Reset cursor position
    currentX = window.innerWidth / 2;
    currentY = window.innerHeight / 2;
    
    // Scroll to top
    window.scrollTo(0, 0);
    
    console.log('Page state reset');
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're coming back via back button
    if (performance.navigation.type === 2) {
        console.log('Page loaded from cache - resetting state');
        resetPageState();
    }
    
    // Add entrance animation
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.6s ease';
        document.body.style.opacity = '1';
    }, 100);
});

// Handle page show event (fires when coming back via back button)
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        console.log('Page restored from bfcache');
        resetPageState();
        // Force a small delay then reload to ensure clean state
        setTimeout(() => {
            window.location.reload();
        }, 10);
    }
});

// Handle visibility change
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        // Page is visible again, check if we need to reset
        if (sessionStorage.getItem('needsReset') === 'true') {
            sessionStorage.removeItem('needsReset');
            resetPageState();
        }
    }
});

// Mark that we're leaving the page
window.addEventListener('beforeunload', () => {
    sessionStorage.setItem('needsReset', 'true');
});

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (pathsRevealed) {
        switch(e.key) {
            case 'ArrowLeft':
            case '1':
                goToCareer();
                break;
            case 'ArrowRight':
            case '2':
                goToStory();
                break;
            case 'Escape':
                resetPaths();
                break;
        }
    } else {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            revealPaths();
        }
    }
});

// Touch support
let touchStartTime = 0;

choosePathBtn.addEventListener('touchstart', (e) => {
    touchStartTime = Date.now();
});

choosePathBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (!pathsRevealed) {
        revealPaths();
    }
});

// Path card keyboard support
document.querySelectorAll('.path-content').forEach(card => {
    card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            card.click();
        }
    });
});

// Hide cursor on touch devices
if ('ontouchstart' in window) {
    cursor.style.display = 'none';
}

// Smooth scroll prevention
document.addEventListener('wheel', (e) => {
    e.preventDefault();
}, { passive: false });

// Prevent context menu
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

// Window resize handler
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        // Handle any resize-specific logic
    }, 250);
});

// Export functions for external use if needed
window.goToCareer = goToCareer;
window.goToStory = goToStory;