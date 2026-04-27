"use client";

import Link from "next/link";

export default function CareerPage() {
  return (
    <>
      <div className="grain" />
      <nav className="site-nav">
        <Link href="/" className="font-display text-[16px] font-semibold text-white no-underline tracking-tight">enrin</Link>
        <div className="flex gap-7">
          <Link href="/career" className="text-white/80 no-underline text-[13px] font-normal tracking-wide">career</Link>
          <Link href="/story" className="text-white/45 no-underline text-[13px] font-normal tracking-wide hover:text-white transition-colors duration-400">story</Link>
          <Link href="/art" className="text-white/45 no-underline text-[13px] font-normal tracking-wide hover:text-white transition-colors duration-400">art</Link>
        </div>
      </nav>

      <style>{`
        .exp-row { transition: background 0.3s ease; }
        .exp-row:hover { background: rgba(255,255,255,0.02); }
      `}</style>

      {/* HERO */}
      <section className="pt-[80px] pb-[120px] px-10 max-md:pt-[60px] max-md:pb-[80px] max-md:px-6">
        <div className="max-w-[960px] mx-auto">
          <h1 className="font-display text-[clamp(2.5rem,8vw,5.5rem)] font-bold tracking-[-4px] leading-[0.9] text-text max-md:tracking-[-3px]">career</h1>
          <p className="text-[13px] font-light tracking-[5px] text-amber-dim mt-6 lowercase">experience / projects / highlights</p>
        </div>
      </section>

      {/* EXPERIENCE */}
      <section className="py-[100px] px-10 border-t border-border max-md:py-16 max-md:px-6">
        <div className="max-w-[960px] mx-auto flex gap-[80px] items-start max-md:flex-col max-md:gap-8">
          <p className="text-[13px] font-light tracking-[5px] text-amber-dim lowercase shrink-0 pt-2 w-[140px] max-md:w-auto">experience</p>
          <div className="flex-1">
            {[
              { period: "2024 – present", company: "benmore technologies", role: "forward deployed engineer", href: "https://benmore.tech" },
              { period: "2024", company: "alervio", role: "software engineer lead" },
              { period: "2024", company: "life after ostomy", role: "software engineer", href: "https://lifeafterostomy.com" },
            ].map((exp, i) => (
              <div key={i} className="exp-row flex items-baseline gap-6 py-5 border-b border-white/[0.06] max-md:flex-col max-md:gap-1 max-md:py-4">
                <span className="text-[13px] text-text-dim tracking-wide w-[140px] shrink-0 max-md:w-auto">{exp.period}</span>
                <span className="flex-1 text-[15px] text-text font-medium tracking-tight lowercase">
                  {exp.href ? (
                    <a href={exp.href} target="_blank" rel="noopener noreferrer" className="text-text no-underline hover:text-amber transition-colors">{exp.company}</a>
                  ) : exp.company}
                </span>
                <span className="text-[13px] text-text-dim shrink-0">{exp.role}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EDUCATION & AWARDS */}
      <section className="py-[100px] px-10 border-t border-border max-md:py-16 max-md:px-6">
        <div className="max-w-[960px] mx-auto flex gap-[80px] items-start max-md:flex-col max-md:gap-8">
          <div className="shrink-0 w-[140px] max-md:w-auto">
            <p className="text-[13px] font-light tracking-[5px] text-amber-dim lowercase pt-2">education &amp;</p>
            <p className="text-[13px] font-light tracking-[5px] text-amber-dim lowercase">awards</p>
          </div>
          <div className="flex-1">
            {[
              { period: "2024", item: "penn state university", detail: "b.s. computer science" },
              { period: "2024", item: "outstanding senior award", detail: "college of engineering" },
              { period: "2024", item: "entrepreneur scholar", detail: "global designation" },
            ].map((row, i) => (
              <div key={i} className="exp-row flex items-baseline gap-6 py-5 border-b border-white/[0.06] max-md:flex-col max-md:gap-1 max-md:py-4">
                <span className="text-[13px] text-text-dim tracking-wide w-[140px] shrink-0 max-md:w-auto">{row.period}</span>
                <span className="flex-1 text-[15px] text-text font-medium tracking-tight lowercase">{row.item}</span>
                <span className="text-[13px] text-text-dim shrink-0">{row.detail}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROJECTS */}
      <section className="py-[100px] px-10 border-t border-border max-md:py-16 max-md:px-6">
        <div className="max-w-[960px] mx-auto">
          <p className="text-[13px] font-light tracking-[5px] text-amber-dim lowercase mb-14">projects</p>
          <div className="grid grid-cols-2 gap-8 max-md:grid-cols-1 max-md:gap-12">
            {[
              { img: "career/curation.png", title: "aesthetic alchemist", desc: "cinematic content engine — decodes visual inspiration into video & audio scripts", tags: "multimodal ai · veo 3 · gcp", link: "https://aesthetic-alchemist-454548514001.us-west1.run.app" },
              { img: "career/leaseIQ.png", title: "leaseiq", desc: "smart apartment hunting — scrapes 15+ sites, analyzes leases with ai", tags: "firecrawl · openrouter · next.js", link: "https://lease-iq.vercel.app/" },
              { img: "career/nextstep.png", title: "nextstep", desc: "swipe-based job matching with real-time chat and ai recommendations", tags: "react native · node · mongodb", link: "https://nextstep4.com/" },
              { img: "career/aspot1.png", title: "aspot", desc: "intelligent travel planning from real-time data and preferences", tags: "next.js · postgresql · spring", link: "https://aspot-monolith.vercel.app" },
            ].map((p) => (
              <a key={p.title} href={p.link} target="_blank" rel="noopener noreferrer" className="block no-underline group">
                <div className="overflow-hidden rounded-md mb-4">
                  <img src={`/assets/${p.img}`} alt={p.title} loading="lazy" className="w-full h-[240px] max-md:h-[200px] object-cover brightness-[0.45] saturate-[0.3] contrast-[1.15] sepia-[0.2] group-hover:brightness-[0.65] group-hover:saturate-[0.55] transition-all duration-700" />
                </div>
                <div className="flex justify-between items-baseline gap-4 mb-1">
                  <h3 className="font-display text-[16px] font-semibold text-text tracking-tight lowercase group-hover:text-amber transition-colors duration-300">{p.title}</h3>
                  <span className="text-text-dim text-[11px] tracking-wide shrink-0">{p.tags}</span>
                </div>
                <p className="text-text-mid text-[13px] leading-relaxed mt-1">{p.desc}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* HIGHLIGHTS */}
      <section className="py-[100px] px-10 border-t border-border max-md:py-16 max-md:px-6">
        <div className="max-w-[960px] mx-auto">
          <p className="text-[13px] font-light tracking-[5px] text-amber-dim lowercase mb-6">highlights</p>
          <p className="text-[22px] text-text font-normal leading-[1.6] mb-12 max-md:text-[19px]">yc hackathons in sf, columbia ai hackathon, global entrepreneur scholar, and a few other moments along the way.</p>
          <div className="grid grid-cols-3 gap-4 max-md:grid-cols-2 max-md:gap-3">
            {["career/yc.jpg", "career/columbia1.jpg", "career/susa.jpg", "career/columbia2.jpg", "career/wall.jpg", "career/ColumbiaHack.jpeg", "career/truist1.jpg", "career/nb.jpg", "career/truist2.jpg"].map((img) => (
              <div key={img} className="overflow-hidden rounded-sm">
                <img src={`/assets/${img}`} alt="" loading="lazy" className="w-full aspect-square object-cover brightness-[0.55] saturate-[0.3] contrast-[1.2] sepia-[0.25] hover:brightness-[0.78] hover:saturate-[0.65] hover:sepia-[0.08] transition-all duration-700" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* END */}
      <section className="pt-20 px-10 pb-10 border-t border-border max-md:pt-[60px] max-md:px-6 max-md:pb-[30px]">
        <div className="max-w-[700px] mx-auto flex justify-between items-start gap-10 max-md:flex-col max-md:items-center max-md:text-center max-md:gap-7">
          <div className="flex gap-8 max-md:gap-6">
            {[{ href: "/", num: "01", label: "home" }, { href: "/story", num: "02", label: "story" }, { href: "/art", num: "03", label: "art" }].map((l) => (
              <Link key={l.num} href={l.href} className="no-underline text-inherit flex flex-col gap-1 hover:-translate-y-1 transition-transform duration-300 group">
                <span className="text-[10px] text-text-faint tracking-[1px]">{l.num}</span>
                <span className="font-display text-lg font-semibold tracking-tight group-hover:text-amber transition-colors duration-300">{l.label}</span>
              </Link>
            ))}
          </div>
          <div className="flex gap-5 max-sm:flex-wrap max-sm:justify-center max-sm:gap-3.5">
            {[{ href: "mailto:nrndbrma@gmail.com", label: "email" }, { href: "https://www.linkedin.com/in/enrinjr/", label: "linkedin" }, { href: "https://github.com/emd5953", label: "github" }, { href: "/assets/ResumeEnrinDebbarma.pdf", label: "resume" }].map((c) => (
              <a key={c.label} href={c.href} target={c.href.startsWith("mailto") ? undefined : "_blank"} rel={c.href.startsWith("mailto") ? undefined : "noopener noreferrer"} className="text-text-dim no-underline text-xs hover:text-amber-dim transition-colors duration-300">{c.label}</a>
            ))}
          </div>
        </div>
        <p className="text-center text-[11px] text-text-faint mt-[60px] pt-5 border-t border-border">© 2025 enrinjr</p>
      </section>
    </>
  );
}
