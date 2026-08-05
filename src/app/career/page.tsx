"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import FallingLeaves from "../FallingLeaves";
import PhotoRow from "../PhotoRow";
import ExperienceList from "../ExperienceList";
import EducationList from "../EducationList";

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

const projectRows = [
  { period: "2026", name: "aSpot", detail: "tavily . next.js . supabase . resend", link: "https://aspot.enrinjr.com", details: "AI itinerary platform giving you curated plans in minutes", photos: ["/assets/career/aspot.png"] },
  { period: "2026", name: "LeaseIQ", detail: "firecrawl · reducto . open router. render", link: "https://lease-iq.vercel.app/", details: "Smart apartment hunting & lease analysis platform", photos: ["/assets/career/leaseIQ.png"] },
];

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
                  <p style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text)", margin: 0 }}>{row.name}</p>
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

export default function CareerPage() {
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
        @keyframes resumeBob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(4px); } }

        .resume-btn {
          display: inline-block;
          font-size: 14px;
          color: var(--color-text-mid);
          text-decoration: none;
          letter-spacing: 0.02em;
          padding-top: 4px;
          transition: color 0.3s;
        }
        .resume-btn:hover {
          color: var(--color-text);
        }
      `}</style>
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}><FallingLeaves spawnAt={spawnAt} /></div>
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
            <div style={{ flex: 1, paddingTop: 22 }}>
              <ExperienceList />
            </div>
          </div>
        </section>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <EducationList />
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <ProjectCards rows={projectRows} />
        </div>

        {/* RESUME DOWNLOAD */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <section style={{ padding: "80px 0" }}>
            <div className="career-section-layout" style={{ display: "flex", alignItems: "flex-start", gap: 80 }}>
              <div style={{ width: 180, flexShrink: 0, paddingTop: 4 }}>
                <p style={{ fontSize: 18, fontWeight: 600, color: "var(--color-text)", textTransform: "uppercase", letterSpacing: "-0.02em", lineHeight: 1.3, margin: 0 }}>RESUME</p>
              </div>
              <div style={{ flex: 1 }}>
                <a
                  href="/assets/ResumeEnrinDebbarma.pdf"
                  download="ResumeEnrinDebbarma.pdf"
                  className="resume-btn"
                  aria-label="Download resume"
                >
                  download pdf
                </a>
              </div>
            </div>
          </section>
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
