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
      {/* data-expanded: the landing reads it to tell a column that needs its own
          scroll from one that should stay flush on the stage's shared top line */}
      {experiences.map((exp, i) => (
        <div key={i} className={`exp-row ${rowClassName}`} data-expanded={expandedIndex === i}>
          <button className="exp-row-btn" onClick={() => toggle(i)}>
            {/* the tilt is expand state, so it stays here rather than in the class */}
            <span className="exp-logo" style={{ transform: expandedIndex === i ? "rotate(-8deg) scale(1.05)" : "rotate(0) scale(1)" }}>
              <img src={exp.logo} alt={exp.company} />
            </span>
            <div className="exp-row-main">
              <div className="exp-head">
                <span className="exp-company">{exp.company}</span>
                <span className="exp-sep">|</span>
                <span className="exp-role">{exp.role}</span>
              </div>
              <p className="exp-period">{exp.period}</p>
            </div>
            <svg
              className="exp-chev"
              style={{ transform: expandedIndex === i ? "rotate(180deg)" : "rotate(0)" }}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div style={{ display: "grid", gridTemplateRows: expandedIndex === i ? "1fr" : "0fr", transition: "grid-template-rows 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease", opacity: expandedIndex === i ? 1 : 0 }}>
            <div style={{ overflow: "hidden" }}>
              <div className="exp-detail">
                <p className="exp-detail-text">{exp.details}</p>
                {exp.href && (
                  <a href={exp.href} target="_blank" rel="noopener noreferrer" className="exp-link">visit →</a>
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
