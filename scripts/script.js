// Custom cursor functionality
const cursor = document.querySelector('.cursor');
let mouseX = 0;
let mouseY = 0;

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursor.style.left = mouseX + 'px';
    cursor.style.top = mouseY + 'px';
});

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

// Create floating particles
function createParticles() {
    const particlesContainer = document.querySelector('.particles');
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        // Random position
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        
        // Random animation delay
        particle.style.animationDelay = Math.random() * 6 + 's';
        particle.style.animationDuration = (Math.random() * 3 + 4) + 's';
        
        particlesContainer.appendChild(particle);
    }
}

// Path reveal functionality
const choosePathBtn = document.getElementById('choosePathBtn');
const pathsContainer = document.getElementById('pathsContainer');
let pathsRevealed = false;

choosePathBtn.addEventListener('mouseenter', () => {
    if (!pathsRevealed) {
        setTimeout(() => {
            revealPaths();
        }, 300);
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
    }, 400);
}

// Navigation functions
function goToCareer() {
    // Add exit animation
    document.body.style.transition = 'opacity 0.5s ease';
    document.body.style.opacity = '0';
    
    setTimeout(() => {
        window.location.href = '../pages/careerPage.html'; // Your existing portfolio
    }, 500);
}

function goToStory() {
    // Add exit animation
    document.body.style.transition = 'opacity 0.5s ease';
    document.body.style.opacity = '0';
    
    setTimeout(() => {
        window.location.href = '../pages/storyPage.html'; // Your story page
    }, 500);
}

// Initialize particles when page loads
document.addEventListener('DOMContentLoaded', () => {
    createParticles();
    
    // Add entrance animation
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 1s ease';
        document.body.style.opacity = '1';
    }, 100);
});

// Reset functionality if user moves mouse away
document.addEventListener('mouseleave', () => {
    resetPaths();
});

function resetPaths() {
    if (pathsRevealed) {
        pathsRevealed = false;
        pathsContainer.classList.remove('visible');
        choosePathBtn.classList.remove('hidden');
    }
}

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (pathsRevealed) {
        if (e.key === 'ArrowLeft' || e.key === '1') {
            goToCareer();
        } else if (e.key === 'ArrowRight' || e.key === '2') {
            goToStory();
        } else if (e.key === 'Escape') {
            resetPaths();
        }
    } else {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            revealPaths();
        }
    }
});

// Touch support for mobile
let touchStartTime = 0;

choosePathBtn.addEventListener('touchstart', (e) => {
    touchStartTime = Date.now();
});

choosePathBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    const touchDuration = Date.now() - touchStartTime;
    
    if (touchDuration > 500) { // Long press
        revealPaths();
    } else if (touchDuration < 200) { // Quick tap
        // On mobile, show paths immediately on tap
        if (!pathsRevealed) {
            revealPaths();
        }
    }
});

// Handle mobile path selection
if (window.innerWidth <= 768) {
    // On mobile, make the button more responsive
    choosePathBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (!pathsRevealed) {
            revealPaths();
        }
    });
}

// Smooth scroll prevention
document.addEventListener('wheel', (e) => {
    e.preventDefault();
}, { passive: false });

// Prevent context menu
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

// Performance optimization: Throttle mouse move events
let ticking = false;

function updateCursor() {
    cursor.style.left = mouseX + 'px';
    cursor.style.top = mouseY + 'px';
    ticking = false;
}

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    if (!ticking) {
        requestAnimationFrame(updateCursor);
        ticking = true;
    }
});