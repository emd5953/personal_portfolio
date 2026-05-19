"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

function FallingLeaves({ spawnAt }: { spawnAt: { x: number; y: number } | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const leavesRef = useRef<{ x: number; y: number; size: number; speed: number; drift: number; rotation: number; rotSpeed: number; opacity: number; color: string }[]>([]);
  const initRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    const colors = ["#000000", "#000000", "#000000", "#010101", "#000000", "#020202"];
    const leaves = leavesRef.current;

    function makeLeaf(x: number, y: number) {
      return {
        x, y,
        size: 4 + Math.random() * 8,
        speed: 0.3 + Math.random() * 0.7,
        drift: (Math.random() - 0.5) * 0.5,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.02,
        opacity: 1,
        color: colors[Math.floor(Math.random() * colors.length)],
      };
    }

    if (!initRef.current) {
      for (let i = 0; i < 25; i++) {
        leaves.push(makeLeaf(Math.random() * canvas.width, Math.random() * canvas.height - canvas.height));
      }
      initRef.current = true;
    }

    // Store makeLeaf on ref so we can use it from the spawn effect
    (canvasRef as unknown as { current: HTMLCanvasElement & { _makeLeaf: typeof makeLeaf } }).current._makeLeaf = makeLeaf;

    function draw() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      for (let i = leaves.length - 1; i >= 0; i--) {
        const leaf = leaves[i];
        leaf.y += leaf.speed;
        leaf.x += leaf.drift + Math.sin(leaf.y * 0.01) * 0.3;
        leaf.rotation += leaf.rotSpeed;

        if (leaf.y > canvas!.height + 20) {
          if (leaves.length > 25) { leaves.splice(i, 1); continue; }
          leaf.y = -20;
          leaf.x = Math.random() * canvas!.width;
        }
        if (leaf.x > canvas!.width + 20) leaf.x = -20;
        if (leaf.x < -20) leaf.x = canvas!.width + 20;

        ctx!.save();
        ctx!.translate(leaf.x, leaf.y);
        ctx!.rotate(leaf.rotation);
        ctx!.globalAlpha = leaf.opacity;
        ctx!.fillStyle = leaf.color;
        ctx!.beginPath();
        ctx!.ellipse(0, 0, leaf.size * 0.4, leaf.size, 0, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.restore();
      }
      animId = requestAnimationFrame(draw);
    }
    draw();

    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);

  // Spawn leaves when spawnAt changes
  useEffect(() => {
    if (!spawnAt) return;
    const leaves = leavesRef.current;
    const canvas = canvasRef.current as HTMLCanvasElement & { _makeLeaf?: (x: number, y: number) => typeof leaves[0] };
    if (!canvas?._makeLeaf) return;
    const burst = 8 + Math.floor(Math.random() * 6);
    for (let i = 0; i < burst; i++) {
      leaves.push(canvas._makeLeaf(
        spawnAt.x + (Math.random() - 0.5) * 60,
        spawnAt.y + (Math.random() - 0.5) * 30,
      ));
    }
  }, [spawnAt]);

  return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }} />;
}

const quips = [
  "here come the leaves 🍃",
  "why are you clicking here?",
  "touch grass... oh wait",
  "🌴 vibes",
  "im an island boy 🏝️",
];

function ClickQuip({ x, y, text }: { x: number; y: number; text: string }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => { const t = setTimeout(() => setVisible(false), 2000); return () => clearTimeout(t); }, []);
  if (!visible) return null;
  return (
    <div style={{
      position: "fixed", left: x, top: y - 50, zIndex: 999, pointerEvents: "none",
      transform: "translateX(-50%)",
      animation: "quipIn 0.3s ease, quipOut 0.4s ease 1.6s forwards",
    }}>
      <div style={{
        background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 400,
        fontStyle: "italic", fontFamily: "var(--font-inter), sans-serif",
        padding: "5px 12px", borderRadius: 14, whiteSpace: "nowrap",
        boxShadow: "none",
      }}>
        {text}
      </div>
      <div style={{
        width: 8, height: 8, background: "rgba(255,255,255,0.15)", borderRadius: "50%",
        marginLeft: "50%", marginTop: 3,
      }} />
      <div style={{
        width: 5, height: 5, background: "rgba(255,255,255,0.15)", borderRadius: "50%",
        marginLeft: "55%", marginTop: 2,
      }} />
    </div>
  );
}

const experiences = [
  {
    company: "BENMORE TECHNOLOGIES",
    role: "Forward Deployed Engineer",
    period: "2026 – Present",
    href: "https://benmore.tech",
    logo: "/assets/career/benmore.png",
    details: "Working with startups & SMBs. Building products from zero to one — ai, product, agents, workflows, integrations. Bootstrapped to 2M ARR.",
    photos: [] as string[],
  },
  {
    company: "ALERVIO",
    role: "Software Engineer",
    period: "2025",
    logo: "/assets/career/alervio_logo.jpeg",
    details: "Full Stack Lead for B2B/B2C product. Dealing with nutrition and restaurant data.",
    photos: [] as string[],
  },
  {
    company: "Y COMBINATOR",
    role: "Startup School 2026 · 2x Hackathon",
    period: "2026",
    logo: "/assets/career/Y_Combinator_logo.svg",
    details: "Referred to YC Startup School 2026 by Aaron Epstein and participated in two YC hackathons in SF.",
    photos: ["/assets/career/yc.jpg", "/assets/career/susa.jpg", "/assets/career/nb.jpg", "/assets/career/wall.jpg"],
  },
  {
    company: "COLUMBIA UNIVERSITY",
    role: "AI for Good Hackathon",
    period: "2026",
    logo: "/assets/career/columbia_uni.png",
    details: "Building Wavelength. Scan and see what songs are being played near you",
    photos: ["/assets/career/columbia1.jpg", "/assets/career/columbia2.jpg", "/assets/career/ColumbiaHack.jpeg"],
  },
  {
    company: "STANFORD UNIVERSITY",
    role: "Stanford X Google Deepmind Hackathon",
    period: "2026",
    logo: "/assets/career/stanford logo.png",
    details: "Building Curation.you. Your everyday pictures turned into production ready videos.",
    photos: [],
  },
];

const educationRows = [
  { period: "2025", name: "PENN STATE", detail: "B.S. Computer Science", details: "", photos: ["/assets/career/graduation1.jpg", "/assets/career/graduation2.jpg", "/assets/career/graduation3.jpg", "/assets/career/graduation4.jpg"] },
  { period: "2025", name: "OUTSTANDING SENIOR AWARD", detail: "College of Engineering", details: "", photos: ["/assets/career/profile-pic.jpg"] },
  { period: "2025", name: "ENTREPRENEUR SCHOLAR", detail: "Scholarship", details: "", photos: ["/assets/career/truist1.jpg", "/assets/career/truist2.jpg", "/assets/career/truist3.jpg", "/assets/career/truist4.jpeg"] },
  { period: "2023", name: "IEEE", detail: "Member", details: "", photos: [] as string[] },
  { period: "2023", name: "GLOBAL AMBASSADORS", detail: "Member", details: "", photos: [] as string[] },
  { period: "2023", name: "MAEP", detail: "Member", details: "Multicultural Academic Excellence Program.", photos: [] as string[] },
  { period: "2021", name: "UNIVERSITY OF WASHINGTON", detail: "Admitted", details: "", photos: [] as string[] },
];

const projectRows = [
  { period: "2024", name: "AESTHETIC ALCHEMIST", detail: "Gemini 3.1 Pro · Veo 3.1", link: "https://aesthetic-alchemist-454548514001.us-west1.run.app", details: "Curation tool that transforms your everyday pictures into production-grade short form content.", photos: ["/assets/career/curation.png"] },
  { period: "2024", name: "LEASEIQ", detail: "Firecrawl · ", link: "https://lease-iq.vercel.app/", details: "Smart lease analysis platform that crawls and breaks down rental agreements using AI.", photos: ["/assets/career/leaseIQ.png"] },
  { period: "2024", name: "NEXTSTEP", detail: "React Native · Node", link: "https://nextstep4.com/", details: "Job matching platform w/ AI agent that applies to jobs for you.", photos: ["/assets/career/nextstep.png"] },
  { period: "2024", name: "ASPOT", detail: "Next.js · Spring", link: "https://aspot-monolith.vercel.app", details: "AI Itinerary Generator giving you curated plans.", photos: ["/assets/career/aspot2.jpg"] },
];

function PhotoRow({ photos }: { photos: string[] }) {
  if (!photos.length) return null;
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

function ProjectCards({ rows }: { rows: typeof projectRows }) {
  return (
    <section style={{ padding: "80px 0" }}>
      <div className="career-section-layout" style={{ display: "flex", alignItems: "flex-start", gap: 80 }}>
        <div style={{ width: 180, flexShrink: 0, paddingTop: 4 }}>
          <p style={{ fontSize: 18, fontWeight: 600, color: "var(--color-text)", textTransform: "uppercase", letterSpacing: "-0.02em", lineHeight: 1.3, margin: 0 }}>PROJECTS</p>
        </div>
        <div className="career-project-grid" style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
          {rows.map((row, i) => (
            <a key={i} href={row.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden", transition: "border-color 0.3s, transform 0.3s", cursor: "pointer" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.transform = "translateY(-2px)"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.transform = "translateY(0)"; }}>
              <div style={{ background: "rgba(255,255,255,0.03)", padding: 12, aspectRatio: "16/9", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                {row.photos[0] && <img src={row.photos[0]} alt={row.name} style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: 6 }} />}
              </div>
              <div style={{ padding: "12px 16px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <p style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text)", margin: 0 }}>{row.name.charAt(0) + row.name.slice(1).toLowerCase()}</p>
                  <div style={{ display: "flex", gap: 6 }}>
                    {row.detail.split(" · ").map((tag) => (
                      <span key={tag} style={{ fontSize: 9, color: "var(--color-text-dim)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 4, padding: "1px 6px", textTransform: "uppercase", letterSpacing: 0.5 }}>{tag}</span>
                    ))}
                  </div>
                </div>
                <p style={{ fontSize: 13, color: "var(--color-text-mid)", lineHeight: 1.6, margin: 0 }}>{row.details}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function ExpandableEducation({ rows }: { rows: typeof educationRows }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const toggle = (i: number) => setExpanded(expanded === i ? null : i);

  return (
    <section style={{ padding: "80px 0" }}>
      <div className="career-section-layout" style={{ display: "flex", alignItems: "flex-start", gap: 80 }}>
        <div style={{ width: 180, flexShrink: 0, paddingTop: 4 }}>
          <p style={{ fontSize: 18, fontWeight: 600, color: "var(--color-text)", textTransform: "uppercase", letterSpacing: "-0.02em", lineHeight: 1.3, margin: 0 }}>EDUCATION &</p>
          <p style={{ fontSize: 18, fontWeight: 600, color: "var(--color-text)", textTransform: "uppercase", letterSpacing: "-0.02em", lineHeight: 1.3, margin: 0 }}>AWARDS</p>
        </div>
        <div style={{ flex: 1 }}>
          {rows.map((row, i) => {
            const hasContent = row.details || row.photos.length > 0;
            return (
              <div key={i}>
                <div
                  onClick={hasContent ? () => toggle(i) : undefined}
                  style={{ display: "flex", alignItems: "baseline", gap: 32, padding: "18px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", cursor: hasContent ? "pointer" : "default" }}
                >
                  <span style={{ fontSize: 13, color: "var(--color-text-dim)", width: 60, flexShrink: 0 }}>{row.period}</span>
                  <span style={{ flex: 1, fontSize: 14, color: "var(--color-text)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em" }}>{row.name}</span>
                  <span style={{ fontSize: 13, color: "var(--color-text-dim)", flexShrink: 0 }}>{row.detail}</span>
                  {hasContent && (
                    <svg
                      style={{ width: 16, height: 16, color: "rgba(255,255,255,0.2)", flexShrink: 0, transition: "transform 0.3s", transform: expanded === i ? "rotate(180deg)" : "rotate(0)", marginLeft: 8 }}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </div>
                <div style={{ display: "grid", gridTemplateRows: expanded === i ? "1fr" : "0fr", transition: "grid-template-rows 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease", opacity: expanded === i ? 1 : 0 }}>
                  <div style={{ overflow: "hidden" }}>
                  <div style={{ padding: "14px 0 10px 92px" }}>
                    {row.details && <p style={{ fontSize: 13, color: "var(--color-text-mid)", lineHeight: 1.7, margin: 0 }}>{row.details}</p>}
                    <PhotoRow photos={row.photos} />
                  </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default function CareerPage() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const toggle = (i: number) => setExpandedIndex(expandedIndex === i ? null : i);
  const [spawnAt, setSpawnAt] = useState<{ x: number; y: number } | null>(null);
  const [activeQuips, setActiveQuips] = useState<{ id: number; x: number; y: number; text: string }[]>([]);
  const clickCountRef = useRef(0);
  const quipIdRef = useRef(0);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (target.closest("[data-content], nav, footer")) return;
      setSpawnAt({ x: e.clientX, y: e.clientY });
      clickCountRef.current++;
      // Show quip every 3rd click
      if (clickCountRef.current % 3 === 1) {
        const id = quipIdRef.current++;
        const text = quips[Math.floor(Math.random() * quips.length)];
        setActiveQuips(prev => [...prev, { id, x: e.clientX, y: e.clientY, text }]);
        setTimeout(() => setActiveQuips(prev => prev.filter(q => q.id !== id)), 2200);
      }
    }
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);

  return (
    <>
      <div className="grain" />
      <style>{`
        @keyframes quipIn { from { opacity: 0; transform: translateX(-50%) translateY(10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        @keyframes quipOut { from { opacity: 1; } to { opacity: 0; transform: translateX(-50%) translateY(-10px); } }
        @keyframes scrollHint { 0%, 100% { transform: translateX(0); opacity: 0.4; } 50% { transform: translateX(6px); opacity: 0.8; } }
      `}</style>
      <FallingLeaves spawnAt={spawnAt} />
      {activeQuips.map(q => <ClickQuip key={q.id} x={q.x} y={q.y} text={q.text} />)}
      <div style={{ position: "fixed", inset: 0, zIndex: -1 }}>
        <img
          src="/assets/landing/9.jpg"
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 70%", filter: "brightness(0.15) saturate(0.15) contrast(1.1)" }}
        />
      </div>
      <nav className="site-nav">
        <Link href="/" className="font-display text-[16px] font-semibold text-white no-underline tracking-tight">enrin</Link>
        <div className="flex gap-7">
          <Link href="/career" className="text-white/80 no-underline text-[13px] font-normal tracking-wide">career</Link>
          <Link href="/story" className="text-white/45 no-underline text-[13px] font-normal tracking-wide hover:text-white transition-colors duration-400">story</Link>
          <Link href="/art" className="text-white/45 no-underline text-[13px] font-normal tracking-wide hover:text-white transition-colors duration-400">art</Link>
        </div>
      </nav>

      <div data-content style={{ maxWidth: 1100, margin: "0 auto", padding: "0 clamp(16px, 4vw, 40px)" }}>

        {/* HERO */}
        <section style={{ paddingTop: 20, paddingBottom: 0 }}>
          <h1 className="font-display" style={{ fontSize: "clamp(2.5rem, 8vw, 5.5rem)", fontWeight: 700, letterSpacing: -4, lineHeight: 0.9, color: "var(--color-text)" }}>career</h1>
        </section>

        {/* EXPERIENCE */}
        <section style={{ padding: "40px 0 80px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="career-section-layout" style={{ display: "flex", alignItems: "flex-start", gap: 80 }}>
            <p style={{ fontSize: 18, fontWeight: 600, color: "var(--color-text)", textTransform: "uppercase", letterSpacing: "-0.02em", width: 180, flexShrink: 0, paddingTop: 40, margin: 0 }}>EXPERIENCE</p>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, paddingTop: 22 }}>
              {experiences.map((exp, i) => (
                <div key={i} style={{ padding: "18px 0" }}>
                  <button
                    onClick={() => toggle(i)}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 20, background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}
                  >
                    <span style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden", transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)", transform: expandedIndex === i ? "rotate(-8deg) scale(1.05)" : "rotate(0) scale(1)" }}>
                      <img src={exp.logo} alt={exp.company} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 13, color: "var(--color-text)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>{exp.company}</span>
                        <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 14 }}>|</span>
                        <span style={{ fontSize: 13, color: "var(--color-text-dim)" }}>{exp.role}</span>
                      </div>
                      <p style={{ fontSize: 13, color: "var(--color-text-dim)", margin: "4px 0 0" }}>{exp.period}</p>
                    </div>
                    <svg
                      style={{ width: 18, height: 18, color: "rgba(255,255,255,0.2)", flexShrink: 0, transition: "transform 0.3s", transform: expandedIndex === i ? "rotate(180deg)" : "rotate(0)" }}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div style={{ display: "grid", gridTemplateRows: expandedIndex === i ? "1fr" : "0fr", transition: "grid-template-rows 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease", opacity: expandedIndex === i ? 1 : 0 }}>
                    <div style={{ overflow: "hidden" }}>
                    <div style={{ paddingLeft: 76, paddingTop: 14, paddingBottom: 8 }}>
                      <p style={{ fontSize: 13, color: "var(--color-text-mid)", lineHeight: 1.7, margin: 0 }}>{exp.details}</p>
                      {exp.href && (
                        <a href={exp.href} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "var(--color-amber-dim)", textDecoration: "none", marginTop: 8, display: "inline-block" }}>visit →</a>
                      )}
                      <PhotoRow photos={exp.photos} />
                    </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <ExpandableEducation rows={educationRows} />
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <ProjectCards rows={projectRows} />
        </div>

      </div>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "80px clamp(16px, 4vw, 40px) 40px", maxWidth: 960, margin: "0 auto" }}>
        <p style={{ fontSize: 18, fontWeight: 600, color: "var(--color-text)", textTransform: "uppercase", marginBottom: 32 }}>Contact</p>
        <div style={{ display: "flex", gap: 28, marginBottom: 60, alignItems: "center" }}>
          {[
            { href: "https://www.linkedin.com/in/enrinjr/", label: "LinkedIn", icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg> },
            { href: "https://github.com/emd5953", label: "GitHub", icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg> },
            { href: "mailto:nrndbrma@gmail.com", label: "Email", icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/></svg> },
          ].map((c) => (
            <a key={c.label} href={c.href} target={c.href.startsWith("mailto") ? undefined : "_blank"} rel={c.href.startsWith("mailto") ? undefined : "noopener noreferrer"} aria-label={c.label} style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none", transition: "color 0.3s", display: "flex", alignItems: "center" }} onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.8)"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}>{c.icon}</a>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 24 }}>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", margin: 0 }}>© 2025 enrinjr</p>
          <div style={{ display: "flex", gap: 24 }}>
            {[{ href: "/", label: "home" }, { href: "/story", label: "story" }, { href: "/art", label: "art" }].map((l) => (
              <Link key={l.label} href={l.href} style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textDecoration: "none" }}>{l.label}</Link>
            ))}
          </div>
        </div>
      </footer>
    </>
  );
}
