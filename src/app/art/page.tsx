"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import "../art.css";

const photos = [
  { src: "/assets/songCover.jpg", caption: "talent show" },
  { src: "/assets/song1.jpg", caption: "poetic" },
  { src: "/assets/song2.jpg", caption: "vulgarity" },
  { src: "/assets/aboutme1.jpg", caption: "portrait" },
  { src: "/assets/aboutme2.jpg", caption: "portrait" },
  { src: "/assets/graduation1.jpg", caption: "graduation" },
  { src: "/assets/graduation2.jpg", caption: "graduation" },
  { src: "/assets/graduation3.jpg", caption: "graduation" },
  { src: "/assets/graduation4.jpg", caption: "graduation" },
];

export default function ArtPage() {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = (i: number) => {
    setLightboxIndex(i);
    setLightboxOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
    document.body.style.overflow = "";
  }, []);

  const prev = useCallback(() => setLightboxIndex((i) => (i - 1 + photos.length) % photos.length), []);
  const next = useCallback(() => setLightboxIndex((i) => (i + 1) % photos.length), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!lightboxOpen) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [lightboxOpen, closeLightbox, prev, next]);

  useEffect(() => {
    // Scroll animations
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("visible"); }),
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".section-header, .video-card, .photo-item").forEach((el) => {
      el.classList.add("fade-in");
      observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <nav className="art-nav">
        <Link href="/" className="nav-logo">enrin</Link>
        <div className="nav-sections">
          <a href="#films" className="nav-section">films</a>
          <a href="#photos" className="nav-section">photos</a>
        </div>
        <div className="nav-right-links">
          <Link href="/story" className="nav-link">story</Link>
          <Link href="/career" className="back-btn">career</Link>
        </div>
      </nav>

      <section className="art-hero">
        <div className="hero-content">
          <h1 className="hero-title">the art</h1>
          <p className="hero-subtitle">film, frames, and aesthetic moments — a visual diary</p>
        </div>
      </section>

      <section id="films" className="content-section section-films">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">films</h2>
            <p className="section-description">short films and cinematic moments</p>
          </div>
          <div className="video-grid">
            <div className="video-card">
              <div className="video-wrapper">
                <iframe src="https://www.youtube.com/embed/iuqZl8EFd4s" title="Film" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen loading="lazy" />
              </div>
              <div className="video-info">
                <span className="video-tag">film</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="photos" className="content-section section-photos">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">photos</h2>
            <p className="section-description">aesthetic captures and visual stories</p>
          </div>
          <div className="photo-grid">
            {photos.map((photo, i) => (
              <div key={photo.src} className="photo-item" onClick={() => openLightbox(i)}>
                <img src={photo.src} alt="Aesthetic photo" loading="lazy" />
                <div className="photo-overlay">
                  <span className="photo-caption">{photo.caption}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {lightboxOpen && (
        <div className="lightbox active" onClick={(e) => { if (e.target === e.currentTarget) closeLightbox(); }}>
          <button className="lightbox-close" aria-label="Close" onClick={closeLightbox}>&times;</button>
          <button className="lightbox-prev" aria-label="Previous" onClick={(e) => { e.stopPropagation(); prev(); }}>&#8249;</button>
          <button className="lightbox-next" aria-label="Next" onClick={(e) => { e.stopPropagation(); next(); }}>&#8250;</button>
          <img src={photos[lightboxIndex].src} alt="Full size photo" className="lightbox-img" />
          <div className="lightbox-caption">{photos[lightboxIndex].caption}</div>
        </div>
      )}

      <footer className="art-footer">
        <p>&copy; 2025 enrin debbarma &middot; <Link href="/career">career</Link> &middot; <Link href="/story">story</Link> &middot; <Link href="/">home</Link></p>
      </footer>
    </>
  );
}
