"use client";

import { useState, useEffect, useRef, useCallback, type RefObject } from "react";
import Link from "next/link";

const BG_TRACK = "/assets/art/Brent Faiyaz - Came Right Back.mp3";

const bgVideos = [
  "/assets/videos/bg3.mp4",
  "/assets/videos/bg4.mp4",
  "/assets/videos/bg5.mp4",
  "/assets/videos/bg2.mp4",
  "/assets/videos/bg7.mp4",
];

const films = [
  "/assets/videos/58d06fabc773491297f61d8d0cfe9204.mp4",
  "/assets/videos/7c061707a4344326ab7762342310a400.mp4",
  "/assets/videos/850812c039434f97b74b340a741aecae.mp4",
  "/assets/videos/8f4b7b6364e34dd098ca2437a85761b8.mp4",
  "/assets/videos/aa0b829d83114f2cbc0b24b52213cd75.mp4",
  "/assets/videos/f7e7f0990fbb4c3c8e470cc757c6681d.mp4",
  "/assets/videos/bg1.mp4",
  "/assets/videos/bg2.mp4",
  "/assets/videos/bg3.mp4",
  "/assets/videos/bg4.mp4",
  "/assets/videos/bg5.mp4",
  "/assets/videos/bg7.mp4",
  "/assets/videos/bg8.mp4",
];

const offsets = [
  { rotate: -1.2, y: 14 },
  { rotate: 0.8, y: -20 },
  { rotate: -0.5, y: 10 },
  { rotate: 1.5, y: -12 },
  { rotate: -1.8, y: 22 },
];

function FilmCard({ src, index, onSelect }: { src: string; index: number; onSelect: (src: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const o = offsets[index % offsets.length];
  const [dragging, setDragging] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const cardRect = useRef<DOMRect | null>(null);
  const didDrag = useRef(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) el.play().catch(() => {});
        else el.pause();
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      didDrag.current = true;
      setDragPos({ x: e.clientX, y: e.clientY });
    };
    const onUp = (e: MouseEvent) => {
      setDragging(false);
      if (didDrag.current && e.clientY < window.innerHeight * 0.6) {
        onSelect(src);
      }
      didDrag.current = false;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [dragging, src, onSelect]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).closest("div")!.getBoundingClientRect();
    cardRect.current = rect;
    setDragPos({ x: e.clientX, y: e.clientY });
    setDragging(true);
    setShowHint(false);
    didDrag.current = false;
  };

  return (
    <>
      <div style={{ position: "relative", flexShrink: 0 }}>
        <video
          ref={videoRef}
          src={src}
          muted
          loop
          playsInline
          preload="metadata"
          onMouseDown={handleMouseDown}
          onClick={() => { if (!didDrag.current) setShowHint(true); }}
          style={{
            height: 150,
            minWidth: 280,
            width: "auto",
            flexShrink: 0,
            borderRadius: 6,
            objectFit: "cover",
            display: "block",
            filter: "brightness(0.45)",
            transform: `rotate(${o.rotate}deg) translateY(${o.y}px)`,
            transition: dragging ? "none" : "transform 0.6s ease, filter 0.4s ease",
            cursor: "grab",
          }}
          onMouseEnter={(e) => { if (!dragging) { e.currentTarget.style.transform = "rotate(0deg) translateY(0) scale(1.05)"; e.currentTarget.style.filter = "brightness(1)"; } }}
          onMouseLeave={(e) => { if (!dragging) { e.currentTarget.style.transform = `rotate(${o.rotate}deg) translateY(${o.y}px)`; e.currentTarget.style.filter = "brightness(0.45)"; setShowHint(false); } }}
        />
        {showHint && !dragging && (
          <div style={{
            position: "absolute", top: -40, left: "50%", transform: "translateX(-50%)",
            background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.6)",
            fontSize: 11, fontStyle: "italic", padding: "4px 12px", borderRadius: 14,
            whiteSpace: "nowrap", pointerEvents: "none",
            animation: "float 1.5s ease-in-out infinite",
          }}>
            drag me up ↑
          </div>
        )}
      </div>
      {dragging && cardRect.current && (
        <div style={{
          position: "fixed",
          left: dragPos.x - cardRect.current.width / 2,
          top: dragPos.y - cardRect.current.height / 2,
          zIndex: 9999,
          pointerEvents: "none",
          opacity: 0.85,
        }}>
          <video
            src={src}
            autoPlay
            muted
            loop
            playsInline
            style={{
              height: 150,
              minWidth: 280,
              width: "auto",
              borderRadius: 6,
              objectFit: "cover",
              filter: "brightness(1)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
            }}
          />
          {dragPos.y < window.innerHeight * 0.6 && (
            <div style={{
              position: "absolute", top: -30, left: "50%", transform: "translateX(-50%)",
              color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: 500, whiteSpace: "nowrap",
            }}>
              release to play ▶
            </div>
          )}
          {dragPos.y >= window.innerHeight * 0.6 && (
            <div style={{
              position: "absolute", top: -30, left: "50%", transform: "translateX(-50%)",
              color: "rgba(255,255,255,0.5)", fontSize: 11, fontStyle: "italic", whiteSpace: "nowrap",
            }}>
              drag up ↑
            </div>
          )}
        </div>
      )}
    </>
  );
}

function FullPlayer({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 10000, background: "rgba(0,0,0,0.95)",
        display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column",
        animation: "fadeIn 0.4s ease",
      }}
    >
      <button
        onClick={onClose}
        style={{ position: "absolute", top: 20, right: 28, background: "none", border: "none", color: "#fff", fontSize: 32, cursor: "pointer", zIndex: 10001 }}
        aria-label="Close"
      >
        &times;
      </button>
      <video
        src={src}
        autoPlay
        controls
        playsInline
        style={{ maxWidth: "90vw", maxHeight: "80vh", borderRadius: 10 }}
      />
    </div>
  );
}

// Art track is ~8.3 LU louder than the story track (-13.1 vs -21.4 LUFS),
// so default lower to match the story page's perceived loudness at 0.55.
function MusicPlayer({ audioRef }: { audioRef: RefObject<HTMLAudioElement | null> }) {
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.21);

  // Try to autoplay; if blocked, start on the first user interaction.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      audio.volume = volume;
      audio.play().catch(() => { started = false; });
    };
    start();
    window.addEventListener("pointerdown", start);
    window.addEventListener("keydown", start);
    return () => {
      window.removeEventListener("pointerdown", start);
      window.removeEventListener("keydown", start);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioRef]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => setPlaying(false);
    const onVol = () => setVolume(audio.volume);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("volumechange", onVol);
    setPlaying(!audio.paused);
    setVolume(audio.volume);
    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("volumechange", onVol);
    };
  }, [audioRef]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  };
  const setVol = (v: number) => { const a = audioRef.current; if (a) a.volume = v; setVolume(v); };

  return (
    <div style={{
      position: "fixed", top: 56, right: 20, zIndex: 9000,
      display: "flex", alignItems: "center", gap: 12, textShadow: "none",
    }}>
      <button onClick={toggle} aria-label={playing ? "pause" : "play"} style={{
        width: 40, height: 40, flexShrink: 0, borderRadius: "50%",
        background: "transparent", border: "none", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", color: "#f2f2f0",
      }}>
        {playing ? (
          <svg width="16" height="16" viewBox="0 0 12 12" fill="currentColor"><rect x="1.5" y="1" width="3" height="10" rx="1" /><rect x="7.5" y="1" width="3" height="10" rx="1" /></svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 12 12" fill="currentColor"><path d="M2.5 1.2 L10.5 6 L2.5 10.8 Z" /></svg>
        )}
      </button>
      <style>{`
        .vol-range::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          width: 11px; height: 11px; border-radius: 50%;
          background: #f2f2f0; border: none; cursor: pointer;
        }
        .vol-range::-moz-range-thumb {
          width: 11px; height: 11px; border-radius: 50%;
          background: #f2f2f0; border: none; cursor: pointer;
        }
      `}</style>
      <input className="vol-range" type="range" min={0} max={1} step={0.01} value={volume} aria-label="volume"
        onChange={(e) => setVol(Number(e.target.value))}
        style={{
          width: 80, height: 3, appearance: "none", WebkitAppearance: "none", borderRadius: 2,
          background: `linear-gradient(to right, rgba(255,255,255,0.85) ${volume * 100}%, rgba(255,255,255,0.15) ${volume * 100}%)`,
          cursor: "pointer", outline: "none",
        }} />
    </div>
  );
}

export default function ArtPage() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [bgVideo, setBgVideo] = useState("");
  const bgIndexRef = useRef(0);
  const switchingRef = useRef(false);
  const startedRef = useRef(false);
  const [shuffledFilms, setShuffledFilms] = useState<string[]>([]);
  const [playerSrc, setPlayerSrc] = useState<string | null>(null);

  useEffect(() => {
    const shuffled = [...films];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setShuffledFilms(shuffled);
  }, []);

  const pickNext = useCallback(() => {
    switchingRef.current = false; // new video is now the current one
    setBgVideo(bgVideos[bgIndexRef.current]);
    bgIndexRef.current = (bgIndexRef.current + 1) % bgVideos.length;
  }, []);

  // Guard against the flood of timeupdate/ended events advancing more than once per video.
  const advanceBg = useCallback(() => {
    if (switchingRef.current) return;
    switchingRef.current = true;
    pickNext();
  }, [pickNext]);

  useEffect(() => {
    if (startedRef.current) return; // survive StrictMode's double-invoke in dev
    startedRef.current = true;
    pickNext();
  }, [pickNext]);

  return (
    <>
      <style>{`
        @keyframes float { 0%,100% { transform: translateX(-50%) translateY(0); } 50% { transform: translateX(-50%) translateY(-6px); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
      <audio ref={audioRef} src={BG_TRACK} loop preload="auto" />
      <MusicPlayer audioRef={audioRef} />
      <div className="grain" />
      <div style={{ position: "fixed", inset: 0, zIndex: -1, overflow: "hidden", background: "#000" }}>
        {bgVideo && (
          <video
            key={bgVideo}
            autoPlay
            muted
            playsInline
            onTimeUpdate={(e) => { if ((e.target as HTMLVideoElement).currentTime >= 30) advanceBg(); }}
            onEnded={advanceBg}
            style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.3 }}
          >
            <source src={bgVideo} type="video/mp4" />
          </video>
        )}
      </div>

      <nav className="site-nav">
        <Link href="/" className="font-display text-[16px] font-semibold text-white no-underline tracking-tight">enrin</Link>
        <div className="flex gap-7">
          <Link href="/story" className="text-white/45 no-underline text-[13px] font-normal tracking-wide hover:text-white transition-colors duration-400">story</Link>
          <Link href="/art" className="text-white/80 no-underline text-[13px] font-normal tracking-wide">art</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, padding: "0 clamp(16px, 4vw, 40px)", textShadow: "0 2px 10px rgba(0,0,0,0.8), 0 0 30px rgba(0,0,0,0.5)", position: "relative", zIndex: 1 }}>
        <section style={{ paddingTop: "clamp(120px, 20vw, 240px)", paddingBottom: 20 }}>
          <h1 className="font-display" style={{ fontSize: "clamp(2.5rem, 8vw, 5.5rem)", fontWeight: 700, letterSpacing: -4, lineHeight: 0.9, color: "var(--color-text)" }}>art</h1>
          <p style={{ fontSize: 13, color: "var(--color-text-dim)", marginTop: 16 }}>films · frames · moments</p>
        </section>
        <section style={{ padding: "30px 0 0", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ fontSize: 18, fontWeight: 600, color: "var(--color-text)", textTransform: "uppercase", letterSpacing: "-0.02em", marginBottom: 0 }}>Films</p>
        </section>
      </div>

      <div style={{ width: "100%", overflow: "hidden", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", gap: 18, overflowX: "scroll", padding: "40px clamp(16px, 4vw, 40px)", scrollbarWidth: "none", msOverflowStyle: "none", alignItems: "center" }} className="[&::-webkit-scrollbar]:hidden">
          {shuffledFilms.map((src, i) => <FilmCard key={src} src={src} index={i} onSelect={setPlayerSrc} />)}
        </div>
      </div>

      {playerSrc && <FullPlayer src={playerSrc} onClose={() => setPlayerSrc(null)} />}

      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "40px clamp(16px, 4vw, 40px)", maxWidth: 960, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", margin: 0 }}>© 2025 enrinjr</p>
          <div style={{ display: "flex", gap: 24 }}>
            {[{ href: "/", label: "home" }, { href: "/story", label: "story" }].map((l) => (
              <Link key={l.label} href={l.href} style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textDecoration: "none" }}>{l.label}</Link>
            ))}
          </div>
        </div>
      </footer>
    </>
  );
}
