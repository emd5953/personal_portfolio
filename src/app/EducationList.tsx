"use client";

import { useState } from "react";
import PhotoRow from "./PhotoRow";

const educationRows = [
  { period: "2025", name: "PENN STATE", detail: "B.S. Computer Science", details: "", photos: ["/assets/career/graduation1.jpg", "/assets/career/graduation2.jpg", "/assets/career/graduation3.jpg", "/assets/career/graduation4.jpg"] },
  { period: "2025", name: "OUTSTANDING SENIOR AWARD", detail: "College of Engineering", details: "", photos: ["/assets/career/profile-pic.jpg"] },
  { period: "2025", name: "ENTREPRENEUR SCHOLAR", detail: "Scholarship", details: "", photos: ["/assets/career/truist1.jpg", "/assets/career/truist2.jpg", "/assets/career/truist3.jpg", "/assets/career/truist4.jpeg"] },
  { period: "2023", name: "IEEE", detail: "Member", details: "", photos: [] as string[] },
  { period: "2023", name: "GLOBAL AMBASSADORS", detail: "Member", details: "", photos: [] as string[] },
  { period: "2023", name: "MAEP", detail: "Member", details: "Multicultural Academic Excellence Program.", photos: [] as string[] },
  { period: "2021", name: "UNIVERSITY OF WASHINGTON", detail: "Admitted", details: "", photos: [] as string[] },
];

/* EDUCATION & AWARDS rows, shared by the landing and the career page.
   `bare` drops the section heading/padding so the landing can supply its own. */
export default function EducationList({ rowClassName = "", bare = false }: { rowClassName?: string; bare?: boolean }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const toggle = (i: number) => setExpanded(expanded === i ? null : i);

  const list = (
    <div style={{ flex: 1 }}>
      {educationRows.map((row, i) => {
        const hasContent = row.details || row.photos.length > 0;
        return (
          <div key={i} className={rowClassName}>
            <div
              className="edu-head"
              onClick={hasContent ? () => toggle(i) : undefined}
              style={{ cursor: hasContent ? "pointer" : "default" }}
            >
              <span className="edu-period">{row.period}</span>
              <span className="edu-name">{row.name}</span>
              <span className="edu-detail">{row.detail}</span>
              {hasContent && (
                <svg
                  className="edu-chev"
                  style={{ transform: expanded === i ? "rotate(180deg)" : "rotate(0)" }}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </div>
            <div style={{ display: "grid", gridTemplateRows: expanded === i ? "1fr" : "0fr", transition: "grid-template-rows 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease", opacity: expanded === i ? 1 : 0 }}>
              <div style={{ overflow: "hidden" }}>
                <div className="edu-body">
                  {row.details && <p className="edu-body-text">{row.details}</p>}
                  <PhotoRow photos={row.photos} />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  if (bare) return list;

  return (
    <section style={{ padding: "80px 0" }}>
      <div className="career-section-layout" style={{ display: "flex", alignItems: "flex-start", gap: 80 }}>
        <div style={{ width: 180, flexShrink: 0, paddingTop: 4 }}>
          <p style={{ fontSize: 18, fontWeight: 600, color: "var(--color-text)", textTransform: "uppercase", letterSpacing: "-0.02em", lineHeight: 1.3, margin: 0 }}>EDUCATION &</p>
          <p style={{ fontSize: 18, fontWeight: 600, color: "var(--color-text)", textTransform: "uppercase", letterSpacing: "-0.02em", lineHeight: 1.3, margin: 0 }}>AWARDS</p>
        </div>
        {list}
      </div>
    </section>
  );
}
