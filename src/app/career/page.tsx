"use client";

import { useEffect } from "react";
import Link from "next/link";
import "../career.css";

export default function CareerPage() {
  useEffect(() => {
    // Scroll animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            el.style.opacity = "1";
            el.style.transform = "translateY(0)";
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    document.querySelectorAll(".about-section, .projects-section, .skills-section").forEach((section) => {
      const el = section as HTMLElement;
      el.style.opacity = "0";
      el.style.transform = "translateY(30px)";
      el.style.transition = "opacity 0.8s ease, transform 0.8s ease";
      observer.observe(el);
    });

    document.querySelectorAll(".project-card").forEach((card, index) => {
      const el = card as HTMLElement;
      el.style.opacity = "0";
      el.style.transform = "translateY(40px)";
      el.style.transition = `opacity 0.8s ease ${index * 0.2}s, transform 0.8s ease ${index * 0.2}s`;
      observer.observe(el);
    });

    // Scroll progress bar
    const progressBar = document.createElement("div");
    Object.assign(progressBar.style, {
      position: "fixed", top: "0", left: "0", width: "0%", height: "2px",
      backgroundColor: "#333", zIndex: "9999", transition: "width 0.1s ease",
    });
    document.body.appendChild(progressBar);

    const onScroll = () => {
      const scrollPercent = (window.pageYOffset / (document.body.offsetHeight - window.innerHeight)) * 100;
      progressBar.style.width = scrollPercent + "%";
    };
    window.addEventListener("scroll", onScroll);

    // Hamburger
    const hamburger = document.querySelector(".hamburger");
    const navLinks = document.querySelector(".nav-links");
    if (hamburger && navLinks) {
      hamburger.addEventListener("click", () => {
        hamburger.classList.toggle("active");
        navLinks.classList.toggle("active");
      });
      navLinks.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
          hamburger.classList.remove("active");
          navLinks.classList.remove("active");
        });
      });
    }

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      progressBar.remove();
    };
  }, []);

  return (
    <>
      <div className="top-banner">open to connect • product focused</div>

      <nav>
        <Link href="/" className="logo">enrin</Link>
        <button className="hamburger" aria-label="Menu">
          <span /><span /><span />
        </button>
        <ul className="nav-links">
          <li><a href="#about">about</a></li>
          <li><a href="#experience">experience</a></li>
          <li><a href="#education">education</a></li>
          <li><a href="#projects">projects</a></li>
          <li><a href="#skills">skills</a></li>
          <li><a href="#contact">contact</a></li>
        </ul>
        <div className="nav-right">
          <a href="#whats-new" className="whats-new-badge">→ what&apos;s new</a>
          <Link href="/story">story</Link>
          <Link href="/art">art</Link>
          <a href="#contact">connect</a>
          <a href="mailto:nrndbrma@gmail.com">email</a>
          <a href="https://github.com/emd5953">github</a>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-content fade-in">
          <div className="section__pic-container">
            <img src="/assets/profile-pic.jpg" alt="Enrin Debbarma profile picture" />
          </div>
          <h1>software engineer</h1>
          <h2>currently working with startups and SMEs as a forward deployed engineer</h2>
          <p>love working with passionate people that have unique yet fun ideas</p>
          <div className="btn-container">
            <button className="cta-button" onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}>
              let&apos;s:connect
            </button>
          </div>
          <div id="socials-container">
            <svg className="icon" onClick={() => window.open("https://www.linkedin.com/in/enrinjr/")} viewBox="0 0 24 24" fill="#0077B5">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
            <svg className="icon" onClick={() => window.open("https://github.com/emd5953")} viewBox="0 0 24 24" fill="#333">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          </div>
        </div>
      </section>

      <section className="about-section" id="about">
        <div className="about-side-image about-left">
          <img src="/assets/aboutme1.jpg" alt="About decoration" loading="lazy" />
        </div>
        <div className="about-container">
          <div className="section__pic_about-container">
            <img src="/assets/about-pic.jpg" alt="Profile Picture" className="about-pic" loading="lazy" />
          </div>
          <h2>about:me</h2>
          <p>experienced in building SaaS applications. product/consumer-focused. i enjoy building creative products. lately, I have been working with microservices, containerization/orchestration, and building ai agents.</p>
          <p>i usually work a lot with javascript, typescript, react/next, node/express, java/spring, postgreSQL, mongodb, rest apis, rag agents, docker, aws, gcp</p>
          <p>when i&apos;m not coding, i&apos;m making film, playing my guitar or dancing. i like afrobeats, r&amp;b, going out, and catching a sunset. i also hoop for fun. people say i&apos;m performative but i acc hate matcha</p>
        </div>
        <div className="about-side-image about-right">
          <img src="/assets/aboutme2.jpg" alt="About decoration" loading="lazy" />
        </div>
      </section>

      <section className="experience-section" id="experience">
        <div className="experience-container">
          <h2 className="section-title">professional experience</h2>

          <div className="experience-card">
            <div className="experience-header">
              <div className="experience-title">
                <h3>forward deployed engineer</h3>
                <span className="company"><a href="https://benmore.tech" target="_blank" rel="noopener noreferrer" style={{ color: "#666", textDecoration: "none" }}>benmore technologies</a> • chicago, il</span>
              </div>
              <span className="experience-date">feb. 2026 – present</span>
            </div>
            <ul className="experience-details">
              <li>work directly with startups and SMEs to translate business needs into technical products, owning the full lifecycle from scoping to production deployment</li>
              <li>manage a $270K+ project portfolio end-to-end, driving timelines, stakeholder communication, and delivery across multiple concurrent engagements</li>
              <li>build and ship full-stack products using Django and Next.js, deployed on AWS and Vercel</li>
              <li>accelerate development velocity using Claude Code and multi-agentic orchestration workflows for rapid 0-to-1 product delivery</li>
            </ul>
          </div>

          <div className="experience-card">
            <div className="experience-header">
              <div className="experience-title">
                <h3>software engineer intern</h3>
                <span className="company">alervio inc. • bridgewater, nj</span>
              </div>
              <span className="experience-date">june 2025 – aug. 2025</span>
            </div>
            <ul className="experience-details">
              <li>led development of full-stack application, and integrated LLM-powered features using FastAPI and vector search</li>
              <li>built production B2B platform using React, Firebase, and TypeScript; developed ML-based matching algorithm to process datasets from external APIs</li>
              <li>established CI/CD pipeline with Vercel and designed UI/UX in Figma, translating mockups into frontend components</li>
              <li>proposed migration to Next.js and Tailwind CSS, improving development efficiency by 40%</li>
            </ul>
          </div>

          <div className="experience-card">
            <div className="experience-header">
              <div className="experience-title">
                <h3>software engineer</h3>
                <span className="company"><a href="https://lifeafterostomy.com" target="_blank" rel="noopener noreferrer" style={{ color: "#666", textDecoration: "none" }}>life after ostomy</a> • harrisburg, pa</span>
              </div>
              <span className="experience-date">aug. 2025 – aug. 2025</span>
            </div>
            <ul className="experience-details">
              <li>built a PWA e-commerce platform for 10,000+ ostomy community members using Next.js, TypeScript, and Supabase</li>
              <li>optimized SEO and performance, driving a 178% increase in visitor traffic within 30 days</li>
              <li>integrated secure Stripe payments and delivered a mobile-first, accessible UI achieving a 98% accessibility score</li>
            </ul>
          </div>

          <div className="experience-card">
            <div className="experience-header">
              <div className="experience-title">
                <h3>it operations specialist</h3>
                <span className="company">penn state harrisburg • harrisburg, pa</span>
              </div>
              <span className="experience-date">mar. 2024 – oct. 2024</span>
            </div>
            <ul className="experience-details">
              <li>resolved 50+ daily IT support tickets using ServiceNow, improving reliability for 5,000+ campus users</li>
              <li>configured and maintained 200+ workstations and IoT devices, ensuring secure, continuous network connectivity</li>
            </ul>
          </div>

          <div className="experience-card">
            <div className="experience-header">
              <div className="experience-title">
                <h3>product tester</h3>
                <span className="company">zolve (fintech) • remote</span>
              </div>
              <span className="experience-date">may 2023 – aug. 2023</span>
            </div>
            <ul className="experience-details">
              <li>coordinated with cross-functional teams to identify and resolve inactive features, enhancing platform performance and reliability</li>
              <li>enhanced growth in user engagement by 15% through systematic testing and feature optimization</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="education-section" id="education">
        <div className="education-container">
          <h2 className="section-title">education</h2>
          <div className="education-card">
            <div className="education-header">
              <div className="education-title">
                <h3>the pennsylvania state university</h3>
                <span className="degree">bachelor&apos;s of science in computer science</span>
              </div>
              <div className="education-info">
                <span className="location">harrisburg, pa</span>
                <span className="education-date">jan. 2022 - dec. 2025</span>
              </div>
            </div>
            <div className="coursework">
              <h4>honors &amp; awards:</h4>
              <p className="course-list">outstanding senior award — penn state, 2025</p>
            </div>
            <div className="coursework">
              <h4>relevant coursework:</h4>
              <p className="course-list">data structures • object oriented programming • formal languages • compilers • machine learning • database management • software engineering management • artificial intelligence • advanced algorithms • operating systems • capstone project • discrete math</p>
            </div>
          </div>
        </div>
      </section>

      <section className="projects-section" id="projects">
        <div className="projects-container">
          <h2 className="section-title">recent projects</h2>

          {[
            { img: "curation.png", title: "aesthetic alchemist: cinematic content engine", desc: "a multimodal engine that decodes your visual inspiration and synthesizes cinematic video & audio scripts for your raw photos — transforming vision into production.", tags: ["multimodal ai", "veo 3", "lyria 3", "gcp cloud run"], links: [{ label: "live site", href: "https://aesthetic-alchemist-454548514001.us-west1.run.app" }] },
            { img: "leaseIQ.png", title: "leaseiq: smart apartment hunting", desc: "smart apartment hunting platform that scrapes 15+ sites, sends preference-based alerts, and analyzes leases/floor plans with ai — plus neighborhood research straight to your email.", tags: ["firecrawl", "reducto", "openrouter", "resend", "next.js"], links: [{ label: "github", href: "https://github.com/emd5953/leaseIQ" }, { label: "live site", href: "https://lease-iq.vercel.app/" }] },
            { img: "nextstep.png", title: "nextstep: swipe-based job matching", desc: "ai job matching platform using swipe mechanics to connect job seekers with opportunities. features real-time matching, chat integration, and ai-powered recommendations.", tags: ["react/react native", "node/express", "mongodb/chromadb", "aws ec2/docker", "gpt/gemini"], links: [{ label: "github", href: "https://github.com/emd5953/NextStep" }, { label: "live site", href: "https://nextstep4.com/" }, { label: "demo", href: "https://drive.google.com/drive/folders/1LYA5TdmC-QtgQOz3GPLLfzV8O3kxUb5H?usp=sharing" }] },
            { img: "aspot1.png", title: "aspot: smart itinerary maker", desc: "intelligent travel planning application that creates personalized itineraries based on user preferences, location data, and real-time information.", tags: ["typescript", "next.js", "postgresql", "java/spring", "elasticsearch/redis", "docker"], links: [{ label: "github", href: "https://github.com/emd5953/itinerary_maker" }, { label: "live site", href: "https://aspot-monolith.vercel.app/dashboard" }] },
            { img: "GMLogo.png", title: "gitmatch: social media for developers", desc: "a social platform designed specifically for developers to connect, share similar interests, and collaborate on code. features github integration and code snippet sharing.", tags: ["vite + react.js", "python/fastapi", "postgresql", "github api"], links: [{ label: "github", href: "https://github.com/emd5953" }] },
          ].map((project) => (
            <div className="project-card" key={project.title}>
              <img src={`/assets/${project.img}`} alt={project.title} className="project-img" loading="lazy" />
              <div className="project-info">
                <h3>{project.title}</h3>
                <p>{project.desc}</p>
                <div className="tech-tags">
                  {project.tags.map((tag) => <span className="tech-tag" key={tag}>{tag}</span>)}
                </div>
                <div className="project-links">
                  {project.links.map((link) => (
                    <button className="project-btn" key={link.label} onClick={() => window.open(link.href)}>{link.label}</button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="skills-section" id="skills">
        <div className="skills-container">
          <h2>skills &amp; expertise</h2>
          <div className="skills-grid">
            {[
              { title: "languages", items: ["javascript / typescript", "python", "java", "sql", "html / css"] },
              { title: "frontend", items: ["react / next.js", "react native", "tailwind css", "redux"] },
              { title: "backend", items: ["node.js / express.js", "fastapi / flask", "spring boot", "langchain", "rest apis"] },
              { title: "databases", items: ["postgresql", "mongodb", "supabase", "firebase", "upstash"] },
              { title: "cloud / devops", items: ["aws (ec2, s3)", "gcp", "docker / kubernetes", "vercel", "github actions"] },
              { title: "tools & other", items: ["git / github", "cursor / claude code", "redis / nginx / vite", "jira / figma", "postman / jest", "bash / clerk", "twilio"] },
            ].map((col) => (
              <div className="skills-column" key={col.title}>
                <h3>{col.title}</h3>
                <ul className="skill-list">
                  {col.items.map((item) => <li key={item}><span>{item}</span></li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="experience-section" id="whats-new">
        <div className="experience-container">
          <h2 className="section-title">what&apos;s new</h2>

          <div className="experience-card">
            <div className="experience-header">
              <div className="experience-title">
                <h3>columbia university ai for good hackathon</h3>
                <span className="company">new york, ny</span>
              </div>
              <span className="experience-date">feb. 2026</span>
            </div>
            <ul className="experience-details">
              <li>hosted by Technology In Business Association in Columbia</li>
              <li>some partner tools I will be using are: VibeFlow (YC S25) &amp; ElevenLabs</li>
            </ul>
            <div className="achievement-gallery">
              <div className="gallery-grid">
                {["columbia1.jpg", "columbia2.jpg", "ColumbiaHack.jpeg"].map((img) => (
                  <div className="gallery-item" key={img}>
                    <img src={`/assets/${img}`} alt="Columbia Hackathon" />
                    <span className="gallery-caption">columbia hackathon</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="experience-card">
            <div className="experience-header">
              <div className="experience-title">
                <h3>y combinator 2x hackathons</h3>
                <span className="company">san francisco, ca</span>
              </div>
              <span className="experience-date">jan. 2026 - feb. 2026</span>
            </div>
            <ul className="experience-details">
              <li>selected as 1 of 250 candidates out of 2000+ applications for 2x back-to-back Y Combinator hackathons in SF, competing as a solo founder</li>
              <li>demoed aSpot at Full Stack hackathon hosted by Sim and Lovable</li>
              <li>demoed LeaseIQ, built under 9 hours at &quot;Hack the Stackathon&quot;</li>
              <li>attended exclusive mixer at Susa Ventures</li>
            </ul>
            <div className="achievement-gallery">
              <div className="gallery-grid">
                {[
                  { img: "yc.jpg", cap: "yc hackathon" },
                  { img: "susa.jpg", cap: "susa ventures mixer" },
                  { img: "nb.jpg", cap: "sf startup scene" },
                  { img: "wall.jpg", cap: "im on the wall yo" },
                  { img: "aspot2.jpg", cap: "aspot demo" },
                  { img: "leaseIQ.png", cap: "leaseiq demo" },
                ].map((item) => (
                  <div className="gallery-item" key={item.img}>
                    <img src={`/assets/${item.img}`} alt={item.cap} />
                    <span className="gallery-caption">{item.cap}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="experience-card">
            <div className="experience-header">
              <div className="experience-title">
                <h3>global entrepreneur scholar</h3>
                <span className="company">harrisburg launchbox powered by penn state</span>
              </div>
              <span className="experience-date">summer 2025</span>
            </div>
            <ul className="experience-details">
              <li>awarded $1500 fellowship for global entrepreneur scholar program</li>
              <li>conducted comprehensive research on london&apos;s fintech industry</li>
              <li>interviewed business owners worldwide</li>
              <li>presented findings on fintech innovation and its impact</li>
            </ul>
            <div className="achievement-gallery">
              <div className="gallery-grid">
                {[
                  { img: "truist1.jpg", cap: "pitch competition" },
                  { img: "truist2.jpg", cap: "research presentation 1" },
                  { img: "truist3.jpg", cap: "research presentation 2" },
                  { img: "truist4.jpeg", cap: "cohort" },
                ].map((item) => (
                  <div className="gallery-item" key={item.img}>
                    <img src={`/assets/${item.img}`} alt={item.cap} />
                    <span className="gallery-caption">{item.cap}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="restock-section" id="contact">
        <div className="restock-content">
          <h2>let&apos;s collaborate</h2>
          <p>open to roles so feel free to connect! :)</p>
          <div className="contact-info-upper-container">
            <div className="contact-info-container">
              <svg className="icon contact-icon email-icon" viewBox="0 0 24 24" fill="#8b7355">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
              </svg>
              <p><a href="mailto:nrndbrma@gmail.com">nrndbrma@gmail.com</a></p>
            </div>
            <div className="contact-info-container">
              <svg className="icon contact-icon" viewBox="0 0 24 24" fill="#0077B5">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              <p><a href="https://www.linkedin.com/in/enrinjr/">LinkedIn</a></p>
            </div>
          </div>
          <button className="contact-button" onClick={() => window.open("mailto:nrndbrma@gmail.com")}>get:in:touch</button>
          <button className="contact-button" onClick={() => window.open("/assets/ResumeEnrinDebbarma.pdf")} style={{ marginLeft: "10px" }}>download:cv</button>
        </div>
      </section>

      <footer>
        <nav>
          <div className="nav-links-container">
            <ul className="nav-links">
              <li><a href="#about">About</a></li>
              <li><a href="#experience">Experience</a></li>
              <li><a href="#education">Education</a></li>
              <li><a href="#projects">Projects</a></li>
              <li><a href="#skills">Skills</a></li>
              <li><a href="#contact">Contact</a></li>
              <li><Link href="/story">Story</Link></li>
              <li><Link href="/art">Art</Link></li>
            </ul>
          </div>
        </nav>
        <p>Copyright © 2025 Enrin Debbarma. All Rights Reserved.</p>
      </footer>
    </>
  );
}
