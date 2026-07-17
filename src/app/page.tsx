"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import gsap from "gsap";
import "./landing.css";

const heroImages = Array.from({ length: 10 }, (_, i) => `/assets/landing/${i + 1}.jpg`);
const heroPositions = [
  "center 20%", "center 20%", "center 20%", "20% 69%", "65% 55%",
  "50% 70%", "52% 43%", "center 20%", "center 20%", "center 20%",
];

const projects = [
  { img: "/assets/career/aspot.png", title: "aSpot", tags: "tavily . next.js . supabase . resend ", desc: "AI itinerary platform giving you curated plans in minutes", href: "https://aspot-monolith.vercel.app" },
  { img: "/assets/career/leaseIQ.png", title: "LeaseIQ", tags: "firecrawl · reducto . open router. render", desc: "Smart apartment hunting & lease analysis platform", href: "https://lease-iq.vercel.app/" },
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
  const [shuffledHero, setShuffledHero] = useState<{ src: string; pos: string }[]>(
    heroImages.map((src, i) => ({ src, pos: heroPositions[i] }))
  );
  const realRef = useRef<HTMLDivElement>(null);
  const bannerArrowRef = useRef<HTMLSpanElement>(null);

  const handleBannerEnter = useCallback(() => {
    gsap.to(bannerArrowRef.current, { x: 14, duration: 0.6, ease: "back.out(4)" });
  }, []);

  const handleBannerLeave = useCallback(() => {
    gsap.to(bannerArrowRef.current, { x: 0, duration: 0.5, ease: "power3.out" });
  }, []);

  // Shuffle hero order on mount
  useEffect(() => {
    setShuffledHero(shuffleArray(heroImages.map((src, i) => ({ src, pos: heroPositions[i] }))));
  }, []);

  // Hero slideshow
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % shuffledHero.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [shuffledHero]);

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

  const handleEasterEgg = useCallback(() => {
    if (!easterEggVisible) {
      setEasterEggVisible(true);
      setTimeout(() => setEasterEggVisible(false), 3000);
    }
  }, [easterEggVisible]);

  const titleLetters = "enrin".split("");
  const subtitleText = "tech / film / art";

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
          {shuffledHero.map((hero, i) => (
            <img
              key={hero.src}
              src={hero.src}
              alt=""
              className={`hero-slide ${i === currentSlide ? "active" : ""}`}
              style={{ objectPosition: hero.pos }}
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
              i know every brent & daniel caeser song word for word
            </p>
          </div>
          <div className="real-text-col">
            <p className="real-p real-big">
              intro
            </p>
            <p className="real-p">
              based in nyc, i work as a forward deployed engineer. naturally fell in the ai startup space and i seem to enjoy growing products from scratch
            </p>
            <p className="real-p">
              things i enjoy building are consumer-focused apps, agentic systems & visuals that speak life.
            </p>
            <p className="real-p real-dim">
              i love film, fashion, sports, music. making sure to catch a sunset atleast once a week
            </p>
          </div>
        </div>
      </section>

      {/* WORK STRIP */}
      <section className="work-strip">
        <div className="work-banner-wrap">
          <Link
            href="/career"
            className="work-banner"
            onMouseEnter={handleBannerEnter}
            onMouseLeave={handleBannerLeave}
          >
            <span className="work-banner-text">
              recents <span ref={bannerArrowRef} className="work-banner-arrow">→</span>
            </span>
            <span className="work-banner-sub">what have i beeen upto?</span>
          </Link>
        </div>
        <div className="work-reel">
          <div className="work-reel-track">
            {projects.map((p) => (
              <a key={p.title} href={p.href} target="_blank" rel="noopener noreferrer" className="work-card">
                <div className="work-card-frame">
                  <img src={p.img} alt={p.title} className="work-card-shot" />
                </div>
                <div className="work-card-info">
                  <span className="work-card-title">{p.title}</span>
                  <span className="work-card-tags">{p.tags}</span>
                </div>
                <p className="work-card-desc">{p.desc}</p>
              </a>
            ))}
          </div>
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
            <a href="https://www.linkedin.com/in/enrinjr/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg></a>
            <a href="https://github.com/emd5953" target="_blank" rel="noopener noreferrer" aria-label="GitHub"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg></a>
            <a href="mailto:nrndbrma@gmail.com" aria-label="Email"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/></svg></a>
          </div>
        </div>
        <p className="end-copy">© 2026 enrinjr</p>
      </section>
    </>
  );
}
