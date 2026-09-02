"use client";

import { useState } from "react";
import PhotoRow from "./PhotoRow";

const experiences = [
  {
    company: "Counter Labs, Inc",
    role: "Forward Deployed Engineer",
    period: "May 26' – Present",
    logo: "/assets/career/counterlogo.png",
    details: "Building ChefOS, the Operating System for Modern Restaurants.",
    photos: [] as string[],
  },
  {
    company: "BENMORE TECHNOLOGIES",
    role: "Forward Deployed Engineer",
    period: "Feb 26' – May 26'",
    href: "https://benmore.tech",
    logo: "/assets/career/benmore.png",
    details: "Working with startups & SMBs. Industries involved: PE (M&A), Voice Agents in Healthcare, Home Services, Legal AI. Bootstrapped to 2M ARR.",
    photos: [] as string[],
  },
  {
    company: "ALERVIO",
    role: "Software Engineer Intern",
    period: "25'",
    logo: "/assets/career/alervio_logo.jpeg",
    details: "Full Stack Lead for B2B/B2C product. Building the intelligence layer for nutrition and restaurant data.",
    photos: [] as string[],
  },
  {
    company: "Y COMBINATOR",
    role: "Startup School 2026 · 2x Hackathon",
    period: "26'",
    logo: "/assets/career/Y_Combinator_logo.svg",
    details: "Referred to YC Startup School 2026 by Aaron Epstein and participated in two YC hackathons in SF.",
    photos: ["/assets/career/yc.jpg", "/assets/career/susa.jpg", "/assets/career/nb.jpg", "/assets/career/wall.jpg"],
  },
  {
    company: "COLUMBIA UNIVERSITY",
    role: "AI for Good Hackathon",
    period: "26'",
    logo: "/assets/career/columbia_uni.png",
    details: "Building Wavelength. Scan and see what songs are being played near you",
    photos: ["/assets/career/columbia1.jpg", "/assets/career/columbia2.jpg", "/assets/career/ColumbiaHack.jpeg"],
  },
  {
    company: "STANFORD UNIVERSITY",
    role: "Stanford X Google Deepmind Hackathon",
    period: "26'",
    logo: "/assets/career/stanford logo.png",
    details: "Building Curation.you. Your everyday pictures turned into production ready videos.",
    photos: [],
  },
];

/* The EXPERIENCE accordion, shared by the landing and the career page. */
export default function ExperienceList({ rowClassName = "" }: { rowClassName?: string }) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const toggle = (i: number) => setExpandedIndex(expandedIndex === i ? null : i);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
      {experiences.map((exp, i) => (
        <div key={i} className={rowClassName} style={{ padding: "18px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <button
            onClick={() => toggle(i)}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 20, background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}
          >
            <span style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden", transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)", transform: expandedIndex === i ? "rotate(-8deg) scale(1.05)" : "rotate(0) scale(1)" }}>
              <img src={exp.logo} alt={exp.company} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* fixed company column, so the divider and the role line up down
                  the list instead of stepping in and out with the name length */}
              <div style={{ display: "grid", gridTemplateColumns: "128px auto 1fr", alignItems: "baseline", gap: 10 }}>
                <span style={{ fontSize: 12, color: "var(--color-text)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.02em" }}>{exp.company}</span>
                <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 14 }}>|</span>
                <span style={{ fontSize: 12, color: "var(--color-text-dim)" }}>{exp.role}</span>
              </div>
              <p style={{ fontSize: 12, color: "var(--color-text-dim)", margin: "4px 0 0" }}>{exp.period}</p>
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
  );
}
