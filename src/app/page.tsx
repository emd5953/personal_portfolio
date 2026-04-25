"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import "./landing.css";

const heroImages = Array.from({ length: 10 }, (_, i) => `/assets/landing/${i + 1}.jpg`);
const heroPositions = [
  "center 20%", "center 20%", "center 20%", "20% 69%", "65% 55%",
  "50% 70%", "52% 43%", "center 20%", "center 20%", "center 20%",
];

const reelImages = [
  "101_0310.JPG", "101_0351.JPEG",
  "6438b6dd-efc1-4111-b526-514d85313b19.JPG",
  "8f4a1cf2-5864-4f53-a8fb-7e61c77dafb8.JPG",
  "IMG_0477.jpg", "IMG_0532.jpg", "IMG_0550.jpg", "IMG_1210.jpg",
  "IMG_6910.jpg", "IMG_6955.jpg", "IMG_7103.jpg", "IMG_7220.jpg",
  "IMG_7769.JPG", "IMG_7838.jpg", "IMG_8363.JPG", "IMG_9498.JPG",
  "IMG_9919.jpg", "a023b683-71c9-47c5-ac18-c4c693423a79.jpg",
  "about-pic.jpg", "aboutme1.jpg", "aboutme2.jpg",
  "song1.jpg", "song2.jpg", "songCover.jpg",
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function LandingPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [timeStr, setTimeStr] = useState("");
  const [easterEggVisible, setEasterEggVisible] = useState(false);
  const [realVisible, setRealVisible] = useState(false);
  const [shuffledReel, setShuffledReel] = useState<string[]>([]);
  const reelRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const realRef = useRef<HTMLDivElement>(null);

  // Shuffle reel on mount
  useEffect(() => {
    const shuffled = shuffleArray(reelImages);
    setShuffledReel([...shuffled, ...shuffled]);
  }, []);

  // Hero slideshow
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Timestamp
  useEffect(() => {
    function update() {
      const now = new Date();
      const h = now.getHours();
      const m = String(now.getMinutes()).padStart(2, "0");
      const period = h >= 12 ? "pm" : "am";
      setTimeStr(`${h % 12 || 12}:${m} ${period}`);
    }
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, []);

  // Scroll reveal for "real" section
  useEffect(() => {
    const el = realRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setRealVisible(true);
        });
      },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Reel drift + drag
  useEffect(() => {
    const reel = reelRef.current;
    const track = trackRef.current;
    if (!reel || !track) return;

    let drifting = true;
    let driftId: number;
    let isDown = false;
    let startX = 0;
    let scrollStart = 0;
    let velX = 0;
    let lastX = 0;
    let lastTime = 0;
    let momentumId: number;

    const r = reel;
    const t = track;

    function startDrift() {
      drifting = true;
      function step() {
        if (!drifting) return;
        r.scrollLeft += 0.4;
        if (r.scrollLeft >= t.scrollWidth / 2) {
          r.scrollLeft -= t.scrollWidth / 2;
        }
        driftId = requestAnimationFrame(step);
      }
      step();
    }

    function stopDrift() {
      drifting = false;
      cancelAnimationFrame(driftId);
    }

    startDrift();

    const onMouseDown = (e: MouseEvent) => {
      isDown = true;
      stopDrift();
      cancelAnimationFrame(momentumId);
      startX = e.pageX;
      scrollStart = r.scrollLeft;
      lastX = e.pageX;
      lastTime = Date.now();
      velX = 0;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      r.scrollLeft = scrollStart - (e.pageX - startX);
      const now = Date.now();
      const dt = now - lastTime;
      if (dt > 0) velX = ((lastX - e.pageX) / dt) * 16;
      lastX = e.pageX;
      lastTime = now;
    };

    const onMouseUp = () => {
      if (!isDown) return;
      isDown = false;
      applyMomentum();
    };

    const onTouchStart = (e: TouchEvent) => {
      isDown = true;
      stopDrift();
      cancelAnimationFrame(momentumId);
      startX = e.touches[0].pageX;
      scrollStart = r.scrollLeft;
      lastX = e.touches[0].pageX;
      lastTime = Date.now();
      velX = 0;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDown) return;
      const px = e.touches[0].pageX;
      r.scrollLeft = scrollStart - (px - startX);
      const now = Date.now();
      const dt = now - lastTime;
      if (dt > 0) velX = ((lastX - px) / dt) * 16;
      lastX = px;
      lastTime = now;
    };

    const onTouchEnd = () => {
      if (!isDown) return;
      isDown = false;
      applyMomentum();
    };

    function applyMomentum() {
      function step() {
        velX *= 0.94;
        r.scrollLeft += velX;
        if (r.scrollLeft >= t.scrollWidth / 2) {
          r.scrollLeft -= t.scrollWidth / 2;
        } else if (r.scrollLeft <= 0) {
          r.scrollLeft += t.scrollWidth / 2;
        }
        if (Math.abs(velX) > 0.3) {
          momentumId = requestAnimationFrame(step);
        } else {
          startDrift();
        }
      }
      step();
    }

    r.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    r.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);

    return () => {
      stopDrift();
      cancelAnimationFrame(momentumId);
      r.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      r.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [shuffledReel]);

  const handleEasterEgg = useCallback(() => {
    if (!easterEggVisible) {
      setEasterEggVisible(true);
      setTimeout(() => setEasterEggVisible(false), 3000);
    }
  }, [easterEggVisible]);

  const titleLetters = "enrin".split("");
  const subtitleText = "engineer / filmmaker / creative";

  return (
    <>
      <div className="grain" />

      <nav className="nav">
        <Link href="/" className="nav-name">enrin</Link>
        <div className="nav-links">
          <Link href="/career">career</Link>
          <Link href="/story">story</Link>
          <Link href="/art">art</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-slides">
          {heroImages.map((src, i) => (
            <img
              key={src}
              src={src}
              alt=""
              className={`hero-slide ${i === currentSlide ? "active" : ""}`}
              style={{ objectPosition: heroPositions[i] }}
            />
          ))}
        </div>
        <div className="hero-wash" />
        <div className="hero-content">
          <h1 className="title">
            {titleLetters.map((letter, i) => (
              <span key={i} className="t-letter" style={{ animationDelay: `${0.3 + i * 0.2}s` }}>
                {letter}
              </span>
            ))}
          </h1>
          <p className="subtitle">
            {subtitleText.split("").map((char, i) => (
              <span key={i} className="s-letter" style={{ animationDelay: `${2.0 + i * 0.03}s` }}>
                {char}
              </span>
            ))}
          </p>
        </div>
        <div className="hero-bottom">
          <span className="hero-loc">brooklyn, ny</span>
          <span className="hero-now">{timeStr}</span>
        </div>
      </section>

      {/* REAL SECTION */}
      <section className="real">
        <div ref={realRef} className={`real-inner ${realVisible ? "visible" : ""}`}>
          <div className="real-left" onClick={handleEasterEgg}>
            <div className="real-photo-col">
              <img src="/assets/aboutme1.jpg" alt="Enrin" className="real-photo" />
            </div>
            <p className={`easter-egg ${easterEggVisible ? "show" : ""}`}>
              matcha is overrated btw
            </p>
          </div>
          <div className="real-text-col">
            <p className="real-p real-big">
              i&apos;m enrin. i write code for startups during the week and make short films on weekends.
            </p>
            <p className="real-p">
              right now i&apos;m a forward deployed engineer based in nyc — building products from zero to one. ai, product, agents, workflows, integrations the whole thing.
            </p>
            <p className="real-p">
              before that i was a swe lead, and also hacking at YC hackathons in SF, Stanford &amp; Columbia building AI tools. i graduated with a CS degree, an outstanding senior award and as an entrepreneur scholar.
            </p>
            <p className="real-p real-dim">
              when i&apos;m not shipping code i&apos;m shooting film, playing guitar, hooping, or trying to catch golden hour before it disappears. i like afrobeats, r&amp;b, going out, and being outside. people say i&apos;m performative but i genuinely hate matcha.
            </p>
          </div>
        </div>
      </section>

      {/* WORK STRIP */}
      <section className="work-strip">
        <Link href="/career" className="work-banner">
          <span className="work-banner-text">see what i&apos;ve been building →</span>
          <span className="work-banner-sub">career · projects · experience</span>
        </Link>
      </section>

      {/* PHOTO REEL */}
      <section className="reel" ref={reelRef}>
        <div className="reel-glow reel-glow-teal" />
        <div className="reel-glow reel-glow-amber" />
        <div className="reel-track" ref={trackRef}>
          {shuffledReel.map((img, i) => (
            <img key={`${img}-${i}`} src={`/assets/${img}`} alt="" loading="lazy" />
          ))}
        </div>
      </section>

      {/* END */}
      <section className="end">
        <div className="end-inner">
          <div className="end-links">
            <Link href="/career" className="end-link">
              <span className="end-num">01</span>
              <span className="end-label">career</span>
            </Link>
            <Link href="/story" className="end-link">
              <span className="end-num">02</span>
              <span className="end-label">story</span>
            </Link>
            <Link href="/art" className="end-link">
              <span className="end-num">03</span>
              <span className="end-label">art</span>
            </Link>
          </div>
          <div className="end-contact">
            <a href="mailto:nrndbrma@gmail.com">email</a>
            <a href="https://www.linkedin.com/in/enrinjr/" target="_blank" rel="noopener noreferrer">linkedin</a>
            <a href="https://github.com/emd5953" target="_blank" rel="noopener noreferrer">github</a>
            <a href="/assets/ResumeEnrinDebbarma.pdf" target="_blank" rel="noopener noreferrer">resume</a>
          </div>
        </div>
        <p className="end-copy">© 2025 enrinjr</p>
      </section>
    </>
  );
}
