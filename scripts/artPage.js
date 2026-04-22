document.addEventListener('DOMContentLoaded', function () {
    initNavHighlight();
    initScrollAnimations();
    initLightbox();
});

// Highlight active nav section on scroll
function initNavHighlight() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-section');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(s => {
            if (s.getBoundingClientRect().top <= 120) current = s.id;
        });
        navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
        });
    });
}

// Fade-in on scroll
function initScrollAnimations() {
    const els = document.querySelectorAll('.section-header, .video-card, .photo-item');
    els.forEach(el => el.classList.add('fade-in'));

    const observer = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) e.target.classList.add('visible');
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    els.forEach(el => observer.observe(el));
}

// Lightbox for photos
function initLightbox() {
    const lightbox = document.getElementById('lightbox');
    const lbImg = document.getElementById('lightbox-img');
    const lbCaption = document.getElementById('lightbox-caption');
    const photos = Array.from(document.querySelectorAll('.photo-item'));
    let currentIndex = 0;

    photos.forEach((item, i) => {
        item.addEventListener('click', () => {
            currentIndex = i;
            openLightbox();
        });
    });

    function openLightbox() {
        const img = photos[currentIndex].querySelector('img');
        const caption = photos[currentIndex].querySelector('.photo-caption');
        lbImg.src = img.src;
        lbCaption.textContent = caption ? caption.textContent : '';
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }

    document.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });

    document.querySelector('.lightbox-prev').addEventListener('click', e => {
        e.stopPropagation();
        currentIndex = (currentIndex - 1 + photos.length) % photos.length;
        openLightbox();
    });

    document.querySelector('.lightbox-next').addEventListener('click', e => {
        e.stopPropagation();
        currentIndex = (currentIndex + 1) % photos.length;
        openLightbox();
    });

    document.addEventListener('keydown', e => {
        if (!lightbox.classList.contains('active')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') { currentIndex = (currentIndex - 1 + photos.length) % photos.length; openLightbox(); }
        if (e.key === 'ArrowRight') { currentIndex = (currentIndex + 1) % photos.length; openLightbox(); }
    });
}
