// Smooth scroll for navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth'
      });
    }
  });
});

// Add scroll animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

// Initialize animations for sections and project cards
document.addEventListener('DOMContentLoaded', function() {
  // Animate main sections
  document.querySelectorAll('.about-section, .projects-section, .skills-section').forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(30px)';
    section.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
    observer.observe(section);
  });

  // Animate project cards individually
  document.querySelectorAll('.project-card').forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(40px)';
    card.style.transition = `opacity 0.8s ease ${index * 0.2}s, transform 0.8s ease ${index * 0.2}s`;
    observer.observe(card);
  });
});

// Add parallax effect to hero section
window.addEventListener('scroll', function() {
  const scrolled = window.pageYOffset;
  const parallax = document.querySelector('.hero-bg');
  const speed = scrolled * 0.5;
  
  if (parallax) {
    parallax.style.transform = `translateY(${speed}px)`;
  }
});

// Add typing effect to hero title
function typeWriter(element, text, speed = 100) {
  let i = 0;
  element.innerHTML = '';
  
  function type() {
    if (i < text.length) {
      element.innerHTML += text.charAt(i);
      i++;
      setTimeout(type, speed);
    }
  }
  
  type();
}

// Initialize typing effect when page loads
document.addEventListener('DOMContentLoaded', function() {
  const heroTitle = document.querySelector('.hero h1');
  if (heroTitle) {
    const originalText = heroTitle.textContent;
    setTimeout(() => {
      typeWriter(heroTitle, originalText, 150);
    }, 500);
  }
});

// Add hover effects to project cards
document.addEventListener('DOMContentLoaded', function() {
  const projectCards = document.querySelectorAll('.project-card');
  
  projectCards.forEach(card => {
    card.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-5px) scale(1.02)';
      this.style.transition = 'transform 0.3s ease';
    });
    
    card.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0) scale(1)';
    });
  });
});

// Add scroll progress indicator
function createScrollProgress() {
  const progressBar = document.createElement('div');
  progressBar.style.position = 'fixed';
  progressBar.style.top = '0';
  progressBar.style.left = '0';
  progressBar.style.width = '0%';
  progressBar.style.height = '2px';
  progressBar.style.backgroundColor = '#333';
  progressBar.style.zIndex = '9999';
  progressBar.style.transition = 'width 0.1s ease';
  
  document.body.appendChild(progressBar);
  
  window.addEventListener('scroll', function() {
    const scrollTop = window.pageYOffset;
    const docHeight = document.body.offsetHeight - window.innerHeight;
    const scrollPercent = (scrollTop / docHeight) * 100;
    
    progressBar.style.width = scrollPercent + '%';
  });
}

// Initialize scroll progress
document.addEventListener('DOMContentLoaded', createScrollProgress);

// Add smooth reveal animation for skills
document.addEventListener('DOMContentLoaded', function() {
  const skillItems = document.querySelectorAll('.skill-list li');
  
  const skillObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateX(0)';
        }, index * 100);
      }
    });
  }, { threshold: 0.1 });
  
  skillItems.forEach(item => {
    item.style.opacity = '0';
    item.style.transform = 'translateX(-20px)';
    item.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    skillObserver.observe(item);
  });
});

// Add animation for project images
document.addEventListener('DOMContentLoaded', function() {
  const projectImages = document.querySelectorAll('.project-img');
  
  projectImages.forEach(img => {
    img.addEventListener('mouseenter', function() {
      this.style.transform = 'scale(1.05)';
      this.style.transition = 'transform 0.3s ease';
    });
    
    img.addEventListener('mouseleave', function() {
      this.style.transform = 'scale(1)';
    });
  });
});

// Add contact info animations
document.addEventListener('DOMContentLoaded', function() {
  const contactContainers = document.querySelectorAll('.contact-info-container');
  
  contactContainers.forEach(container => {
    container.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-5px)';
      this.style.transition = 'transform 0.3s ease';
    });
    
    container.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
    });
  });
});

// Add social icons hover effects
document.addEventListener('DOMContentLoaded', function() {
  const socialIcons = document.querySelectorAll('#socials-container .icon');
  
  socialIcons.forEach(icon => {
    icon.addEventListener('mouseenter', function() {
      this.style.transform = 'scale(1.2) rotate(5deg)';
      this.style.transition = 'transform 0.3s ease';
    });
    
    icon.addEventListener('mouseleave', function() {
      this.style.transform = 'scale(1) rotate(0deg)';
    });
  });
});

// Add loading animation for profile pictures
document.addEventListener('DOMContentLoaded', function() {
  const profilePics = document.querySelectorAll('.section__pic-container img, .about-pic');
  
  profilePics.forEach(pic => {
    pic.style.opacity = '0';
    pic.style.transform = 'scale(0.8)';
    pic.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
    
    pic.addEventListener('load', function() {
      setTimeout(() => {
        this.style.opacity = '1';
        this.style.transform = 'scale(1)';
      }, 200);
    });
    
    // If image is already loaded (cached)
    if (pic.complete) {
      setTimeout(() => {
        pic.style.opacity = '1';
        pic.style.transform = 'scale(1)';
      }, 200);
    }
  });
});

// Add button click effects
document.addEventListener('DOMContentLoaded', function() {
  const buttons = document.querySelectorAll('.cta-button, .project-btn, .contact-button');
  
  buttons.forEach(button => {
    button.addEventListener('click', function(e) {
      // Create ripple effect
      const ripple = document.createElement('span');
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      ripple.classList.add('ripple');
      
      this.appendChild(ripple);
      
      setTimeout(() => {
        ripple.remove();
      }, 600);
    });
  });
});

// Add CSS for ripple effect
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
  .ripple {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.6);
    transform: scale(0);
    animation: ripple-animation 0.6s linear;
    pointer-events: none;
  }
  
  @keyframes ripple-animation {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
  
  button {
    position: relative;
    overflow: hidden;
  }
`;
document.head.appendChild(rippleStyle);

// Add section-specific animations
document.addEventListener('DOMContentLoaded', function() {
  // About section animations
  const aboutContainer = document.querySelector('.about-container');
  if (aboutContainer) {
    const aboutObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const elements = entry.target.querySelectorAll('h2, p, .section__pic_about-container');
          elements.forEach((el, index) => {
            setTimeout(() => {
              el.style.opacity = '1';
              el.style.transform = 'translateY(0)';
            }, index * 200);
          });
        }
      });
    }, { threshold: 0.3 });
    
    const elements = aboutContainer.querySelectorAll('h2, p, .section__pic_about-container');
    elements.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    });
    
    aboutObserver.observe(aboutContainer);
  }

  // Skills section animations
  const skillsColumns = document.querySelectorAll('.skills-column');
  skillsColumns.forEach((column, index) => {
    column.style.opacity = '0';
    column.style.transform = 'translateX(' + (index % 2 === 0 ? '-30px' : '30px') + ')';
    column.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
    
    const skillsObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateX(0)';
          }, index * 300);
        }
      });
    }, { threshold: 0.2 });
    
    skillsObserver.observe(column);
  });
});

// Add mobile menu toggle (for future implementation)
function toggleMobileMenu() {
  const navLinks = document.querySelector('.nav-links');
  if (navLinks) {
    navLinks.classList.toggle('active');
  }
}

// Add performance optimization for scroll events
let ticking = false;

function updateScrollEffects() {
  const scrolled = window.pageYOffset;
  const parallax = document.querySelector('.hero-bg');
  
  if (parallax) {
    parallax.style.transform = `translateY(${scrolled * 0.5}px)`;
  }
  
  // Add navbar background on scroll
  const nav = document.querySelector('nav');
  if (nav) {
    if (scrolled > 100) {
      nav.style.backgroundColor = 'rgba(245, 245, 245, 0.95)';
      nav.style.backdropFilter = 'blur(10px)';
    } else {
      nav.style.backgroundColor = '#f5f5f5';
      nav.style.backdropFilter = 'none';
    }
  }
  
  ticking = false;
}

window.addEventListener('scroll', function() {
  if (!ticking) {
    requestAnimationFrame(updateScrollEffects);
    ticking = true;
  }
});

// Add easter egg - Konami code
let konamiCode = [];
const konamiSequence = [
  'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
  'KeyB', 'KeyA'
];

document.addEventListener('keydown', function(e) {
  konamiCode.push(e.code);
  konamiCode = konamiCode.slice(-10);
  
  if (konamiCode.join(',') === konamiSequence.join(',')) {
    document.body.style.filter = 'hue-rotate(180deg)';
    document.body.style.transition = 'filter 0.5s ease';
    
    // Create celebration effect
    for (let i = 0; i < 50; i++) {
      setTimeout(() => {
        createConfetti();
      }, i * 100);
    }
    
    setTimeout(() => {
      document.body.style.filter = 'none';
    }, 3000);
  }
});

// Confetti function for easter egg
function createConfetti() {
  const confetti = document.createElement('div');
  confetti.style.position = 'fixed';
  confetti.style.width = '10px';
  confetti.style.height = '10px';
  confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 50%, 50%)`;
  confetti.style.left = Math.random() * 100 + 'vw';
  confetti.style.top = '-10px';
  confetti.style.zIndex = '10000';
  confetti.style.pointerEvents = 'none';
  confetti.style.borderRadius = '50%';
  
  document.body.appendChild(confetti);
  
  confetti.animate([
    { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
    { transform: 'translateY(100vh) rotate(720deg)', opacity: 0 }
  ], {
    duration: 3000,
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
  }).onfinish = () => confetti.remove();
}