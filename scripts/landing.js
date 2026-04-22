document.addEventListener('DOMContentLoaded', () => {
  initHeroSlideshow();
  initTimeStamp();
  initScrollReveal();
  initEasterEgg();
  initReelDuplicate();
});

// Hero crossfade — slow, like flipping through memories
function initHeroSlideshow() {
  const slides = document.querySelectorAll('.hero-slide');
  if (slides.length < 2) return;

  let current = 0;

  setInterval(() => {
    slides[current].classList.remove('active');
    current = (current + 1) % slides.length;
    slides[current].classList.add('active');
  }, 5000);
}

// Show current time in hero — grounds it in the present
function initTimeStamp() {
  const el = document.getElementById('hero-now');
  if (!el) return;

  function update() {
    const now = new Date();
    const h = now.getHours();
    const m = String(now.getMinutes()).padStart(2, '0');
    const period = h >= 12 ? 'pm' : 'am';
    const h12 = h % 12 || 12;
    el.textContent = `${h12}:${m} ${period}`;
  }

  update();
  setInterval(update, 30000);
}

// Scroll reveal
function initScrollReveal() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) e.target.classList.add('visible');
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.real-inner').forEach(el => observer.observe(el));
}

// Easter egg — click the photo
function initEasterEgg() {
  const col = document.querySelector('.real-left');
  const egg = document.getElementById('easter-egg');
  if (!col || !egg) return;

  let shown = false;
  col.addEventListener('click', () => {
    if (!shown) {
      egg.classList.add('show');
      shown = true;
      setTimeout(() => {
        egg.classList.remove('show');
        shown = false;
      }, 3000);
    }
  });
}

// Duplicate reel images for seamless loop
function initReelDuplicate() {
  const track = document.getElementById('reel-track');
  if (!track) return;
  track.innerHTML += track.innerHTML;
}
