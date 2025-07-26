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

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    // Add entrance animation
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.6s ease';
        document.body.style.opacity = '1';
    }, 100);
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

// Handle visibility change (pause animations when tab is not visible)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Pause animations if needed
    } else {
        // Resume animations if needed
    }
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