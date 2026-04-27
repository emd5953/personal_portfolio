"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const bgVideos = [
  "/assets/videos/hero-bg.mp4",
  "/assets/videos/066c54a2118a41449477037ab040d539.mp4",
  "/assets/videos/4f3e5000c1c04199856b2b7cae303194.mp4",
  "/assets/videos/58d06fabc773491297f61d8d0cfe9204.mp4",
  "/assets/videos/6c30d6c75ad443588c4b1f36987ebc0b.mp4",
  "/assets/videos/6d17cf98e38047d092c98b07fe9cc8c8.mp4",
  "/assets/videos/7107492014e14bcab8c6313d1307c97c.mp4",
  "/assets/videos/7c061707a4344326ab7762342310a400.mp4",
  "/assets/videos/8d8f18a6ad4a46cba95f9863015150f5.mp4",
  "/assets/videos/8f4b7b6364e34dd098ca2437a85761b8.mp4",
  "/assets/videos/9364fa9aab21478baa8e25460bd484ad.mp4",
  "/assets/videos/9efea14f0cce479eb7c3bda43308a0ec.mp4",
  "/assets/videos/aa0b829d83114f2cbc0b24b52213cd75.mp4",
  "/assets/videos/ae1dc2a101db4a79940a1dbe6e4fb68e.mp4",
  "/assets/videos/c032cb96261947b9b9e4d5a58c50ebb6.mp4",
  "/assets/videos/cd64ac014c84439ca6dceb61651b2557.mp4",
  "/assets/videos/f7e7f0990fbb4c3c8e470cc757c6681d.mp4",
];

const films = [
  { id: "iuqZl8EFd4s", title: "untitled", tag: "short film" },
];

function FilmCard({ id, title, tag }: { id: string; title: string; tag: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ borderRadius: 12, overflow: "hidden", position: "relative", cursor: "pointer" }}
    >
      {hovered ? (
        <iframe
          src={`https://www.youtube.com/embed/${id}?autoplay=1&mute=1&controls=0&loop=1&playlist=${id}&modestbranding=1`}
          style={{ width: "100%", aspectRatio: "16/9", border: "none", display: "block" }}
          allow="autoplay; encrypted-media"
          loading="lazy"
        />
      ) : (
        <img
          src={`https://img.youtube.com/vi/${id}/maxresdefault.jpg`}
          alt={title}
          style={{
            width: "100%", aspectRatio: "16/9", objectFit: "cover", display: "block",
          }}
        />
      )}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, padding: 20,
        background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
        pointerEvents: "none",
      }}>
        <p style={{ fontSize: 15, color: "var(--color-text)", fontWeight: 600, margin: 0, textTransform: "lowercase" }}>{title}</p>
        <span style={{ fontSize: 11, color: "var(--color-text-dim)" }}>{tag}</span>
      </div>
    </div>
  );
}

export default function ArtPage() {
  const [bgVideo, setBgVideo] = useState("");

  useEffect(() => {
    setBgVideo(bgVideos[Math.floor(Math.random() * bgVideos.length)]);
  }, []);

  return (
    <>
      <div className="grain" />
      {/* Video background */}
      <div style={{ position: "fixed", inset: 0, zIndex: -1, overflow: "hidden" }}>
        {bgVideo && (
          <video key={bgVideo} autoPlay muted loop playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }}>
            <source src={bgVideo} type="video/mp4" />
          </video>
        )}
      </div>

      <nav className="site-nav">
        <Link href="/" className="font-display text-[16px] font-semibold text-white no-underline tracking-tight">enrin</Link>
        <div className="flex gap-7">
          <Link href="/career" className="text-white/45 no-underline text-[13px] font-normal tracking-wide hover:text-white transition-colors duration-400">career</Link>
          <Link href="/story" className="text-white/45 no-underline text-[13px] font-normal tracking-wide hover:text-white transition-colors duration-400">story</Link>
          <Link href="/art" className="text-white/80 no-underline text-[13px] font-normal tracking-wide">art</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 40px", textShadow: "0 2px 10px rgba(0,0,0,0.8), 0 0 30px rgba(0,0,0,0.5)" }}>

        {/* HERO */}
        <section style={{ paddingTop: 20, paddingBottom: 60, position: "relative", zIndex: 1 }}>
          <h1 className="font-display" style={{ fontSize: "clamp(2.5rem, 8vw, 5.5rem)", fontWeight: 700, letterSpacing: -4, lineHeight: 0.9, color: "var(--color-text)" }}>the art</h1>
          <p style={{ fontSize: 13, color: "var(--color-text-dim)", marginTop: 16 }}>films · frames · moments</p>
        </section>

        {/* FILMS */}
        <section style={{ padding: "60px 0 80px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ fontSize: 18, fontWeight: 600, color: "var(--color-text)", textTransform: "uppercase", letterSpacing: "-0.02em", marginBottom: 32 }}>Films</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
            {films.map((f) => <FilmCard key={f.id} {...f} />)}
          </div>
        </section>
      </div>


    </>
  );
}
