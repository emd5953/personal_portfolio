"use client";

import { useEffect, useState, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";

interface Thought {
  id: string; date: string; tag: string; title: string; preview: string;
}
interface TimelineEntry {
  id: string; period: string; title: string; description: string; tags: string[];
}

// ---- shared editor UI ----
const labelStyle: CSSProperties = { display: "block", fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 6, fontWeight: 600 };
const inputBase: CSSProperties = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 13px", fontSize: 14, color: "var(--color-text)", width: "100%", outline: "none", fontFamily: "inherit", transition: "border-color 0.2s, background 0.2s", boxSizing: "border-box" };

function focusOn(e: { currentTarget: HTMLElement }) { e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }
function focusOff(e: { currentTarget: HTMLElement }) { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }

function Field({ label, value, onChange, placeholder, type, rows, onEnter, autoFocus }: {
  label?: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; rows?: number; onEnter?: () => void; autoFocus?: boolean;
}) {
  const control = rows ? (
    <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows} onFocus={focusOn} onBlur={focusOff} style={{ ...inputBase, fontSize: 13, lineHeight: 1.7, resize: "none" }} />
  ) : (
    <input type={type || "text"} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoFocus={autoFocus} onKeyDown={onEnter ? (e) => e.key === "Enter" && onEnter() : undefined} onFocus={focusOn} onBlur={focusOff} style={inputBase} />
  );
  return <label style={{ display: "block", marginBottom: 14 }}>{label && <span style={labelStyle}>{label}</span>}{control}</label>;
}

function PrimaryBtn({ children, onClick, full }: { children: ReactNode; onClick: () => void; full?: boolean }) {
  return <button onClick={onClick} style={{ width: full ? "100%" : "auto", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 12, padding: full ? "11px 0" : "10px 26px", fontSize: 11, color: "rgba(255,255,255,0.9)", cursor: "pointer", letterSpacing: 2, textTransform: "uppercase", fontWeight: 600, transition: "all 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.18)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}>{children}</button>;
}

function GhostBtn({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return <button onClick={onClick} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "10px 22px", fontSize: 11, color: "rgba(255,255,255,0.4)", cursor: "pointer", letterSpacing: 2, textTransform: "uppercase", fontWeight: 600, transition: "all 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.8)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.4)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}>{children}</button>;
}

const panelStyle: CSSProperties = { background: "rgba(14,17,20,0.55)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: 24, backdropFilter: "blur(20px)", textShadow: "none", boxShadow: "0 16px 50px rgba(0,0,0,0.35)" };
const modalStyle: CSSProperties = { background: "rgba(12,15,18,0.92)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 28, maxWidth: 480, width: "100%", backdropFilter: "blur(24px)", boxShadow: "0 24px 80px rgba(0,0,0,0.5)" };
const eyebrow: CSSProperties = { fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 18, fontWeight: 600 };

// ---- entry loading animation ----
function LoadingScreen({ onDone, audioRef }: { onDone: () => void; audioRef: RefObject<HTMLAudioElement | null> }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const audio = audioRef.current;
    const targetVol = 0.55;

    // Try to autoplay; if blocked, start on the first user interaction.
    // The preview src can arrive after mount, so also retry once the audio is ready.
    let started = false;
    const start = () => {
      if (!audio || started) return;
      started = true;
      audio.volume = 0;
      audio.play()
        .then(() => gsap.to(audio, { volume: targetVol, duration: 2, ease: "power1.out" }))
        .catch(() => { started = false; }); // allow a later attempt (e.g. user gesture)
    };

    if (audio) {
      start();
      audio.addEventListener("canplay", start);
      window.addEventListener("pointerdown", start);
      window.addEventListener("keydown", start);
    }

    const ctx = gsap.context(() => {
      const bars = gsap.utils.toArray<HTMLElement>(".ls-bar");
      gsap.set(".ls-eq", { opacity: 0, scale: 0.7 });
      gsap.set(".ls-ring", { opacity: 0, scale: 0.4 });
      gsap.set(rootRef.current, { yPercent: 0 });

      // Infinite equalizer dance (music-reactive feel).
      const dance = gsap.to(bars, {
        scaleY: () => 0.28 + Math.random() * 1.5,
        duration: 0.38,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        transformOrigin: "center bottom",
        stagger: { each: 0.09, from: "center", repeat: -1, yoyo: true },
      });

      // Concentric rings pulsing outward.
      const rings = gsap.fromTo(".ls-ring",
        { scale: 0.4, opacity: 0.55 },
        { scale: 1.7, opacity: 0, duration: 2, ease: "power1.out", repeat: -1, stagger: 0.5 }
      );

      const tl = gsap.timeline({
        onComplete: () => { dance.kill(); rings.kill(); onDoneRef.current(); },
      });
      tl.to(".ls-eq", { opacity: 1, scale: 1, duration: 0.8, ease: "power3.out" })
        .to({}, { duration: 3 }) // hold while the animation runs
        .to(".ls-eq", { opacity: 0, scale: 0.8, duration: 0.5, ease: "power2.in" })
        .to(".ls-ring", { opacity: 0, duration: 0.3 }, "<")
        .to(rootRef.current, { yPercent: -100, duration: 0.95, ease: "power4.inOut" }, "-=0.1");
    }, rootRef);

    return () => {
      ctx.revert();
      if (audio) audio.removeEventListener("canplay", start);
      window.removeEventListener("pointerdown", start);
      window.removeEventListener("keydown", start);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={rootRef} style={{ position: "fixed", inset: 0, zIndex: 100000, background: "#070809", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <div style={{ position: "relative", width: 220, height: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="ls-ring"
            style={{ position: "absolute", width: 130, height: 130, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.5)" }}
          />
        ))}
        <div className="ls-eq" style={{ display: "flex", alignItems: "flex-end", gap: 7, height: 64 }}>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="ls-bar"
              style={{ width: 6, height: 42, background: "#f2f2f0", borderRadius: 3 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ---- intro track (local audio, fully controllable) ----
const INTRO_TRACK = { src: "/assets/story/brias_interlude.mp3" };

// ---- persistent music player (button only) ----
function MusicPlayer({ audioRef }: { audioRef: RefObject<HTMLAudioElement | null> }) {
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.55);

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

export default function StoryPage() {
  const [loading, setLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());
  const [spotifyData, setSpotifyData] = useState<{ trackName?: string; artist?: string; album?: string; trackId?: string; playedAt?: string; playlists?: { id: string; name: string; tracks: number }[] } | null>(null);

  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [editPassword, setEditPassword] = useState("");
  const [isAuthed, setIsAuthed] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [authError, setAuthError] = useState("");
  const [editingThought, setEditingThought] = useState<Thought | null>(null);
  const [editingTimeline, setEditingTimeline] = useState<TimelineEntry | null>(null);
  const [newThought, setNewThought] = useState({ title: "", preview: "", tag: "", date: "" });
  const [newTimeline, setNewTimeline] = useState({ title: "", description: "", period: "", tags: "" });

  const apiCall = async (method: string, type: string, body: object) => {
    const res = await fetch(`/api/content?type=${type}`, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${editPassword}` },
      body: JSON.stringify(body),
    });
    return res.json();
  };

  const handleLogin = async () => {
    setAuthError("");
    const res = await fetch("/api/content?action=export", { headers: { Authorization: `Bearer ${editPassword}` } });
    const data = await res.json();
    if (data.success) { setIsAuthed(true); setEditMode(true); setShowLogin(false); }
    else setAuthError(data.error || "Wrong password");
  };

  const addThought = async () => {
    if (!newThought.title) return;
    const res = await apiCall("POST", "thoughts", { ...newThought, date: newThought.date || new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toLowerCase() });
    if (res.success) { setThoughts((prev) => [res.data, ...prev]); setNewThought({ title: "", preview: "", tag: "", date: "" }); }
  };

  const updateThought = async () => {
    if (!editingThought) return;
    const res = await apiCall("PUT", "thoughts", editingThought);
    if (res.success) { setThoughts((prev) => prev.map((t) => (t.id === editingThought.id ? res.data : t))); setEditingThought(null); }
  };

  const deleteThought = async (id: string) => {
    const res = await apiCall("DELETE", "thoughts", { id });
    if (res.success) setThoughts((prev) => prev.filter((t) => t.id !== id));
  };

  const addTimeline = async () => {
    if (!newTimeline.title) return;
    const res = await apiCall("POST", "timeline", { ...newTimeline, tags: newTimeline.tags.split(",").map((t) => t.trim()).filter(Boolean) });
    if (res.success) { setTimeline((prev) => [res.data, ...prev]); setNewTimeline({ title: "", description: "", period: "", tags: "" }); }
  };

  const updateTimeline = async () => {
    if (!editingTimeline) return;
    const res = await apiCall("PUT", "timeline", editingTimeline);
    if (res.success) { setTimeline((prev) => prev.map((t) => (t.id === editingTimeline.id ? res.data : t))); setEditingTimeline(null); }
  };

  const deleteTimeline = async (id: string) => {
    const res = await apiCall("DELETE", "timeline", { id });
    if (res.success) setTimeline((prev) => prev.filter((t) => t.id !== id));
  };
  const heroBgMedia = [
    "/assets/story/bg8.mp4",
    "/assets/story/bg1.mp4",
    "/assets/story/2.jpg",
    "/assets/story/3.jpg",
    "/assets/story/qatarcafe.jpg",
    "/assets/story/philly2.JPG",
    "/assets/story/gala.jpg",
  ];
  const IMAGE_DURATION = 7000; // how long each still image is shown
  const [heroBgIndex, setHeroBgIndex] = useState(0);
  const heroVideoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    fetch("/api/content?type=thoughts").then((r) => r.json()).then((d) => { if (d.success && d.data.length) setThoughts(d.data); }).catch(() => {});
    fetch("/api/content?type=timeline").then((r) => r.json()).then((d) => { if (d.success && d.data.length) setTimeline(d.data); }).catch(() => {});
    fetch("/api/spotify").then((r) => r.json()).then((data) => {
      if (data.lastPlayed) setSpotifyData({ trackName: data.lastPlayed.name, artist: data.lastPlayed.artist, album: data.lastPlayed.album, trackId: data.lastPlayed.trackId, playedAt: data.lastPlayed.playedAt, playlists: data.randomPlaylists });
    }).catch(() => {});
  }, []);

  // Sequential background: videos play to the end, images hold for IMAGE_DURATION, then loop.
  useEffect(() => {
    const advance = () => setHeroBgIndex((prev) => (prev + 1) % heroBgMedia.length);
    const isVideo = heroBgMedia[heroBgIndex].endsWith(".mp4");

    if (isVideo) {
      const video = heroVideoRefs.current[heroBgIndex];
      if (video) {
        try { video.currentTime = 0; } catch {}
        video.play().catch(() => {});
        video.onended = advance;
        // Safety net in case "ended" never fires (e.g. load error).
        const safety = setTimeout(advance, 30000);
        return () => { video.onended = null; clearTimeout(safety); };
      }
      const t = setTimeout(advance, 12000);
      return () => clearTimeout(t);
    }

    const t = setTimeout(advance, IMAGE_DURATION);
    return () => clearTimeout(t);
  }, [heroBgIndex, heroBgMedia.length]);

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
  const displayThoughts = thoughts;
  const displayTimeline = timeline;

  return (
    <>
      <audio ref={audioRef} src={INTRO_TRACK.src} preload="auto" />
      {loading && <LoadingScreen onDone={() => setLoading(false)} audioRef={audioRef} />}
      {!loading && <MusicPlayer audioRef={audioRef} />}
      <div className="grain" />
      <nav className="site-nav">
        <Link href="/" className="font-display text-[16px] font-semibold text-white no-underline tracking-tight">enrin</Link>
        <div className="flex gap-7">
          <Link href="/career" className="text-white/45 no-underline text-[13px] font-normal tracking-wide hover:text-white transition-colors duration-400">career</Link>
          <Link href="/story" className="text-white/80 no-underline text-[13px] font-normal tracking-wide">story</Link>
          <Link href="/art" className="text-white/45 no-underline text-[13px] font-normal tracking-wide hover:text-white transition-colors duration-400">art</Link>
        </div>
      </nav>

      {/* HERO */}
      {/* Fixed full-page background */}
      <div style={{ position: "fixed", inset: 0, zIndex: -1 }}>
        {heroBgMedia.map((src, i) => {
          const isVideo = src.endsWith(".mp4");
          return isVideo ? (
            <video
              key={src}
              ref={(el) => { heroVideoRefs.current[i] = el; }}
              src={src}
              muted
              playsInline
              preload="auto"
              style={{
                position: "absolute", inset: 0, width: "100%", height: "100%",
                objectFit: "cover", objectPosition: "center 72%",
                filter: "brightness(0.55)",
                transition: "opacity 2s ease-in-out",
                opacity: i === heroBgIndex ? 1 : 0,
              }}
            />
          ) : (
            <Image
              key={src}
              src={src}
              alt=""
              fill
              quality={100}
              priority
              sizes="100vw"
              style={{
                objectFit: "cover", objectPosition: "center 72%",
                filter: "brightness(0.55)",
                transition: "opacity 2s ease-in-out",
                opacity: i === heroBgIndex ? 1 : 0,
              }}
            />
          );
        })}
      </div>

      <section className="h-[42vh] relative flex items-end pb-12 px-6 md:px-16 max-md:h-[48vh] max-md:pb-14">
        <div className="relative z-10 max-w-[1100px] w-full" style={{ marginLeft: "clamp(16px, 4vw, 40px)", textShadow: "0 2px 10px rgba(0,0,0,0.8), 0 0 30px rgba(0,0,0,0.5)" }}>
          <p className="text-[11px] tracking-[3px] text-text-mid lowercase mb-7 opacity-0 animate-[heroFade_2s_ease_0.3s_forwards]">sounds · music · thoughts . timeline</p>
          <h1 className="font-display text-[clamp(2.5rem,8vw,5rem)] font-bold tracking-[-3px] leading-[0.95] text-text opacity-0 animate-[heroFade_2s_ease_0.5s_forwards]">the story</h1>
        </div>
      </section>

      {/* SOUNDS */}
      <section id="sounds" ref={ref("sounds")} style={{ paddingTop: 56, paddingBottom: 40 }} className={`relative px-6 md:px-16 mt-10 border-t border-border transition-all duration-1000 ease-out max-md:py-14 max-md:px-8 ${vis("sounds")}`}>
        <div className="max-w-[1100px]" style={{ marginLeft: "clamp(16px, 4vw, 40px)", textShadow: "0 2px 10px rgba(0,0,0,0.8), 0 0 30px rgba(0,0,0,0.5)" }}>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-text lowercase mb-10">sounds</h2>

          {/* Current track */}
          <div className="border border-border rounded-lg p-4 md:p-6 max-w-full md:max-w-[550px] mb-24">
            <p className="text-[10px] tracking-[2px] text-text-mid uppercase font-medium mb-3">
              {spotifyData?.playedAt ? <>last played <span className="text-text-mid font-normal">({new Date(spotifyData.playedAt).toLocaleTimeString()})</span></> : "today's most played"}
            </p>
            <h3 className="font-display text-xl font-semibold text-text mb-1">{spotifyData?.trackName || "loading..."}</h3>
            <p className="text-text-mid text-base mb-1">{spotifyData?.artist || "loading..."}</p>
            <p className="text-[11px] text-text-mid tracking-wide uppercase">{spotifyData?.album ? `from ${spotifyData.album}` : "loading..."}</p>
            {spotifyData?.trackId && (
              <div className="mt-3 rounded-xl overflow-hidden">
                <iframe style={{ borderRadius: 12 }} src={`https://open.spotify.com/embed/track/${spotifyData.trackId}?utm_source=generator&theme=0`} width="100%" height="152" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" />
              </div>
            )}
          </div>

          {/* Playlists */}
          {spotifyData?.playlists && spotifyData.playlists.length > 0 && (
            <>
              <div style={{ height: 36 }} />
              <p className="text-text-mid text-xs tracking-[2px] uppercase font-medium mb-14">featured playlists today</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8 max-w-[900px]">
                {spotifyData.playlists.map((p) => (
                  <div key={p.id} className="rounded-xl overflow-hidden">
                    <iframe style={{ borderRadius: 12, display: "block" }} src={`https://open.spotify.com/embed/playlist/${p.id}?utm_source=generator&theme=0`} width="100%" height="152" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ART */}
      <section id="art" ref={ref("art")} style={{ paddingTop: 40, paddingBottom: 48 }} className={`relative px-6 md:px-16 border-t border-border transition-all duration-1000 ease-out max-md:py-14 max-md:px-8 ${vis("art")}`}>
        <div className="max-w-[1100px]" style={{ marginLeft: "clamp(16px, 4vw, 40px)", textShadow: "0 2px 10px rgba(0,0,0,0.8), 0 0 30px rgba(0,0,0,0.5)" }}>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-text lowercase mb-10">music</h2>

          {/* Song covers */}
          <div className="relative w-full max-w-full md:max-w-[610px] rounded-2xl overflow-hidden" style={{ marginBottom: 56 }}>
            <img src="/assets/songCover.jpg" alt="Main song cover" className="w-full block rounded-2xl" />
            <div className="absolute inset-0 flex justify-between items-start p-8 max-md:hidden">
              <div className="max-w-[175px] self-end text-center">
                <img src="/assets/song1.jpg" alt="Song cover 1" className="w-full rounded-xl shadow-2xl hover:scale-[1.2] transition-transform duration-300" />
              </div>
              <div className="max-w-[175px] text-center">
                <img src="/assets/song2.jpg" alt="Song cover 2" className="w-full rounded-xl shadow-2xl hover:scale-[1.2] transition-transform duration-300" />
              </div>
            </div>
          </div>

          {/* Additional images */}
          <div className="grid grid-cols-2 max-w-[620px] max-md:grid-cols-1 max-md:max-w-[280px]" style={{ gap: 56, marginBottom: 56 }}>
            {[{ src: "topAlbums.PNG", cap: "top albums" }, { src: "topSongs.PNG", cap: "top songs" }].map((item) => (
              <div key={item.src} className="text-center">
                <img src={`/assets/${item.src}`} alt={item.cap} className="w-full rounded-xl shadow-lg hover:scale-105 transition-transform duration-300" />
              </div>
            ))}
          </div>

          {/* Video */}
          <div className="relative pb-[56.25%] md:pb-[45%] h-0 overflow-hidden rounded-2xl shadow-2xl max-w-full md:max-w-[600px] max-md:pb-[56.25%]">
            <iframe className="absolute inset-0 w-full h-full rounded-2xl" src="https://www.youtube.com/embed/iuqZl8EFd4s" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
          </div>
        </div>
      </section>

      {/* THOUGHTS */}
      <section id="thoughts" ref={ref("thoughts")} style={{ paddingTop: 56, paddingBottom: 56 }} className={`relative px-6 md:px-16 border-t border-border transition-all duration-1000 ease-out max-md:py-14 max-md:px-8 ${vis("thoughts")}`}>
        <div className="max-w-[1100px]" style={{ marginLeft: "clamp(16px, 4vw, 40px)", textShadow: "0 2px 10px rgba(0,0,0,0.8), 0 0 30px rgba(0,0,0,0.5)" }}>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-text lowercase mb-14">thoughts</h2>

          {editMode && (
            <div className="max-w-[560px]" style={{ ...panelStyle, marginTop: 28, marginBottom: 56 }}>
              <p style={eyebrow}>new thought</p>
              <Field label="title" value={newThought.title} onChange={(v) => setNewThought({ ...newThought, title: v })} placeholder="a short title" />
              <Field label="thought" value={newThought.preview} onChange={(v) => setNewThought({ ...newThought, preview: v })} placeholder="what's on your mind..." rows={3} />
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}><Field label="tag" value={newThought.tag} onChange={(v) => setNewThought({ ...newThought, tag: v })} placeholder="reflection" /></div>
                <div style={{ flex: 1 }}><Field label="date" value={newThought.date} onChange={(v) => setNewThought({ ...newThought, date: v })} placeholder="apr 27, 2026" /></div>
              </div>
              <div style={{ marginTop: 4 }}><PrimaryBtn onClick={addThought}>add thought</PrimaryBtn></div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2" style={{ columnGap: 48, rowGap: 56 }}>
            {displayThoughts.map((t) => (
              <article key={t.id} className="border border-border rounded-lg p-7 hover:border-text-dim/30 hover:-translate-y-1 transition-all duration-300 cursor-pointer relative group">
                {editMode && (
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ textShadow: "none" }}>
                    <button onClick={() => setEditingThought(t)} className="px-2 py-0.5 bg-white/10 hover:bg-white/20 text-text text-[10px] rounded">edit</button>
                    <button onClick={() => deleteThought(t.id)} className="px-2 py-0.5 bg-red-500/20 hover:bg-red-500/40 text-red-300 text-[10px] rounded">×</button>
                  </div>
                )}
                <div className="flex justify-between items-center mb-5">
                  <span className="text-[11px] text-text-mid uppercase tracking-wide font-medium">{t.date}</span>
                  <span className="text-[11px] text-text-mid border border-border rounded-full px-3 py-0.5 lowercase">{t.tag}</span>
                </div>
                <h3 className="font-display text-lg font-semibold text-text mb-3 leading-tight">{t.title}</h3>
                <p className="text-text text-sm leading-relaxed">{t.preview}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* TIMELINE */}
      <section id="timeline" ref={ref("timeline")} style={{ paddingTop: 56, paddingBottom: 56 }} className={`relative px-6 md:px-16 border-t border-border transition-all duration-1000 ease-out max-md:py-14 max-md:px-8 ${vis("timeline")}`}>
        <div className="max-w-[1100px]" style={{ marginLeft: "clamp(16px, 4vw, 40px)", textShadow: "0 2px 10px rgba(0,0,0,0.8), 0 0 30px rgba(0,0,0,0.5)" }}>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-text lowercase mb-14">timeline</h2>

          {editMode && (
            <div className="max-w-[560px] mx-auto" style={{ ...panelStyle, marginTop: 28, marginBottom: 56 }}>
              <p style={eyebrow}>new chapter</p>
              <Field label="title" value={newTimeline.title} onChange={(v) => setNewTimeline({ ...newTimeline, title: v })} placeholder="the developer era" />
              <Field label="description" value={newTimeline.description} onChange={(v) => setNewTimeline({ ...newTimeline, description: v })} placeholder="what happened in this chapter..." rows={3} />
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}><Field label="period" value={newTimeline.period} onChange={(v) => setNewTimeline({ ...newTimeline, period: v })} placeholder="2024 - present" /></div>
                <div style={{ flex: 1 }}><Field label="tags" value={newTimeline.tags} onChange={(v) => setNewTimeline({ ...newTimeline, tags: v })} placeholder="learning, building" /></div>
              </div>
              <div style={{ marginTop: 4 }}><PrimaryBtn onClick={addTimeline}>add chapter</PrimaryBtn></div>
            </div>
          )}

          <div className="max-w-[800px] mx-auto relative">
            <div className="absolute left-[5px] top-0 bottom-0 w-[2px] bg-border" />
            {displayTimeline.map((entry) => (
              <div key={entry.id} className="flex gap-8 relative max-md:gap-5" style={{ marginBottom: 48 }}>
                <div className="w-3 h-3 bg-text-dim border-[3px] border-bg rounded-full shrink-0 mt-2 z-10 relative" />
                <div className="flex-1 border border-border rounded-lg p-7 hover:border-text-dim/30 hover:translate-x-2 transition-all duration-300 cursor-pointer relative group">
                  {editMode && (
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ textShadow: "none" }}>
                      <button onClick={() => setEditingTimeline(entry)} className="px-2 py-0.5 bg-white/10 hover:bg-white/20 text-text text-[10px] rounded">edit</button>
                      <button onClick={() => deleteTimeline(entry.id)} className="px-2 py-0.5 bg-red-500/20 hover:bg-red-500/40 text-red-300 text-[10px] rounded">×</button>
                    </div>
                  )}
                  <p className="text-[11px] text-text-mid uppercase tracking-wide font-medium mb-3">{entry.period}</p>
                  <h3 className="font-display text-lg font-semibold text-text mb-3 leading-tight">{entry.title}</h3>
                  <p className="text-text text-sm leading-relaxed mb-4">{entry.description}</p>
                  <div className="flex gap-2 flex-wrap">
                    {entry.tags.map((tag) => <span key={tag} className="text-[11px] text-text-mid border border-border rounded-full px-3 py-0.5 lowercase">{tag}</span>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LOGIN MODAL */}
      {showLogin && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center backdrop-blur-lg" style={{ background: "rgba(0,0,0,0.7)" }} onClick={() => setShowLogin(false)}>
          <div style={{ ...modalStyle, maxWidth: 360 }} onClick={(e) => e.stopPropagation()}>
            <p style={eyebrow}>authenticate</p>
            <Field type="password" value={editPassword} onChange={setEditPassword} onEnter={handleLogin} placeholder="password" autoFocus />
            {authError && <p style={{ color: "#f87171", fontSize: 12, marginBottom: 14, marginTop: -4 }}>{authError}</p>}
            <PrimaryBtn onClick={handleLogin} full>unlock</PrimaryBtn>
          </div>
        </div>
      )}

      {/* EDIT THOUGHT MODAL */}
      {editingThought && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center backdrop-blur-lg" style={{ background: "rgba(0,0,0,0.7)" }} onClick={() => setEditingThought(null)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <p style={eyebrow}>edit thought</p>
            <Field label="title" value={editingThought.title} onChange={(v) => setEditingThought({ ...editingThought, title: v })} />
            <Field label="thought" value={editingThought.preview} onChange={(v) => setEditingThought({ ...editingThought, preview: v })} rows={4} />
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}><Field label="tag" value={editingThought.tag} onChange={(v) => setEditingThought({ ...editingThought, tag: v })} /></div>
              <div style={{ flex: 1 }}><Field label="date" value={editingThought.date} onChange={(v) => setEditingThought({ ...editingThought, date: v })} /></div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <div style={{ flex: 1 }}><PrimaryBtn onClick={updateThought} full>save</PrimaryBtn></div>
              <GhostBtn onClick={() => setEditingThought(null)}>cancel</GhostBtn>
            </div>
          </div>
        </div>
      )}

      {/* EDIT TIMELINE MODAL */}
      {editingTimeline && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center backdrop-blur-lg" style={{ background: "rgba(0,0,0,0.7)" }} onClick={() => setEditingTimeline(null)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <p style={eyebrow}>edit chapter</p>
            <Field label="title" value={editingTimeline.title} onChange={(v) => setEditingTimeline({ ...editingTimeline, title: v })} />
            <Field label="description" value={editingTimeline.description} onChange={(v) => setEditingTimeline({ ...editingTimeline, description: v })} rows={4} />
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}><Field label="period" value={editingTimeline.period} onChange={(v) => setEditingTimeline({ ...editingTimeline, period: v })} /></div>
              <div style={{ flex: 1 }}><Field label="tags" value={editingTimeline.tags.join(", ")} onChange={(v) => setEditingTimeline({ ...editingTimeline, tags: v.split(",").map((t) => t.trim()) })} /></div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <div style={{ flex: 1 }}><PrimaryBtn onClick={updateTimeline} full>save</PrimaryBtn></div>
              <GhostBtn onClick={() => setEditingTimeline(null)}>cancel</GhostBtn>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "40px clamp(16px, 4vw, 40px)", maxWidth: 960, margin: "0 auto", textShadow: "0 2px 10px rgba(0,0,0,0.8), 0 0 30px rgba(0,0,0,0.5)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", margin: 0 }}>© 2025 enrinjr</p>
          <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
            <button onClick={() => { if (isAuthed) { setEditMode(!editMode); } else { setShowLogin(true); } }} style={{ fontSize: 12, color: editMode ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.4)", background: "none", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 16, padding: "4px 14px", cursor: "pointer", transition: "color 0.3s, border-color 0.3s" }} onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.85)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)"; }} onMouseLeave={(e) => { e.currentTarget.style.color = editMode ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.4)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}>{editMode ? "exit edit" : "✎ edit"}</button>
            {[{ href: "/", label: "home" }, { href: "/career", label: "career" }, { href: "/art", label: "art" }].map((l) => (
              <Link key={l.label} href={l.href} style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textDecoration: "none" }}>{l.label}</Link>
            ))}
          </div>
        </div>
      </footer>
    </>
  );
}
