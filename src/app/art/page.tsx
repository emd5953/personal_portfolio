"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";

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
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());

  const openLightbox = (i: number) => { setLightboxIndex(i); setLightboxOpen(true); document.body.style.overflow = "hidden"; };
  const closeLightbox = useCallback(() => { setLightboxOpen(false); document.body.style.overflow = ""; }, []);
  const prev = useCallback(() => setLightboxIndex((i) => (i - 1 + photos.length) % photos.length), []);
  const next = useCallback(() => setLightboxIndex((i) => (i + 1) % photos.length), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (!lightboxOpen) return; if (e.key === "Escape") closeLightbox(); if (e.key === "ArrowLeft") prev(); if (e.key === "ArrowRight") next(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [lightboxOpen, closeLightbox, prev, next]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setVisibleSections((prev) => new Set(prev).add(e.target.id)); }),
      { threshold: 0.1, rootMargin: "0px 0px -60px 0px" }
    );
    sectionRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const ref = (id: string) => (el: HTMLElement | null) => { if (el) sectionRefs.current.set(id, el); };
  const vis = (id: string) => visibleSections.has(id) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8";

  return (
    <>
      <div className="grain" />
      <nav className="site-nav">
        <Link href="/" className="font-display text-[16px] font-semibold text-white no-underline tracking-tight">enrin</Link>
        <div className="flex gap-7">
          <Link href="/career" className="text-white/45 no-underline text-[13px] font-normal tracking-wide hover:text-white transition-colors duration-400">career</Link>
          <Link href="/story" className="text-white/45 no-underline text-[13px] font-normal tracking-wide hover:text-white transition-colors duration-400">story</Link>
          <Link href="/art" className="text-white/80 no-underline text-[13px] font-normal tracking-wide">art</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="h-[55vh] relative flex items-end pb-20 px-10 max-md:px-6 max-md:h-[45vh] max-md:pb-14">
        <div className="absolute inset-0 bg-gradient-to-b from-teal/60 via-bg/30 to-bg" />
        <div className="relative z-10 max-w-[960px] mx-auto w-full">
          <p className="text-[11px] tracking-[3px] text-text-dim lowercase mb-4 opacity-0 animate-[heroFade_2s_ease_0.3s_forwards]">films · frames · moments</p>
          <h1 className="font-display text-[clamp(2.5rem,8vw,5rem)] font-bold tracking-[-3px] leading-[0.95] text-text opacity-0 animate-[heroFade_2s_ease_0.5s_forwards]">the art</h1>
          <p className="text-text-mid text-[15px] mt-5 max-w-[480px] leading-relaxed opacity-0 animate-[heroFade_2s_ease_0.8s_forwards]">film, frames, and aesthetic moments — a visual diary</p>
        </div>
      </section>

      {/* FILMS */}
      <section id="films" ref={ref("films")} className={`py-20 px-10 border-t border-border transition-all duration-1000 ease-out max-md:py-14 max-md:px-6 ${vis("films")}`}>
        <div className="max-w-[960px] mx-auto">
          <h2 className="font-display text-[11px] tracking-[4px] text-text-dim uppercase mb-14">films</h2>
          <p className="text-text-mid text-sm mb-8">short films and cinematic moments</p>
          <div className="border border-border rounded-xl overflow-hidden hover:-translate-y-1 hover:border-text-dim/30 transition-all duration-300">
            <div className="relative pb-[56.25%] h-0 overflow-hidden">
              <iframe className="absolute inset-0 w-full h-full" src="https://www.youtube.com/embed/iuqZl8EFd4s" title="Film" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen loading="lazy" />
            </div>
            <div className="p-4">
              <span className="text-[11px] text-text-dim border border-border rounded-full px-3 py-0.5 lowercase">film</span>
            </div>
          </div>
        </div>
      </section>

      {/* PHOTOS */}
      <section id="photos" ref={ref("photos")} className={`py-20 px-10 border-t border-border transition-all duration-1000 ease-out max-md:py-14 max-md:px-6 ${vis("photos")}`}>
        <div className="max-w-[960px] mx-auto">
          <h2 className="font-display text-[11px] tracking-[4px] text-text-dim uppercase mb-14">photos</h2>
          <p className="text-text-mid text-sm mb-8">aesthetic captures and visual stories</p>
          <div className="columns-3 gap-5 max-[900px]:columns-2 max-[600px]:columns-1">
            {photos.map((photo, i) => (
              <div key={photo.src} className="break-inside-avoid mb-5 rounded-[10px] overflow-hidden relative cursor-pointer group hover:scale-[1.02] transition-transform duration-300" onClick={() => openLightbox(i)}>
                <img src={photo.src} alt="Aesthetic photo" loading="lazy" className="w-full block rounded-[10px] brightness-[0.6] saturate-[0.35] contrast-[1.15] sepia-[0.2] group-hover:brightness-[0.8] group-hover:saturate-[0.65] transition-all duration-700" />
                <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/60 to-transparent rounded-b-[10px] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-white text-sm font-medium lowercase">{photo.caption}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LIGHTBOX */}
      {lightboxOpen && (
        <div className="fixed inset-0 bg-black/92 z-[10000] flex items-center justify-center flex-col" onClick={(e) => { if (e.target === e.currentTarget) closeLightbox(); }}>
          <button className="absolute top-6 right-8 bg-transparent border-none text-white text-4xl cursor-pointer hover:opacity-70 transition-opacity z-[10001]" aria-label="Close" onClick={closeLightbox}>&times;</button>
          <button className="absolute top-1/2 left-4 -translate-y-1/2 bg-transparent border-none text-white text-5xl cursor-pointer hover:opacity-70 transition-opacity z-[10001] p-4" aria-label="Previous" onClick={(e) => { e.stopPropagation(); prev(); }}>&#8249;</button>
          <button className="absolute top-1/2 right-4 -translate-y-1/2 bg-transparent border-none text-white text-5xl cursor-pointer hover:opacity-70 transition-opacity z-[10001] p-4" aria-label="Next" onClick={(e) => { e.stopPropagation(); next(); }}>&#8250;</button>
          <img src={photos[lightboxIndex].src} alt="Full size photo" className="max-w-[90vw] max-h-[80vh] object-contain rounded-lg" />
          <div className="text-gray-400 text-sm mt-4 lowercase">{photos[lightboxIndex].caption}</div>
        </div>
      )}

      {/* FOOTER */}
      <section className="pt-16 px-10 pb-10 border-t border-border max-md:px-6">
        <div className="max-w-[700px] mx-auto flex justify-between items-start gap-10 max-md:flex-col max-md:items-center max-md:text-center max-md:gap-7">
          <div className="flex gap-8">
            {[{ href: "/", label: "home" }, { href: "/career", label: "career" }, { href: "/story", label: "story" }].map((l) => (
              <Link key={l.label} href={l.href} className="font-display text-lg font-semibold tracking-tight no-underline text-text hover:text-amber transition-colors duration-300">{l.label}</Link>
            ))}
          </div>
          <div className="flex gap-5">
            {[{ href: "mailto:nrndbrma@gmail.com", label: "email" }, { href: "https://www.linkedin.com/in/enrinjr/", label: "linkedin" }, { href: "https://github.com/emd5953", label: "github" }].map((c) => (
              <a key={c.label} href={c.href} target={c.href.startsWith("mailto") ? undefined : "_blank"} rel={c.href.startsWith("mailto") ? undefined : "noopener noreferrer"} className="text-text-dim no-underline text-xs hover:text-amber-dim transition-colors duration-300">{c.label}</a>
            ))}
          </div>
        </div>
        <p className="text-center text-[11px] text-text-faint mt-14 pt-5 border-t border-border">© 2025 enrinjr</p>
      </section>
    </>
  );
}
