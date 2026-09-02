"use client";

import { useState, useEffect, useRef } from "react";

/* Horizontally scrollable photo strip — shared by the landing and career page. */
export default function PhotoRow({ photos }: { photos: string[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showHint, setShowHint] = useState(true);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || photos.length <= 2) { setShowHint(false); return; }
    // Nudge scroll to hint
    const timer = setTimeout(() => {
      el.scrollTo({ left: 60, behavior: "smooth" });
      setTimeout(() => el.scrollTo({ left: 0, behavior: "smooth" }), 600);
    }, 800);
    const onScroll = () => setShowHint(false);
    el.addEventListener("scroll", onScroll, { once: true });
    return () => { clearTimeout(timer); el.removeEventListener("scroll", onScroll); };
  }, [photos.length]);

  if (!photos.length) return null;

  return (
    <div className="photo-row">
      <div ref={scrollRef} className="photo-strip">
        {photos.map((src) => (
          <img key={src} src={src} alt="" loading="lazy" className="photo-shot" />
        ))}
      </div>
      {showHint && photos.length > 2 && (
        <div className="photo-hint">
          <span>›</span>
        </div>
      )}
    </div>
  );
}
