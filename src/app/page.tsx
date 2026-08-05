"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Flip } from "gsap/Flip";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import FallingLeaves from "./FallingLeaves";
import ExperienceList from "./ExperienceList";
import EducationList from "./EducationList";
import "./landing.css";

gsap.registerPlugin(ScrollTrigger, Flip, SplitText, useGSAP);

const projects = [
  { img: "/assets/career/aspot.png", title: "aSpot", tags: "tavily . next.js . supabase . resend", desc: "AI itinerary platform giving you curated plans in minutes", href: "https://aspot.enrinjr.com" },
  { img: "/assets/career/leaseIQ.png", title: "LeaseIQ", tags: "firecrawl · reducto . open router . render", desc: "Smart apartment hunting & lease analysis platform", href: "https://lease-iq.vercel.app/" },
];

const heroImages = Array.from({ length: 10 }, (_, i) => `/assets/landing/${i + 1}.${i + 1 === 6 ? "png" : "jpg"}`);
const heroPositions = [
  "center 20%", "center 20%", "center 20%", "20% 69%", "65% 55%",
  "50% 70%", "52% 43%", "center 20%", "center 20%", "center 20%",
];


export default function LandingPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [timeStr, setTimeStr] = useState("");
  const [easterEggVisible, setEasterEggVisible] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const markRef = useRef<HTMLAnchorElement>(null);
  const aboutRef = useRef<HTMLElement>(null);
  const careerLeadRef = useRef<HTMLElement>(null);
  const careerTitleRef = useRef<HTMLHeadingElement>(null);
  const careerWrapRef = useRef<HTMLDivElement>(null);
  const navCareerRef = useRef<HTMLAnchorElement>(null);
  const careerBodyRef = useRef<HTMLElement>(null);
  const projectsRef = useRef<HTMLElement>(null);
  const eduRef = useRef<HTMLElement>(null);
  const eduTitleRef = useRef<HTMLHeadingElement>(null);
  const kickerRef = useRef<SVGSVGElement>(null);
  const kickerBodyRef = useRef<SVGGElement>(null);
  const kickLegRef = useRef<SVGGElement>(null);
  const standLegRef = useRef<SVGGElement>(null);
  const armRef = useRef<SVGGElement>(null);

  const handleEasterEgg = useCallback(() => {
    if (!easterEggVisible) {
      setEasterEggVisible(true);
      setTimeout(() => setEasterEggVisible(false), 3000);
    }
  }, [easterEggVisible]);

  /* Hold the page still until "enrin" has finished writing itself in — the last
     letter starts at 1.1s and runs 1.2s (see .t-letter in landing.css). */
  useEffect(() => {
    if (typeof history !== "undefined" && "scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);
    // both elements — html is the scrolling element, so body alone does nothing
    document.documentElement.classList.add("scroll-locked");
    document.body.classList.add("scroll-locked");
    // overflow:hidden hides the scrollbar but still allows programmatic scrolling,
    // so the actual input events have to be swallowed as well
    const swallow = (e: Event) => e.preventDefault();
    const keys = new Set(["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "]);
    const swallowKey = (e: KeyboardEvent) => { if (keys.has(e.key)) e.preventDefault(); };
    const opts = { passive: false } as AddEventListenerOptions;
    window.addEventListener("wheel", swallow, opts);
    window.addEventListener("touchmove", swallow, opts);
    window.addEventListener("keydown", swallowKey, opts);

    const unlock = () => {
      document.documentElement.classList.remove("scroll-locked");
      document.body.classList.remove("scroll-locked");
      window.removeEventListener("wheel", swallow, opts);
      window.removeEventListener("touchmove", swallow, opts);
      window.removeEventListener("keydown", swallowKey, opts);
    };
    const t = setTimeout(() => {
      unlock();
      ScrollTrigger.refresh();
    }, 2300);
    return () => {
      clearTimeout(t);
      unlock();
    };
  }, []);

  // Background slideshow — one continuous backdrop for the whole page
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Timestamp
  useEffect(() => {
    function update() {
      const now = new Date();
      const h = now.getHours();
      const m = String(now.getMinutes()).padStart(2, "0");
      const period = h >= 12 ? "pm" : "am";
      setTimeStr(`${h % 12 || 12}:${m} ${period}`);
    }
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, []);

  useGSAP(
    () => {
      const title = titleRef.current;
      const mark = markRef.current;
      const careerTitle = careerTitleRef.current;
      const navCareer = navCareerRef.current;
      if (!title || !mark || !careerTitle || !navCareer) return;

      /* 1. Center "enrin" shrinks onto the top-left mark and dissolves into it.
         Flip.fit measures both elements, so the landing is pixel-exact at any size. */
      const heroTl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1, // scroll leads, the title eases after
          invalidateOnRefresh: true,
        },
      });

      heroTl
        .to(title, {
          duration: 1,
          ease: "power1.inOut",
          ...(Flip.fit(title, mark, { scale: true, getVars: true }) as gsap.TweenVars),
        }, 0)
        .to(subtitleRef.current, { opacity: 0, y: -14, duration: 0.28, ease: "power2.in" }, 0)
        // no crossfade: the travelling title IS the mark right up to the last
        // frame, then they swap in place, where the two are pixel-identical
        .set(title, { opacity: 0 }, 0.995)
        .set(mark, { opacity: 1 }, 0.995);

      /* The backdrop stays vivid in the hero, then settles back so the copy reads
         without needing a card behind it. */
      gsap.to(".bg-dim", {
        opacity: 0.55,
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1,
        },
      });

      /* 2. The about beat overlaps the hero: the stage is fixed to the viewport,
         so it can start emerging from the backdrop while "enrin" is still
         travelling to the corner, rather than waiting for its section to reach
         the top. Both phases are scrubbed, so scroll drives the whole thing.
         The hidden state is applied with gsap.set rather than a from() tween:
         a from() gets its start state re-applied by a pin refresh and sticks. */
      const headSplit = SplitText.create(".about-big", { type: "chars", charsClass: "dance-char" });
      const bodySplit = SplitText.create(".about-text-col .about-p:not(.about-big)", {
        type: "chars",
        charsClass: "dance-char",
        aggregate: true, // one continuous run across the paragraphs
      });

      gsap.set(".about-left", { z: -1100, opacity: 0, filter: "blur(16px)" });
      gsap.set(".about-text-col", { z: -1100, opacity: 0, filter: "blur(16px)" });
      gsap.set(headSplit.chars, { opacity: 0, y: 22, rotate: 10 });
      gsap.set(bodySplit.chars, { opacity: 0, y: 12, rotate: 6 });

      const settle = { opacity: 1, y: 0, rotate: 0 };

      gsap
        .timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: aboutRef.current,
            // ~18% into the hero — right as "tech / film / art" finishes fading
            start: "top 82%",
            end: "top top", // fully arrived once the hero has scrolled away
            scrub: 1,
            invalidateOnRefresh: true,
          },
        })
        .to(".about-left", {
          z: 0,
          opacity: 1,
          filter: "blur(0px)",
          duration: 0.8,
          ease: "power2.out",
        }, 0)
        .to(".about-text-col", {
          z: 0,
          opacity: 1,
          filter: "blur(0px)",
          duration: 0.8,
          ease: "power2.out",
        }, 0.12) // copy trails the photo slightly
        .to(headSplit.chars, {
          ...settle,
          duration: 0.12,
          ease: "back.out(2)",
          stagger: 0.045,
        }, 0.3)
        .to(bodySplit.chars, {
          ...settle,
          duration: 0.1,
          ease: "power2.out",
          stagger: 0.0035,
        }, 0.45)
        // only catches hover once it is actually on screen
        .set(".about-inner", { pointerEvents: "auto" }, 0.5);

      // ...and recedes past the camera as the career beat comes up
      gsap.to(".about-inner", {
        scale: 1.18,
        opacity: 0,
        filter: "blur(10px)",
        ease: "power2.in",
        scrollTrigger: {
          trigger: careerLeadRef.current,
          start: "top bottom",
          end: "top top",
          scrub: 1,
        },
      });

      /* The career stage is fixed to the viewport too, so the title can start
         leaving the nav while the about beat is still receding. Being fixed,
         its live rect is already its on-screen rect — no pin offset to correct. */
      function careerFitVars(): gsap.TweenVars {
        gsap.set(careerTitle!, { clearProps: "transform" });
        const t = careerTitle!.getBoundingClientRect();
        const n = navCareer!.getBoundingClientRect();
        const scale = n.width / t.width;
        return {
          x: n.left - t.left,
          y: n.top - t.top,
          scaleX: scale,
          scaleY: scale,
          transformOrigin: "0px 0px",
        };
      }

      /* 3. The reverse move: "career" leaves the nav, travels down to the middle
            and grows. */
      const careerTl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: careerLeadRef.current,
          // the moment the section enters the viewport, while about is still leaving
          start: "top bottom",
          end: "top top",
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });

      careerTl
        .fromTo(
          careerTitle,
          careerFitVars(),
          { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: 1, ease: "power2.inOut" },
          0
        )
        .fromTo(careerTitle, { opacity: 0 }, { opacity: 1, duration: 0.14, ease: "power2.out" }, 0)
        .fromTo(navCareer, { opacity: 1 }, { opacity: 0, duration: 0.12, ease: "power2.in" }, 0)
        .to(navCareer, { opacity: 1, duration: 0.15, ease: "power2.out" }, 0.85);

      /* The career backdrop and its leaves wash in over the slideshow as the
         career beat arrives, and stay for the work below it. */
      gsap.set([".bg-career", ".leaf-layer"], { opacity: 0 });
      gsap.to([".bg-career", ".leaf-layer"], {
        opacity: 1,
        ease: "none",
        scrollTrigger: {
          trigger: careerLeadRef.current,
          start: "top bottom",
          end: "top 25%",
          scrub: 1,
        },
      });

      /* Once it has landed, career docks to the left edge and shrinks, clearing
         the right half of the viewport for the experience content. Measured at
         refresh so the dock lands on the same gutter at any width. */
      function dockVars(): gsap.TweenVars {
        const wrap = careerWrapRef.current!;
        gsap.set(wrap, { clearProps: "transform" });
        const r = wrap.getBoundingClientRect();
        const gutter = Math.max(40, window.innerWidth * 0.055);
        return {
          x: gutter - r.left,
          scale: 0.46,
          transformOrigin: "left center", // left edge pins to the gutter as it shrinks
        };
      }

      const dockTl = gsap.timeline({
        scrollTrigger: {
          trigger: careerBodyRef.current,
          start: "top 92%",
          end: "top 32%",
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });
      dockTl.to(careerWrapRef.current, { ...dockVars(), ease: "power2.inOut", duration: 1 }, 0);

      /* 4. The rest of career fades up underneath */
      gsap.set(".career-rise", { y: 60, opacity: 0, filter: "blur(6px)" });
      gsap.to(".career-rise", {
        scrollTrigger: { trigger: careerBodyRef.current, start: "top 70%" },
        y: 0,
        opacity: 1,
        filter: "blur(0px)",
        duration: 1.1,
        stagger: 0.12,
        ease: "expo.out",
      });

      /* 5. Keep scrolling and experience slides off to the left while the
         projects arrive from the right — the two cross over in one viewport. */
      gsap.set(".project-rise", { x: () => window.innerWidth * 0.22, opacity: 0, filter: "blur(10px)" });

      gsap
        .timeline({
          scrollTrigger: {
            trigger: projectsRef.current,
            start: "top bottom",
            end: "top top",
            scrub: 1,
            invalidateOnRefresh: true,
          },
        })
        // experience slides from the right column into the middle and stays put —
        // there is room for both once it moves over
        .to(".career-body .panel-inner", {
          x: () => -window.innerWidth * 0.16,
          ease: "power2.inOut",
          duration: 1,
        }, 0)
        .to(".project-rise", {
          x: 0,
          opacity: 1,
          filter: "blur(0px)",
          ease: "power3.out",
          duration: 1,
          stagger: 0.12,
        }, 0.1);

      /* 6. A little figure walks in from the right, winds up, and boots the
         docked "career" off the page. Everything is keyed off CONTACT — the
         frame its foot actually reaches the word — so the hit reads as causal
         rather than as two animations that happen to overlap. */
      const CONTACT = 0.6;

      gsap.set(kickerRef.current, { x: () => window.innerWidth * 0.8, opacity: 0 });
      gsap.set([kickLegRef.current, standLegRef.current, armRef.current], { rotation: 0 });
      gsap.set(eduTitleRef.current, { z: -1400, opacity: 0, filter: "blur(16px)", transformOrigin: "left center" });
      gsap.set(".edu-rise", { x: () => window.innerWidth * 0.25, opacity: 0, filter: "blur(8px)" });

      gsap
        .timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: eduRef.current,
            start: "top bottom",
            end: "top top",
            scrub: 1,
            invalidateOnRefresh: true,
          },
        })
        // --- walks in ---
        .to(kickerRef.current, { opacity: 1, duration: 0.05 }, 0)
        .to(kickerRef.current, { x: 0, duration: 0.45, ease: "power1.out" }, 0)
        // a four-step walk cycle on the way in
        .to(kickLegRef.current, { keyframes: { rotation: [0, 26, -26, 26, -26, 0] }, duration: 0.45 }, 0)
        .to(standLegRef.current, { keyframes: { rotation: [0, -26, 26, -26, 26, 0] }, duration: 0.45 }, 0)
        .to(armRef.current, { keyframes: { rotation: [0, -22, 22, -22, 22, 0] }, duration: 0.45 }, 0)
        // body bob, so the walk has weight
        .to(kickerBodyRef.current, { keyframes: { y: [0, -5, 0, -5, 0, -5, 0] }, duration: 0.45 }, 0)
        // --- winds up ---
        .to(kickLegRef.current, { rotation: -38, duration: 0.12, ease: "power2.out" }, 0.45)
        .to(armRef.current, { rotation: 30, duration: 0.12, ease: "power2.out" }, 0.45)
        .to(kickerBodyRef.current, { rotation: 6, duration: 0.12, ease: "power2.out" }, 0.45)
        // --- swings through ---
        .to(kickLegRef.current, { rotation: 96, duration: 0.09, ease: "power3.in" }, CONTACT - 0.09)
        .to(armRef.current, { rotation: -34, duration: 0.09, ease: "power3.in" }, CONTACT - 0.09)
        .to(kickerBodyRef.current, { rotation: -8, duration: 0.09, ease: "power3.in" }, CONTACT - 0.09)
        // --- contact: career is launched ---
        .to(careerWrapRef.current, {
          x: () => -window.innerWidth * 0.85,
          y: -140,
          rotation: -38,
          opacity: 0,
          duration: 0.28,
          ease: "power3.in",
        }, CONTACT)
        .to([".career-body .panel-inner", ".projects-inner"], {
          x: () => -window.innerWidth * 0.6,
          opacity: 0,
          filter: "blur(8px)",
          duration: 0.32,
          ease: "power3.in",
        }, CONTACT)
        // --- recovers, then strolls off the way it came ---
        .to([kickLegRef.current, armRef.current, kickerBodyRef.current], {
          rotation: 0, duration: 0.14, ease: "power2.out",
        }, CONTACT + 0.1)
        .to(kickerRef.current, { x: () => window.innerWidth * 0.8, duration: 0.26, ease: "power1.in" }, CONTACT + 0.14)
        .to(kickLegRef.current, { keyframes: { rotation: [0, 22, -22, 0] }, duration: 0.26 }, CONTACT + 0.14)
        .to(standLegRef.current, { keyframes: { rotation: [0, -22, 22, 0] }, duration: 0.26 }, CONTACT + 0.14)
        // --- education takes the vacated spot ---
        .to(eduTitleRef.current, {
          z: 0, opacity: 1, filter: "blur(0px)", duration: 0.25, ease: "power2.out",
        }, CONTACT + 0.08)
        .to(".edu-rise", {
          x: 0, opacity: 1, filter: "blur(0px)", duration: 0.5, ease: "power3.out", stagger: 0.05,
        }, CONTACT + 0.16);

      /* Hover a letter and it kicks — its neighbours follow at half amplitude,
         so the word ripples rather than a single glyph twitching. The dance runs
         on yPercent/scale/skew, which the entrances never touch (those use
         y/rotate/opacity), so letters can dance mid-transition without the two
         overwriting each other. */
      const danceGroups: HTMLElement[][] = [
        [...headSplit.chars, ...bodySplit.chars] as HTMLElement[],
      ];

      const charGroup = new Map<HTMLElement, { group: HTMLElement[]; i: number }>();
      danceGroups.forEach((g) => g.forEach((c, i) => charGroup.set(c, { group: g, i })));

      function kick(el: HTMLElement, amp: number) {
        gsap.to(el, {
          yPercent: -70 * amp,
          scale: 1 + 0.28 * amp,
          skewX: gsap.utils.random(-16, 16) * amp,
          duration: 0.28,
          ease: "back.out(4)",
          overwrite: "auto",
          onComplete: () => {
            gsap.to(el, {
              yPercent: 0,
              scale: 1,
              skewX: 0,
              duration: 0.9,
              ease: "elastic.out(1, 0.35)",
            });
          },
        });
      }

      function onOver(e: Event) {
        const el = (e.target as HTMLElement)?.closest?.(".dance-char") as HTMLElement | null;
        if (!el) return;
        const hit = charGroup.get(el);
        if (!hit) return;
        kick(el, 1);
        if (hit.group[hit.i - 1]) kick(hit.group[hit.i - 1], 0.45);
        if (hit.group[hit.i + 1]) kick(hit.group[hit.i + 1], 0.45);
      }

      const rootEl = rootRef.current;
      rootEl?.addEventListener("mouseover", onOver);

      // Keep both Flip fits exact across resizes and late font loads
      function refit() {
        if (!title || !mark || !careerTitle || !navCareer) return;
        const heroFit = Flip.fit(title, mark, { scale: true, getVars: true }) as gsap.TweenVars;
        const heroTween = heroTl.getChildren(false)[0] as gsap.core.Tween | undefined;
        if (heroTween) {
          Object.assign(heroTween.vars, {
            x: heroFit.x, y: heroFit.y,
            scaleX: heroFit.scaleX, scaleY: heroFit.scaleY,
            transformOrigin: heroFit.transformOrigin,
          });
          heroTween.invalidate();
        }

        const careerTween = careerTl.getChildren(false)[0] as gsap.core.Tween | undefined;
        if (careerTween?.vars.startAt) {
          // a fromTo — the fit lives in the `startAt` vars
          Object.assign(careerTween.vars.startAt, careerFitVars());
          careerTween.invalidate();
        }

        const dockTween = dockTl.getChildren(false)[0] as gsap.core.Tween | undefined;
        if (dockTween) {
          Object.assign(dockTween.vars, dockVars());
          dockTween.invalidate();
        }
      }
      ScrollTrigger.addEventListener("refreshInit", refit);

      document.fonts?.ready.then(() => ScrollTrigger.refresh()).catch(() => {});

      return () => {
        ScrollTrigger.removeEventListener("refreshInit", refit);
        rootEl?.removeEventListener("mouseover", onOver);
      };
    },
    { scope: rootRef }
  );

  const titleLetters = "enrin".split("");
  const subtitleText = "tech / film / art";

  return (
    <div ref={rootRef}>
      <div className="grain" />

      {/* ONE PERSISTENT BACKDROP FOR THE WHOLE PAGE */}
      <div className="bg">
        {heroImages.map((src, i) => (
          <img
            key={src}
            src={src}
            alt=""
            className={`bg-slide ${i === currentSlide ? "active" : ""}`}
            style={{ objectPosition: heroPositions[i] }}
          />
        ))}
        <div className="bg-dim" />
        <div className="bg-wash" />
      </div>

      {/* the career backdrop + leaves fade over the slideshow for the career beat */}
      <div className="bg-career">
        <img src="/assets/landing/9.jpg" alt="" className="bg-career-shot" />
      </div>
      <div className="leaf-layer">
        <FallingLeaves />
      </div>

      <nav className="nav">
        {/* the mark the hero title lands on */}
        <Link href="/" ref={markRef} className="brand-mark">enrin</Link>
        <div className="nav-links">
          <Link href="/career" ref={navCareerRef}>career</Link>
          <Link href="/story">story</Link>
          <Link href="/art">art</Link>
        </div>
      </nav>

      {/* pinned to the viewport for the whole page */}
      <div className="hero-bottom">
        <span className="hero-loc">brooklyn, ny</span>
        <span className="hero-now">{timeStr}</span>
      </div>

      {/* HERO */}
      <section ref={heroRef} className="hero">
        <div className="hero-content">
          <h1 ref={titleRef} className="title">
            {titleLetters.map((letter, i) => (
              <span key={i} className="t-letter" style={{ animationDelay: `${0.3 + i * 0.2}s` }}>
                {letter}
              </span>
            ))}
          </h1>
          <p ref={subtitleRef} className="subtitle">
            {subtitleText.split("").map((char, i) => (
              <span key={i} className="s-letter" style={{ animationDelay: `${2.0 + i * 0.03}s` }}>
                {char}
              </span>
            ))}
          </p>
        </div>
      </section>

      {/* ABOUT */}
      <section ref={aboutRef} className="about">
        <div className="about-stage">
          <div className="panel-inner about-inner">
          <div className="about-left" onClick={handleEasterEgg}>
            <div className="about-photo-col">
              <img src="/assets/aboutme1.jpg" alt="Enrin" className="about-photo" />
            </div>
            <p className={`easter-egg ${easterEggVisible ? "show" : ""}`}>
              i know every brent & daniel caeser song word for word
            </p>
          </div>
          <div className="about-text-col">
            <p className="about-p about-big">intro</p>
            <p className="about-p">
              based in nyc, im a forward deployed engineer and have been an early member at 2 startups doing $2.5M+ ARR
            </p>
            <p className="about-p">
              things i enjoy building are agentic systems, consumer apps &amp; visuals that speak life
            </p>
            <p className="about-p about-dim">
              i love film, fashion, sports, music. a fein for views and sunsets, so youll most likely see me pondering often
            </p>
            </div>
          </div>
        </div>
      </section>

      {/* CAREER — title travels from the nav down to the middle */}
      <section ref={careerLeadRef} className="career-lead">
        <div className="career-lead-inner">
          <div ref={careerWrapRef} className="career-title-wrap">
            <h2 ref={careerTitleRef} className="career-title">career</h2>
          </div>
        </div>
      </section>

      <section ref={careerBodyRef} className="career-body">
        <div className="panel-inner">
          <ExperienceList rowClassName="career-rise" />

        </div>
      </section>

      {/* PROJECTS — experience slides out left as these come in from the right */}
      <section ref={projectsRef} className="projects">
        <div className="projects-inner">
          {projects.map((p) => (
            <a key={p.title} href={p.href} target="_blank" rel="noopener noreferrer" className="work-card project-rise">
              <div className="work-card-frame">
                <img src={p.img} alt={p.title} className="work-card-shot" />
              </div>
              <div className="work-card-info">
                <span className="work-card-title">{p.title}</span>
                <span className="work-card-tags">{p.tags}</span>
              </div>
              <p className="work-card-desc">{p.desc}</p>
            </a>
          ))}
        </div>
      </section>

      {/* EDUCATION — flies in from depth, knocks career off, rows follow */}
      <section ref={eduRef} className="education">
        <div className="education-stage">
          <h2 ref={eduTitleRef} className="education-title">education</h2>
        </div>

        {/* the little guy who walks in and boots "career" off the page */}
        <div className="kicker-stage" aria-hidden="true">
          <svg ref={kickerRef} className="kicker" viewBox="0 0 140 230" width="132" height="217">
            <g ref={kickerBodyRef} fill="var(--color-text)" stroke="var(--color-text)" strokeLinecap="round" strokeLinejoin="round">
              {/* head, with a swept anime fringe */}
              <circle cx="70" cy="36" r="21" stroke="none" />
              <path d="M49 30 C50 12, 62 4, 74 6 C88 8, 94 18, 92 32 C88 22, 80 18, 70 20 C62 22, 55 26, 49 38 Z" stroke="none" />
              <path d="M92 30 C100 20, 104 12, 100 6 C98 16, 94 22, 88 26 Z" stroke="none" />
              {/* torso */}
              <path d="M70 56 L67 124" strokeWidth="17" />
              {/* far arm, then near arm */}
              <g ref={armRef} style={{ transformOrigin: "70px 70px" }}>
                <path d="M70 70 L44 92" strokeWidth="11" />
                <path d="M44 92 L38 104" strokeWidth="9" />
              </g>
              {/* planted leg */}
              <g ref={standLegRef} style={{ transformOrigin: "67px 124px" }}>
                <path d="M67 124 L71 196" strokeWidth="14" />
                <path d="M71 196 L53 202" strokeWidth="10" />
              </g>
              {/* kicking leg */}
              <g ref={kickLegRef} style={{ transformOrigin: "67px 124px" }}>
                <path d="M67 124 L63 196" strokeWidth="14" />
                <path d="M63 196 L45 202" strokeWidth="10" />
              </g>
            </g>
          </svg>
        </div>
        <div className="education-inner">
          <EducationList rowClassName="edu-rise" bare />
        </div>
      </section>
    </div>
  );
}
