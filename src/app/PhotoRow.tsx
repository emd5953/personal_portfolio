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
    <div style={{ position: "relative", marginTop: 12 }}>
      <div ref={scrollRef} className="[&::-webkit-scrollbar]:hidden" style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none" }}>
        {photos.map((src) => (
          <img
            key={src}
            src={src}
            alt=""
            loading="lazy"
            style={{
              height: 220,
              borderRadius: 8,
              objectFit: "cover",
              flexShrink: 0,
              transition: "filter 0.5s ease",
            }}
          />
        ))}
      </div>
      {showHint && photos.length > 2 && (
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 60, background: "linear-gradient(to left, rgba(10,13,15,0.8), transparent)", pointerEvents: "none", borderRadius: "0 8px 8px 0", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 18, animation: "scrollHint 1.5s ease-in-out infinite" }}>›</span>
        </div>
      )}
    </div>
  );
}
