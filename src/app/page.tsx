"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
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

/* A card with `video` set shows the clip on desktop and the still everywhere
   else — see .work-card-video in landing.css. `img` is the poster either way,
   so it is never optional. */
const projects: { img: string; video?: string; title: string; tags: string; desc: string; href: string }[] = [
  { img: "/assets/career/aspot.png", title: "aSpot", tags: "tavily . next.js . supabase . resend", desc: "AI itinerary platform giving you curated plans in minutes", href: "https://aspot.enrinjr.com" },
  { img: "/assets/career/cursor2discord.png", video: "/assets/ProjDemos/cursor2discord-demo.mp4", title: "Cursor2Discord", tags: "cursor ext . claude code hooks . rich presence", desc: "1.2k+ downloads. Discord Rich Presence for Cursor that knows what your agents are doing", href: "https://github.com/emd5953/cursor2discord" },
  { img: "/assets/career/leaseIQ.png", title: "LeaseIQ", tags: "firecrawl · reducto . open router . render", desc: "Smart apartment hunting & lease analysis platform", href: "https://lease-iq.vercel.app/" },
  { img: "/assets/career/lotivity.png", title: "Lotivity", tags: "swift . swiftui . ranked feed", desc: "Native iOS app for local activity discovery — real experiences over artificial exchanges", href: "https://github.com/emd5953/lotivity" },
  { img: "/assets/career/nextstep.png", title: "NextStep", tags: "semantic search . embeddings . react native", desc: "AI job-matching platform with a swipe-based interface and intelligent recommendations", href: "https://github.com/emd5953/NextStep4" },
  { img: "/assets/career/travel-backoffice.png", title: "Travel Agency OS", tags: "agents . rag . quote normalization", desc: "AI back office for travel agencies — agents draft client replies and normalize supplier quotes, traceable to source", href: "https://github.com/emd5953/AI_BackOffice_LuxuryTravelAgencies" },
  { img: "/assets/career/wavelength.png", title: "Wavelength", tags: "spotify api . postgis . supabase", desc: "Proximity-based music discovery — see what people around you are playing, anonymously", href: "https://github.com/emd5953/wavelength" },
];

/* The width at which the three-column stage is worth running. Below it the
   sections stack — landing.css switches layout at the same number, so the CSS
   and the timelines are never in disagreement about which mode is live. */
const STAGE_MIN = 1100;

const heroImages = Array.from({ length: 10 }, (_, i) => `/assets/landing/${i + 1}.${i + 1 === 6 ? "png" : "jpg"}`);
const heroPositions = [
  "center 20%", "center 20%", "center 20%", "20% 69%", "65% 55%",
  "50% 70%", "52% 43%", "center 20%", "center 20%", "center 20%",
];


/* Survives a hot reload (same document), not a real one — see the intro hold. */
declare global {
  interface Window { __introHeld?: boolean }
}

const introHeld = () => Boolean(window.__introHeld);
const markIntroHeld = () => { window.__introHeld = true; };

/* On a pointer device the clip runs while its card is hovered. Touch devices
   have no hover, so there they run while the card is on screen instead — see
   the observer in the component. */
function playDemo(e: React.MouseEvent<HTMLAnchorElement>) {
  const v = e.currentTarget.querySelector("video");
  if (v && getComputedStyle(v).display !== "none") void v.play().catch(() => {});
}

function pauseDemo(e: React.MouseEvent<HTMLAnchorElement>) {
  const v = e.currentTarget.querySelector("video");
  if (!v) return;
  v.pause();
  v.currentTime = 0; // back to the frame the card rests on
}

export default function LandingPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [assetsReady, setAssetsReady] = useState(false);
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
  const kickerRef = useRef<SVGSVGElement>(null);
  const kickerBodyRef = useRef<SVGGElement>(null);
  const kickLegRef = useRef<SVGGElement>(null);
  const standLegRef = useRef<SVGGElement>(null);
  const armRef = useRef<SVGGElement>(null);
  const headRef = useRef<SVGGElement>(null);

  const handleEasterEgg = useCallback(() => {
    if (!easterEggVisible) {
      setEasterEggVisible(true);
      setTimeout(() => setEasterEggVisible(false), 3000);
    }
  }, [easterEggVisible]);

  /* The intro is CSS-timed and plays over the backdrop, so letting it start
     before the backdrop has decoded means "enrin" writes itself against a blank
     page. The gate is released by the first slide's own onLoad — hand-rolling a
     preload here would fetch the raw file, which next/image never serves — and
     the timeout means a slow connection delays the page rather than stalling it.
     Nothing else is waited on: the other slides are 5s apart and the career shot
     fades in later, so both stream in behind the intro. */
  useEffect(() => {
    const timer = setTimeout(() => setAssetsReady(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  /* Hold the page still until "enrin" has finished writing itself in — the last
     letter starts at 1.1s and runs 1.2s (see .t-letter in landing.css). */
  useEffect(() => {
    if (typeof history !== "undefined" && "scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
    /* the hold measures out the intro, and the intro does not start until the
       backdrop is up — so neither does the timer that ends it */
    if (!assetsReady) return;
    // nothing is writing itself in under reduced motion, so there is nothing
    // to hold the page still for — locking scroll would just be a dead 2.3s
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    /* Only a real page load gets held. A hot reload re-runs this effect in the
       same document long after the intro finished, and re-arming the lock there
       freezes the page mid-read — once per save. The flag lives on `window`
       rather than in module scope because Fast Refresh re-executes the module
       but never replaces the document, and it is only set once the intro has
       actually run to the end, so React's double-invoke in StrictMode still
       gets a real hold. */
    if (introHeld()) return;
    /* ScrollTrigger keeps its own scroll memory and puts it back on refresh —
       which would drop you back where you were straight after the intro. The
       intro only makes sense from the top, so that memory is cleared here. */
    ScrollTrigger.clearScrollMemory("manual");
    window.scrollTo(0, 0);
    /* A reload that lands mid-page has no intro on screen to wait for, so
       holding the scroll there is just a frozen page. */
    if (window.scrollY > 4) return;
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
      markIntroHeld();
      ScrollTrigger.refresh();
    }, 2300);
    return () => {
      clearTimeout(t);
      unlock();
    };
  }, [assetsReady]);

  /* Touch devices never get the hover that starts a demo clip, so there each
     clip plays while its card is on screen and pauses the moment it leaves —
     nothing downloads until the card is close, and nothing keeps decoding
     off-screen. Pointer devices keep the hover behaviour and skip all of this. */
  useEffect(() => {
    if (window.matchMedia("(hover: hover)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const clips = Array.from(document.querySelectorAll<HTMLVideoElement>(".work-card-video"));
    if (!clips.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const v = entry.target as HTMLVideoElement;
          if (entry.isIntersecting) {
            v.preload = "auto";
            void v.play().catch(() => {});
          } else {
            v.pause();
          }
        }
      },
      // most of the card has to be in view, so a clip does not start while it
      // is still a sliver at the edge of the screen
      { threshold: 0.6 }
    );

    clips.forEach((v) => io.observe(v));
    return () => io.disconnect();
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

      /* The three-column geometry lives in landing.css as custom properties.
         A hidden probe lets the browser resolve them to pixels for us, so the
         timelines below never carry their own copy of a viewport fraction —
         move a slot in CSS and the animation follows. */
      const probe = document.createElement("div");
      probe.style.cssText =
        "position:absolute;top:0;left:0;height:0;visibility:hidden;pointer-events:none";
      document.body.appendChild(probe);
      const slot = (name: string) => {
        probe.style.width = `var(${name})`;
        return probe.getBoundingClientRect().width;
      };

      /* SplitText and the hover dance are viewport-independent, and they are
         the only motion that outlives `prefers-reduced-motion`: nothing here
         moves on its own, it only answers a pointer. Built once, outside the
         matchMedia branches, so a resize across the breakpoint does not
         re-split the copy underneath the reader. */
      const headSplit = SplitText.create(".about-big", { type: "words,chars", charsClass: "dance-char" });
      const bodySplit = SplitText.create(".about-text-col .about-p:not(.about-big)", {
        type: "words,chars",
        charsClass: "dance-char",
        aggregate: true, // one continuous run across the paragraphs
      });

      const settle = { opacity: 1, y: 0, rotate: 0 };

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

      /* Two modes, not three. The scrubbed three-column choreography is a
         desktop stage; below STAGE_MIN the sections stack in normal flow (see
         landing.css, same breakpoint) and get plain entrance fades. Under
         reduced motion neither branch is built, so every element simply
         renders in its final state — the hidden states are all applied by
         these timelines, never by CSS. */
      const mm = gsap.matchMedia();

      mm.add(
        {
          isDesktop: `(min-width: ${STAGE_MIN}px) and (prefers-reduced-motion: no-preference)`,
          isStacked: `(max-width: ${STAGE_MIN - 1}px) and (prefers-reduced-motion: no-preference)`,
        },
        (ctx) => {
          const { isDesktop, isStacked } = ctx.conditions as Record<string, boolean>;

          /* ---- shared by both modes ---------------------------------- */

          /* 1. Center "enrin" shrinks onto the top-left mark and dissolves into it.
             Flip.fit measures both elements, so the landing is pixel-exact at any
             size — which is why this one runs in both modes unchanged. */
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
            /* the location/time strip is pinned to the viewport, so once the
               hero is gone it would otherwise float over every section below —
               on a short phone screen it sits right on top of the rows */
            .to(".hero-bottom", { opacity: 0, duration: 0.3, ease: "power2.in" }, 0.6)
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

          /* ---- stacked: no stage, so nothing travels ------------------ */
          if (isStacked) {
            const rise = (targets: gsap.TweenTarget, trigger: Element | null, stagger = 0) => {
              gsap.set(targets, { opacity: 0, y: 34 });
              gsap.to(targets, {
                opacity: 1,
                y: 0,
                duration: 0.8,
                stagger,
                ease: "power3.out",
                scrollTrigger: { trigger: trigger ?? undefined, start: "top 85%" },
              });
            };

            rise(".about-left", aboutRef.current);
            rise(".about-text-col", aboutRef.current);
            rise(careerTitle, careerLeadRef.current);
            rise(".career-rise", careerBodyRef.current, 0.08);
            rise(".project-rise", projectsRef.current, 0.1);
            rise(".edu-rise", eduRef.current, 0.06);
            rise(".resume-rise", eduRef.current);

            // the career backdrop still washes in — it is an opacity fade, not
            // a stage move, so it costs nothing to keep on a phone
            gsap.to([".bg-career", ".leaf-layer"], {
              opacity: 1,
              duration: 1.2,
              ease: "none",
              scrollTrigger: { trigger: careerLeadRef.current, start: "top 80%" },
            });

            // the split chars are only hidden by the desktop beat, so leave them be
            gsap.set([...headSplit.chars, ...bodySplit.chars], settle);
            gsap.set(".about-inner", { pointerEvents: "auto" });
            return;
          }

          if (!isDesktop) return;

          /* ---- desktop: the full three-column stage ------------------- */

          /* 2. The about beat overlaps the hero: the stage is fixed to the viewport,
             so it can start emerging from the backdrop while "enrin" is still
             travelling to the corner, rather than waiting for its section to reach
             the top. Both phases are scrubbed, so scroll drives the whole thing.
             The hidden state is applied with gsap.set rather than a from() tween:
             a from() gets its start state re-applied by a pin refresh and sticks. */
          gsap.set(".about-left", { z: -1100, opacity: 0, filter: "blur(16px)" });
          gsap.set(".about-text-col", { z: -1100, opacity: 0, filter: "blur(16px)" });
          gsap.set(headSplit.chars, { opacity: 0, y: 22, rotate: 10 });
          gsap.set(bodySplit.chars, { opacity: 0, y: 12, rotate: 6 });

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
            // the nav copy stays gone for the rest of the beat — bringing it back
            // would put a second "career" on screen alongside the big one
            .fromTo(navCareer, { opacity: 1 }, { opacity: 0, duration: 0.12, ease: "power2.in" }, 0);

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
            return {
              x: slot("--stage-gutter") - r.left,
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
             projects arrive from the right — the two cross over in one viewport.

             Both moves are stated as "travel from where CSS put you to the slot
             you belong in", so the numbers live in landing.css and this code
             only does the subtraction. */
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
            .to(".career-body", {
              x: () => slot("--slot-mid") - slot("--stage-pad-1"),
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

          /* 6. A small figure walks in from OFF-SCREEN LEFT, crosses the word,
             stops just right of the final "r", turns to face it, and boots it off
             to the left. Everything downstream is keyed off CONTACT so the hit
             reads as the cause. */
          const CONTACT = 1.6;
          const ARRIVE = 1.24;

          // facing right (scaleX -1) for the walk across, since the figure is drawn
          // facing left. The head sits inside this group, so the face always looks
          // the way the figure is walking.
          gsap.set(kickerRef.current, { x: () => -window.innerWidth * 0.3, opacity: 0 });
          gsap.set(kickerBodyRef.current, { scaleX: -1 });
          gsap.set([kickLegRef.current, standLegRef.current, armRef.current], { rotation: 0 });
          gsap.set(".edu-rise", { x: () => window.innerWidth * 0.25, opacity: 0, filter: "blur(8px)" });

          const walk = (n: number) => Array.from({ length: n * 2 + 1 }, (_, i) => (i === n * 2 ? 0 : (i % 2 ? 22 : -22)));
          const bob = (n: number) => Array.from({ length: n * 2 + 1 }, (_, i) => (i % 2 ? -3 : 0));
          const nod = (n: number) => Array.from({ length: n * 2 + 1 }, (_, i) => (i === 0 || i === n * 2 ? 0 : (i % 2 ? 7 : -7)));

          gsap
            .timeline({
              defaults: { ease: "none" },
              scrollTrigger: {
                trigger: eduRef.current,
                start: "top bottom",
                /* The range is sized so a timeline unit still costs the same
                   scroll as it did over the original 100dvh — the kicker's own
                   tweens are what got twice as long, so only the walk-in, the
                   kick and the walk-off slowed down. The launch, the column
                   shuffle and the education rows still play at their old speed.
                   Ends before .resume-rise begins. */
                end: "top -75%",
                scrub: 1,
                invalidateOnRefresh: true,
              },
            })
            // --- the long slow walk in from the left ---
            .to(kickerRef.current, { opacity: 1, duration: 0.08 }, 0)
            .to(kickerRef.current, { x: 0, duration: ARRIVE, ease: "none" }, 0)
            .to(kickLegRef.current, { keyframes: { rotation: walk(10) }, duration: ARRIVE }, 0)
            .to(standLegRef.current, { keyframes: { rotation: walk(10).map((v) => -v) }, duration: ARRIVE }, 0)
            .to(armRef.current, { keyframes: { rotation: walk(10).map((v) => v * 0.8) }, duration: ARRIVE }, 0)
            .to(kickerBodyRef.current, { keyframes: { y: bob(10) }, duration: ARRIVE }, 0)
            .to(headRef.current, { keyframes: { rotation: nod(10) }, duration: ARRIVE }, 0)
            // --- turns around to face the word ---
            .to(kickerBodyRef.current, { scaleX: 1, duration: 0.12, ease: "power2.inOut" }, ARRIVE)
            /* --- winds up ---
               He has turned to face the word, which is to his left, so the leg
               swings anticlockwise into it: back (positive) to wind up, through
               (negative) on contact. The arm counters the leg, the body leans
               away then into the kick. */
            .to(kickLegRef.current, { rotation: 42, duration: 0.2, ease: "power2.out" }, ARRIVE + 0.12)
            .to(armRef.current, { rotation: -34, duration: 0.2, ease: "power2.out" }, ARRIVE + 0.12)
            .to(kickerBodyRef.current, { rotation: 7, duration: 0.2, ease: "power2.out" }, ARRIVE + 0.12)
            // --- swings through ---
            .to(kickLegRef.current, { rotation: -98, duration: 0.16, ease: "power3.in" }, CONTACT - 0.16)
            .to(armRef.current, { rotation: 36, duration: 0.16, ease: "power3.in" }, CONTACT - 0.16)
            .to(kickerBodyRef.current, { rotation: -9, duration: 0.16, ease: "power3.in" }, CONTACT - 0.16)
            // the head keeps going after the body stops — that is the bobble
            .to(headRef.current, { rotation: -26, duration: 0.2, ease: "power2.out" }, CONTACT - 0.08)
            .to(headRef.current, { rotation: 0, duration: 0.6, ease: "elastic.out(1, 0.32)" }, CONTACT + 0.12)
            // --- contact: career is launched off the left edge ---
            .to(careerWrapRef.current, {
              x: () => -window.innerWidth * 0.85,
              y: -150,
              rotation: -40,
              opacity: 0,
              duration: 0.26,
              ease: "power3.in",
            }, CONTACT)
            // the columns shuffle left into their slots — the experience panel
            // ends at --slot-1, the projects at --slot-2, and education is
            // already sitting at --slot-3, so the three read as equal columns
            .to(".career-body .panel-inner", {
              x: () => slot("--slot-1") - slot("--slot-mid"),
              duration: 0.45,
              ease: "power2.inOut",
            }, CONTACT)
            .to(".projects-inner", {
              x: () => slot("--slot-2") - slot("--stage-pad-2"),
              duration: 0.45,
              ease: "power2.inOut",
            }, CONTACT)
            // --- recovers, then strolls off after it ---
            .to([kickLegRef.current, armRef.current, kickerBodyRef.current], {
              rotation: 0, duration: 0.24, ease: "power2.out",
            }, CONTACT + 0.16)
            .to(kickerRef.current, { x: () => -window.innerWidth * 0.3, duration: 0.68, ease: "none" }, CONTACT + 0.24)
            .to(kickLegRef.current, { keyframes: { rotation: walk(6) }, duration: 0.68 }, CONTACT + 0.24)
            .to(standLegRef.current, { keyframes: { rotation: walk(6).map((v) => -v) }, duration: 0.68 }, CONTACT + 0.24)
            // --- education rows take the third column ---
            .to(".edu-rise", {
              x: 0, opacity: 1, filter: "blur(0px)", duration: 0.5, ease: "power3.out", stagger: 0.05,
            }, CONTACT + 0.14);

          // the sheet drifts on its own before you ever touch it
          gsap.to(".resume-btn", {
            y: -5,
            duration: 2.4,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
          });

          // ...and only drifts into view after a further stretch of scrolling
          gsap.set(".resume-rise", { opacity: 0, y: 34 });
          gsap.to(".resume-rise", {
            opacity: 1,
            y: 0,
            ease: "none",
            scrollTrigger: {
              trigger: eduRef.current,
              start: "top -80%",
              end: "top -120%",
              scrub: 1,
            },
          });

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
          ctx.add(() => ScrollTrigger.removeEventListener("refreshInit", refit));
        }
      );

      document.fonts?.ready.then(() => ScrollTrigger.refresh()).catch(() => {});

      return () => {
        mm.revert();
        rootEl?.removeEventListener("mouseover", onOver);
        probe.remove();
      };
    },
    { scope: rootRef }
  );

  const titleLetters = "enrin".split("");
  const subtitleText = "tech / film / art";

  return (
    <div ref={rootRef} className={assetsReady ? undefined : "assets-pending"}>
      <div className="asset-gate" />
      <div className="grain" />

      {/* ONE PERSISTENT BACKDROP FOR THE WHOLE PAGE */}
      <div className="bg">
        {heroImages.map((src, i) => (
          <Image
            key={src}
            src={src}
            alt=""
            fill
            sizes="100vw"
            /* only the frame on screen at load is preloaded — the rest are 5s
               apart and stream in behind the intro */
            priority={i === 0}
            /* a decode failure still releases the gate — never hold on a 404 */
            onLoad={i === 0 ? () => setAssetsReady(true) : undefined}
            onError={i === 0 ? () => setAssetsReady(true) : undefined}
            className={`bg-slide ${i === currentSlide ? "active" : ""}`}
            style={{ objectPosition: heroPositions[i] }}
          />
        ))}
        <div className="bg-dim" />
        <div className="bg-wash" />
      </div>

      {/* the career backdrop + leaves fade over the slideshow for the career beat */}
      <div className="bg-career">
        <Image src="/assets/landing/9.jpg" alt="" fill sizes="100vw"
               className="bg-career-shot" />
      </div>
      <div className="leaf-layer">
        <FallingLeaves />
      </div>

      <nav className="nav">
        {/* the mark the hero title lands on */}
        <Link href="/" ref={markRef} className="brand-mark">enrin</Link>
        <div className="nav-links">
          <a href="#career" ref={navCareerRef}>career</a>
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
              based in nyc, im a forward deployed engineer and have been an early member at 2 startups doing $2.5M+ ARR. find my resume for more details
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
      <section id="career" ref={careerLeadRef} className="career-lead">
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
            <a key={p.title} href={p.href} target="_blank" rel="noopener noreferrer"
               className="work-card project-rise"
               onMouseEnter={playDemo} onMouseLeave={pauseDemo}>
              <div className="work-card-frame">
                {/* the clip is desktop-only (see .work-card-video) and loads
                    nothing until the pointer arrives, so a phone never pulls
                    the demo down — the still carries the card there. */}
                {/* #t=0.1 makes the first frame the card's resting image, so
                    the clip reads as a still until it is hovered — metadata is
                    all that loads, not the file. */}
                {p.video && (
                  <video src={`${p.video}#t=0.1`} className="work-card-shot work-card-video"
                         loop muted playsInline preload="metadata" />
                )}
                <Image src={p.img} alt={p.title} fill
                       /* one full-width column on the stacked layout, a fixed
                          --col-w column once the three-column stage is live */
                       sizes={`(max-width: ${STAGE_MIN}px) 100vw, 420px`}
                       className={`work-card-shot${p.video ? " work-card-still" : ""}`} />
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
        {/* the little guy who walks in and boots "career" off the page */}
        <div className="kicker-stage" aria-hidden="true">
          <svg ref={kickerRef} className="kicker" viewBox="0 0 120 172" width="42" height="60">
            <defs>
              <clipPath id="kickerHead">
                <circle cx="60" cy="36" r="35" />
              </clipPath>
            </defs>
            <g ref={kickerBodyRef} fill="#fff" stroke="#fff" strokeLinecap="round" strokeLinejoin="round"
               style={{ transformOrigin: "60px 108px" }}>
              {/* torso — tapered, so it has shoulders */}
              <path d="M44 66 L76 66 L72 112 L48 112 Z" stroke="none" />
              <g ref={armRef} style={{ transformOrigin: "48px 78px" }}>
                <path d="M48 78 L30 94" strokeWidth="11" />
              </g>
              <g ref={standLegRef} style={{ transformOrigin: "60px 110px" }}>
                <path d="M64 110 L67 146" strokeWidth="13" />
                <path d="M67 146 L53 151" strokeWidth="10" />
              </g>
              <g ref={kickLegRef} style={{ transformOrigin: "60px 110px" }}>
                <path d="M56 110 L53 146" strokeWidth="13" />
                <path d="M53 146 L39 151" strokeWidth="10" />
              </g>
              {/* the bobblehead itself, wobbling on the neck */}
              <g ref={headRef} style={{ transformOrigin: "60px 68px" }}>
                <circle cx="60" cy="36" r="36" fill="#fff" stroke="none" />
                {/* mirrored about the head's centre line (x=60) */}
                <image
                  href="/assets/bobbly_head.png"
                  x="25" y="1" width="70" height="70"
                  preserveAspectRatio="xMidYMid slice"
                  clipPath="url(#kickerHead)"
                  transform="translate(120,0) scale(-1,1)"
                />
              </g>
            </g>
          </svg>
        </div>
        <div className="education-inner">
          <EducationList rowClassName="edu-rise" bare />
          <div className="resume-wrap resume-rise">
            <a
              href="/assets/ResumeEnrinDebbarma.pdf"
              download="ResumeEnrinDebbarma.pdf"
              className="resume-btn"
              aria-label="Download resume"
            >
              <span className="resume-sheet">
                <svg viewBox="0 0 72 92" aria-hidden="true">
                  {/* sheet with a folded corner */}
                  <path className="resume-page" d="M6 4 h44 l16 16 v68 a4 4 0 0 1 -4 4 h-52 a4 4 0 0 1 -4 -4 v-80 a4 4 0 0 1 4 -4 z" />
                  <path className="resume-fold" d="M50 4 l16 16 h-16 z" />
                  <g className="resume-lines">
                    <path d="M18 38 h36" />
                    <path d="M18 50 h36" />
                    <path d="M18 62 h22" />
                  </g>
                </svg>
                <span className="resume-arrow">↓</span>
              </span>
              <span className="resume-label">resume</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
