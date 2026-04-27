"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

interface Thought {
  id: string; date: string; tag: string; title: string; preview: string;
}
interface TimelineEntry {
  id: string; period: string; title: string; description: string; tags: string[];
}

const fallbackThoughts: Thought[] = [
  { id: "1", date: "jul 27, 2025", tag: "nostalgia", title: "flashbacks & reminiscing", preview: "3 am. i spent the night confused... do not trust your thoughts after 11pm." },
  { id: "2", date: "mar 15, 2025", tag: "reflection", title: "the art of debugging life", preview: "sometimes fixing code is easier than fixing yourself." },
  { id: "3", date: "mar 10, 2025", tag: "tech", title: "why i fell in love with react", preview: "it wasn't the syntax or the ecosystem. it was the moment i realized how components mirror life." },
  { id: "4", date: "mar 8, 2025", tag: "life", title: "coffee shop chronicles", preview: "the best ideas come in the most unexpected places." },
  { id: "5", date: "mar 5, 2025", tag: "journey", title: "from music to code", preview: "how i transitioned creativity from music, art & style to software development." },
  { id: "6", date: "feb 28, 2025", tag: "code", title: "late night code sessions", preview: "when the world sleeps, the best code awakens." },
];

const fallbackTimeline: TimelineEntry[] = [
  { id: "1", period: "2021 – present", title: "the developer era", description: "diving deep into code, building projects, and discovering my passion for creating digital experiences.", tags: ["learning", "building", "growing"] },
  { id: "2", period: "2019 – 2021", title: "the discovery phase", description: "exploring different paths, trying new things, and slowly gravitating towards technology.", tags: ["exploration", "first code", "curiosity"] },
  { id: "3", period: "2017 – 2019", title: "the foundation years", description: "high school adventures, forming friendships that still matter today.", tags: ["friendship", "growth", "foundation"] },
  { id: "4", period: "early years", title: "the beginning", description: "where it all started. building with legos, taking apart electronics.", tags: ["curiosity", "wonder", "beginning"] },
];

export default function StoryPage() {
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
    "/assets/story/qatarcafe.jpg",
    "/assets/story/gala.jpg",
    "/assets/story/2.jpg",
    "/assets/story/3.jpg",
    "/assets/story/bg1.mp4",
    "/assets/story/bg8.mp4",
  ];
  const [heroBgIndex, setHeroBgIndex] = useState(0);

  useEffect(() => {
    setHeroBgIndex(Math.floor(Math.random() * heroBgMedia.length));
  }, [heroBgMedia.length]);

  useEffect(() => {
    fetch("/api/content?type=thoughts").then((r) => r.json()).then((d) => { if (d.success && d.data.length) setThoughts(d.data); }).catch(() => {});
    fetch("/api/content?type=timeline").then((r) => r.json()).then((d) => { if (d.success && d.data.length) setTimeline(d.data); }).catch(() => {});
    fetch("/api/spotify").then((r) => r.json()).then((data) => {
      if (data.lastPlayed) setSpotifyData({ trackName: data.lastPlayed.name, artist: data.lastPlayed.artist, album: data.lastPlayed.album, trackId: data.lastPlayed.trackId, playedAt: data.lastPlayed.playedAt, playlists: data.randomPlaylists });
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroBgIndex((prev) => {
        let next;
        do { next = Math.floor(Math.random() * heroBgMedia.length); } while (next === prev && heroBgMedia.length > 1);
        return next;
      });
    }, 10000);
    return () => clearInterval(interval);
  }, [heroBgMedia.length]);

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
  const displayThoughts = thoughts.length ? thoughts : fallbackThoughts;
  const displayTimeline = timeline.length ? timeline : fallbackTimeline;

  return (
    <>
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
              src={src}
              autoPlay
              loop
              muted
              playsInline
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

      <section className="h-[55vh] relative flex items-end pb-20 px-16 max-md:px-8 max-md:h-[58vh] max-md:pb-14">
        <div className="relative z-10 max-w-[1100px] w-full" style={{ marginLeft: "40px", textShadow: "0 2px 10px rgba(0,0,0,0.8), 0 0 30px rgba(0,0,0,0.5)" }}>
          <p className="text-[11px] tracking-[3px] text-text-mid lowercase mb-7 opacity-0 animate-[heroFade_2s_ease_0.3s_forwards]">thoughts · sounds · art · timeline</p>
          <h1 className="font-display text-[clamp(2.5rem,8vw,5rem)] font-bold tracking-[-3px] leading-[0.95] text-text opacity-0 animate-[heroFade_2s_ease_0.5s_forwards]">the story</h1>
          <p className="text-text-mid text-[15px] mt-8 max-w-[480px] leading-relaxed opacity-0 animate-[heroFade_2s_ease_0.8s_forwards]">thoughts, sounds, art, and moments that shaped the journey from curiosity to nostalgia</p>
        </div>
      </section>

      {/* SOUNDS */}
      <section id="sounds" ref={ref("sounds")} style={{ paddingTop: 60, paddingBottom: 60 }} className={`relative px-16 mt-24 border-t border-border transition-all duration-1000 ease-out max-md:py-14 max-md:px-8 ${vis("sounds")}`}>
        <div className="max-w-[1100px]" style={{ marginLeft: "40px", textShadow: "0 2px 10px rgba(0,0,0,0.8), 0 0 30px rgba(0,0,0,0.5)" }}>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-text lowercase mb-3">sounds</h2>
          <p className="text-text text-sm mb-4">the soundtrack to thinking, and living</p>

          {/* Current track */}
          <div className="border border-border rounded-lg p-6 max-w-[550px] mb-6">
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
              <p className="text-text-mid text-xs tracking-[2px] uppercase font-medium mb-4">featured playlists today</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-[800px]">
                {spotifyData.playlists.map((p) => (
                  <div key={p.id}>
                    <iframe style={{ borderRadius: 8, display: "block" }} src={`https://open.spotify.com/embed/playlist/${p.id}?utm_source=generator&theme=0`} width="100%" height="152" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ART */}
      <section id="art" ref={ref("art")} style={{ paddingTop: 60, paddingBottom: 60 }} className={`relative px-16 border-t border-border transition-all duration-1000 ease-out max-md:py-14 max-md:px-8 ${vis("art")}`}>
        <div className="max-w-[1100px]" style={{ marginLeft: "40px", textShadow: "0 2px 10px rgba(0,0,0,0.8), 0 0 30px rgba(0,0,0,0.5)" }}>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-text lowercase mb-12">art</h2>
          <p className="text-text text-sm mb-10">visual stories and creative expressions</p>

          {/* Song covers */}
          <div className="relative w-full max-w-[600px] rounded-2xl overflow-hidden mb-3">
            <img src="/assets/songCover.jpg" alt="Main song cover" className="w-full block rounded-2xl" />
            <div className="absolute inset-0 flex justify-between items-start p-10 max-md:hidden">
              <div className="max-w-[150px] self-end text-center">
                <img src="/assets/song1.jpg" alt="Song cover 1" className="w-full rounded-xl shadow-2xl hover:scale-[1.3] transition-transform duration-300" />
                <p className="text-white text-sm italic mt-2 drop-shadow-lg">poetic</p>
              </div>
              <div className="max-w-[150px] text-center">
                <img src="/assets/song2.jpg" alt="Song cover 2" className="w-full rounded-xl shadow-2xl hover:scale-[1.3] transition-transform duration-300" />
                <p className="text-white text-sm italic mt-2 drop-shadow-lg">vulgarity</p>
              </div>
            </div>
          </div>
          <p className="text-center text-sm text-text-mid italic mb-10">talent show april 25&apos;</p>

          {/* Additional images */}
          <div className="grid grid-cols-2 gap-6 max-w-[500px] mb-8 max-md:grid-cols-1 max-md:max-w-[250px]">
            {[{ src: "topAlbums.PNG", cap: "top albums" }, { src: "topSongs.PNG", cap: "top songs" }].map((item) => (
              <div key={item.src} className="text-center">
                <img src={`/assets/${item.src}`} alt={item.cap} className="w-full rounded-xl shadow-lg hover:scale-105 transition-transform duration-300" />
                <p className="text-text-mid text-sm italic mt-2">{item.cap}</p>
              </div>
            ))}
          </div>

          {/* Video */}
          <div className="relative pb-[45%] h-0 overflow-hidden rounded-2xl shadow-2xl max-w-[600px] max-md:pb-[56.25%]">
            <iframe className="absolute inset-0 w-full h-full rounded-2xl" src="https://www.youtube.com/embed/iuqZl8EFd4s" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
          </div>
        </div>
      </section>

      {/* THOUGHTS */}
      <section id="thoughts" ref={ref("thoughts")} style={{ paddingTop: 60, paddingBottom: 60 }} className={`relative px-16 border-t border-border transition-all duration-1000 ease-out max-md:py-14 max-md:px-8 ${vis("thoughts")}`}>
        <div className="max-w-[1100px]" style={{ marginLeft: "40px", textShadow: "0 2px 10px rgba(0,0,0,0.8), 0 0 30px rgba(0,0,0,0.5)" }}>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-text lowercase mb-14">thoughts</h2>
          <p className="text-text text-sm mb-14">random musings, and life reflections</p>

          {editMode && (
            <div className="mb-8 p-5 border border-white/10 rounded-lg" style={{ background: "rgba(0,0,0,0.5)", textShadow: "none" }}>
              <p className="text-text text-xs uppercase tracking-widest mb-3">add thought</p>
              <input value={newThought.title} onChange={(e) => setNewThought({ ...newThought, title: e.target.value })} placeholder="title" className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-text mb-2 outline-none focus:border-white/30" />
              <textarea value={newThought.preview} onChange={(e) => setNewThought({ ...newThought, preview: e.target.value })} placeholder="preview text" className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-text mb-2 outline-none focus:border-white/30 resize-none" rows={2} />
              <div className="flex gap-2 mb-2">
                <input value={newThought.tag} onChange={(e) => setNewThought({ ...newThought, tag: e.target.value })} placeholder="tag" className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-text outline-none focus:border-white/30" />
                <input value={newThought.date} onChange={(e) => setNewThought({ ...newThought, date: e.target.value })} placeholder="date (e.g. apr 27, 2026)" className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-text outline-none focus:border-white/30" />
              </div>
              <button onClick={addThought} className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-text text-xs rounded transition-colors">add</button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
      <section id="timeline" ref={ref("timeline")} style={{ paddingTop: 60, paddingBottom: 60 }} className={`relative px-16 border-t border-border transition-all duration-1000 ease-out max-md:py-14 max-md:px-8 ${vis("timeline")}`}>
        <div className="max-w-[1100px]" style={{ marginLeft: "40px", textShadow: "0 2px 10px rgba(0,0,0,0.8), 0 0 30px rgba(0,0,0,0.5)" }}>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-text lowercase mb-14">timeline</h2>
          <p className="text-text text-sm mb-14">the chapters that shaped who i am today</p>

          {editMode && (
            <div className="mb-8 p-5 border border-white/10 rounded-lg max-w-[800px] mx-auto" style={{ background: "rgba(0,0,0,0.5)", textShadow: "none" }}>
              <p className="text-text text-xs uppercase tracking-widest mb-3">add timeline entry</p>
              <input value={newTimeline.title} onChange={(e) => setNewTimeline({ ...newTimeline, title: e.target.value })} placeholder="title" className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-text mb-2 outline-none focus:border-white/30" />
              <textarea value={newTimeline.description} onChange={(e) => setNewTimeline({ ...newTimeline, description: e.target.value })} placeholder="description" className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-text mb-2 outline-none focus:border-white/30 resize-none" rows={2} />
              <div className="flex gap-2 mb-2">
                <input value={newTimeline.period} onChange={(e) => setNewTimeline({ ...newTimeline, period: e.target.value })} placeholder="period (e.g. 2024 - present)" className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-text outline-none focus:border-white/30" />
                <input value={newTimeline.tags} onChange={(e) => setNewTimeline({ ...newTimeline, tags: e.target.value })} placeholder="tags (comma separated)" className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-text outline-none focus:border-white/30" />
              </div>
              <button onClick={addTimeline} className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-text text-xs rounded transition-colors">add</button>
            </div>
          )}

          <div className="max-w-[800px] mx-auto relative">
            <div className="absolute left-[5px] top-0 bottom-0 w-[2px] bg-border" />
            {displayTimeline.map((entry) => (
              <div key={entry.id} className="flex gap-8 mb-14 relative max-md:gap-5">
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
        <div className="fixed inset-0 z-[10000] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.8)" }} onClick={() => setShowLogin(false)}>
          <div className="p-6 rounded-xl max-w-[340px] w-full" style={{ background: "#1a1d21", border: "1px solid rgba(255,255,255,0.1)" }} onClick={(e) => e.stopPropagation()}>
            <p className="text-text text-sm font-medium mb-4">enter password</p>
            <input type="password" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLogin()} placeholder="password" className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-text mb-3 outline-none focus:border-white/30" autoFocus />
            {authError && <p className="text-red-400 text-xs mb-3">{authError}</p>}
            <button onClick={handleLogin} className="w-full px-4 py-2 bg-white/10 hover:bg-white/20 text-text text-sm rounded transition-colors">unlock</button>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingThought && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.8)" }} onClick={() => setEditingThought(null)}>
          <div className="p-6 rounded-xl max-w-[440px] w-full" style={{ background: "#1a1d21", border: "1px solid rgba(255,255,255,0.1)" }} onClick={(e) => e.stopPropagation()}>
            <p className="text-text text-sm font-medium mb-4">edit thought</p>
            <input value={editingThought.title} onChange={(e) => setEditingThought({ ...editingThought, title: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-text mb-2 outline-none focus:border-white/30" />
            <textarea value={editingThought.preview} onChange={(e) => setEditingThought({ ...editingThought, preview: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-text mb-2 outline-none focus:border-white/30 resize-none" rows={3} />
            <div className="flex gap-2 mb-3">
              <input value={editingThought.tag} onChange={(e) => setEditingThought({ ...editingThought, tag: e.target.value })} placeholder="tag" className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-text outline-none focus:border-white/30" />
              <input value={editingThought.date} onChange={(e) => setEditingThought({ ...editingThought, date: e.target.value })} placeholder="date" className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-text outline-none focus:border-white/30" />
            </div>
            <div className="flex gap-2">
              <button onClick={updateThought} className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-text text-sm rounded transition-colors">save</button>
              <button onClick={() => setEditingThought(null)} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-text-mid text-sm rounded transition-colors">cancel</button>
            </div>
          </div>
        </div>
      )}

      {editingTimeline && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.8)" }} onClick={() => setEditingTimeline(null)}>
          <div className="p-6 rounded-xl max-w-[440px] w-full" style={{ background: "#1a1d21", border: "1px solid rgba(255,255,255,0.1)" }} onClick={(e) => e.stopPropagation()}>
            <p className="text-text text-sm font-medium mb-4">edit timeline entry</p>
            <input value={editingTimeline.title} onChange={(e) => setEditingTimeline({ ...editingTimeline, title: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-text mb-2 outline-none focus:border-white/30" />
            <textarea value={editingTimeline.description} onChange={(e) => setEditingTimeline({ ...editingTimeline, description: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-text mb-2 outline-none focus:border-white/30 resize-none" rows={3} />
            <div className="flex gap-2 mb-3">
              <input value={editingTimeline.period} onChange={(e) => setEditingTimeline({ ...editingTimeline, period: e.target.value })} placeholder="period" className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-text outline-none focus:border-white/30" />
              <input value={editingTimeline.tags.join(", ")} onChange={(e) => setEditingTimeline({ ...editingTimeline, tags: e.target.value.split(",").map((t) => t.trim()) })} placeholder="tags (comma separated)" className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-text outline-none focus:border-white/30" />
            </div>
            <div className="flex gap-2">
              <button onClick={updateTimeline} className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-text text-sm rounded transition-colors">save</button>
              <button onClick={() => setEditingTimeline(null)} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-text-mid text-sm rounded transition-colors">cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "40px 40px", maxWidth: 960, margin: "0 auto", textShadow: "0 2px 10px rgba(0,0,0,0.8), 0 0 30px rgba(0,0,0,0.5)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", margin: 0 }}>© 2025 enrinjr</p>
          <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
            <button onClick={() => { if (isAuthed) { setEditMode(!editMode); } else { setShowLogin(true); } }} style={{ fontSize: 11, color: editMode ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.15)", background: "none", border: "none", cursor: "pointer", transition: "color 0.3s" }}>{editMode ? "exit edit" : "✎"}</button>
            {[{ href: "/", label: "home" }, { href: "/career", label: "career" }, { href: "/art", label: "art" }].map((l) => (
              <Link key={l.label} href={l.href} style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textDecoration: "none" }}>{l.label}</Link>
            ))}
          </div>
        </div>
      </footer>
    </>
  );
}
