# Mobile pass — landing, story, art

## Problem

On a phone the site is broken in ways that are structural, not cosmetic. The
landing's two list components (`ExperienceList`, `EducationList`) lay out with
fixed-pixel inline grids sized for a 420px desktop column; at 390px viewport
width their chrome alone consumes more than half the row, so company names,
roles and detail text collide, wrap mid-word, or overflow — silently clipped by
`body { overflow-x: hidden }`. On `/art`, film cards are wired to
`mousedown`/`mousemove`/`mouseup` only, so a phone cannot open a single film,
and the cards sit permanently at `brightness(0.45)` because lighting them is a
`:hover` effect. On `/story`, every section applies a container padding *and* a
`marginLeft` to the inner block, pushing content past the right padding edge.

Measured at 390px (iPhone 14/15 logical width):

| Element | Chrome | Left for content |
|---|---|---|
| `ExperienceList` row | 56px logo + 40px gaps + 18px chevron + 40px page pad = 154px | 236px, of which a hard-coded `128px` company column leaves ~90px for a 25-character role |
| `EducationList` row | `52px 1fr auto 16px` + 3×24px gaps + 40px page pad = 180px | 210px for a name *and* a detail that together need ~320px |
| expanded detail | `padding-left: 76px` / `92px` | 40% of the screen is indent |

## Goals

- Every row, card and heading fits its viewport at 320px with no clipping and
  no horizontal scroll.
- `/art` films are openable by touch, and readable without a pointer.
- `/story` sections indent once, not twice.
- The pinned `brooklyn, ny / <time>` strip stops floating over content once the
  hero is gone.
- Desktop output is byte-identical in effect: every change is additive under a
  media query or a `(hover: none)` query, or a refactor that leaves the
  computed desktop layout unchanged.

## Non-goals

- Redesigning the mobile layout. The stacked mode from
  `docs/specs/landing-responsive-animations.md` stays as-is — this fixes what
  breaks inside it, it does not re-choreograph it.
- Touching the desktop three-column stage, its GSAP timelines, or the
  `STAGE_MIN = 1100` breakpoint.
- Mobile performance work (13 autoplaying `/art` videos, `FallingLeaves`,
  background audio). Real, but a separate pass — see Open questions.
- Edit-mode modals on `/story`. They are password-gated and author-only.
- New breakpoints. Everything lands on the two that already exist: 1099px
  (stacked mode) and 480px (phone).

## Approach

The list components carry their layout in React inline `style` objects, which
cannot hold a media query. Two ways out: (a) lift each row's layout into a CSS
class and let a media query restyle it, or (b) read a `matchMedia` breakpoint in
React and swap style objects.

Take (a). (b) re-introduces the desktop/mobile disagreement the codebase
already went out of its way to eliminate — `landing.css` and `page.tsx` are
deliberately pinned to one shared `STAGE_MIN` constant, with a comment saying
so — and it costs a hydration mismatch or a first-paint flash. Class-based
layout keeps one source of truth in CSS and ships zero extra JS.

The classes go in `globals.css`, not `landing.css`: `landing.css` is scoped to
the landing page by its own header comment, and these rows are shared
components. The desktop values move over verbatim, so the desktop cascade
produces exactly what the inline styles produced. Only presentational
properties move; the stateful ones (rotation on expand, chevron flip,
`grid-template-rows` accordion) stay inline where the state is.

For `/art`, add Pointer Events alongside the existing mouse handlers rather
than replacing them. `pointerdown`/`pointermove`/`pointerup` covers mouse, pen
and touch in one path, and `touch-action: none` on the card stops the strip
from stealing the drag as a horizontal scroll. On a touch device drag-to-play
is a bad primitive regardless, so under `(hover: none)` a tap opens the film
directly and the cards render lit.

## Design

### Files changed

| File | Change |
|---|---|
| `src/app/globals.css` | new `.exp-*` / `.edu-*` class blocks + their `@media (max-width: 480px)` overrides |
| `src/app/ExperienceList.tsx` | inline layout styles → classes; markup unchanged in structure |
| `src/app/EducationList.tsx` | same |
| `src/app/landing.css` | `.hero-bottom` phone sizing; stacked-mode gutter to `clamp()` |
| `src/app/page.tsx` | fade `.hero-bottom` out on the hero's existing ScrollTrigger |
| `src/app/story/page.tsx` | remove the `marginLeft` double-indent on section inners |
| `src/app/art/page.tsx` | pointer-event drag; tap-to-open + lit cards under `(hover: none)` |

### Experience row

Desktop (≥481px) is unchanged. At ≤480px the row drops to a two-line stack:

```
[40px logo]  COMPANY NAME
             Forward Deployed Engineer          [v]
             May 26' – Present
```

- header grid `128px auto 1fr` → `1fr` (single column, company / role stacked,
  the `|` separator hidden)
- logo 56px → 40px, radius 16 → 12, gap 20 → 14
- expanded detail `padding-left: 76px` → `0`
- company `text-overflow` is not needed once it owns a full line, but
  `overflow-wrap: anywhere` guards the longest string, `COLUMBIA UNIVERSITY`

### Education row

`52px 1fr auto 16px` at ≤480px becomes two rows:

```
2025                                            [v]
PENN STATE
B.S. Computer Science
```

i.e. `grid-template-columns: 1fr 16px` with the period, name and detail
stacked in the first cell, `gap` 24 → 10. Expanded detail
`padding-left: 92px` → `0`.

### Hero strip

`.hero-bottom` currently fades in via CSS and then never leaves. Add to the
existing `heroTl` (which already runs in both desktop and stacked mode, so
this needs no new trigger and no new breakpoint):

```ts
.to(".hero-bottom", { opacity: 0, duration: 0.3, ease: "power2.in" }, 0.6)
```

Under `prefers-reduced-motion` the timeline is never built, so `.hero-bottom`
gets `position: absolute` in the existing reduced-motion block instead — same
reasoning already applied to `.hero-content` there.

At ≤480px: `left/right` 20px → 16px, `font-size` 11px → 10px.

### Story indent

Each section is `px-6 md:px-16 max-md:px-8` on the outer, and its inner is
`max-w-[1100px]` with `marginLeft: clamp(16px, 4vw, 40px)`. The margin is
additive to the padding and, on `w-full` inners, pushes the block past the
right edge. Remove the `marginLeft` from the six section inners and the hero,
and let the section padding own the gutter — `px-6 md:px-16` already resolves
to a comparable desktop indent, so this is a small desktop nudge and a real
mobile fix. `textShadow` stays.

### Art films

```ts
onPointerDown / pointermove / pointerup   // replaces the mouse trio
touch-action: none                        // on the <video>
```

`(hover: none)` is read with `useSyncExternalStore` (subscribed to the media
query) rather than `useState` + `useEffect`: the effect-set-state form trips
`react-hooks/set-state-in-effect` and costs a second render pass. The server
snapshot is `false`, so SSR emits the pointer layout and the client corrects on
its first commit.

Under `(hover: none)`: cards render at `brightness(0.85)`, a tap calls
`onSelect(src)` directly, and the "drag me up" hint is not shown. The
`FullPlayer` overlay already uses `90vw/80vh` and `playsInline`, so it needs
nothing.

## Behavior

- **320px (iPhone SE)** — no horizontal scrollbar on any of the three routes;
  no text clipped at a container edge; every accordion opens and its photo
  strip scrolls.
- **390px** — experience and education rows read as two clean lines; the
  chevron stays on the first line, right-aligned.
- **Rotate portrait → landscape (390 → 844)** — crossing 480px re-lays out via
  CSS alone; no JS re-measure, no flash. Crossing 1100px is handled by the
  existing `gsap.matchMedia`, untouched.
- **`/art` on touch** — tap a film → `FullPlayer` opens, video autoplays with
  controls; tap the backdrop or × → closes. A horizontal swipe on the strip
  still scrolls it (the drag path only engages after `pointerdown` on a card,
  and a tap that never moves is treated as a tap).
- **`/art` on desktop** — drag-up-to-play is unchanged, including the two
  proximity hints.
- **`prefers-reduced-motion` on a phone** — no timelines build; `.hero-bottom`
  and `.hero-content` are both `absolute`, so the hero scrolls away normally
  and nothing is left pinned.

## Verification

`npm run build` and `npx tsc --noEmit` clean, `npm run lint` clean.

Manual, in devtools device mode at 320 / 390 / 768 / 1099 / 1100 / 1440:

1. `document.documentElement.scrollWidth <= window.innerWidth` on all three
   routes at every width.
2. Expand every experience and education row; nothing overlaps, photo strips
   scroll.
3. Scroll past the hero on the landing — the location/time strip is gone.
4. At 1100px+, diff a screenshot against `main`: the desktop stage must be
   pixel-identical.
5. On a real iOS device (or the responsive simulator's touch emulation): tap a
   film on `/art`, confirm it opens.

## Risks / open questions

- **Cascade order.** The new `globals.css` classes must not be overridden by a
  Tailwind preflight or utility. They are plain classes in the same file as
  `@import "tailwindcss"`, so they land after preflight — but if any row picks
  up a Tailwind utility later, the utility wins. Mitigation: keep the class
  names project-specific (`.exp-row`, not `.row`) and verify with computed
  styles in step 4.
- **`text-shadow` removal on `/story`** is *not* part of this — only the
  `marginLeft`. Flagging because the two live in the same style object and it
  would be easy to over-edit.
- **Assumption:** nothing outside `page.tsx` consumes `ExperienceList` or
  `EducationList` (verified: no other importer, and `.career-section-layout`
  in `globals.css` is dead). If a career page is re-added later it inherits
  the responsive rows for free.
- **Open:** mobile performance. `/art` mounts 13 `<video preload="metadata">`
  plus 5 background videos plus an autoplaying MP3; the landing runs
  `FallingLeaves` on a rAF loop. On a mid-range phone this is likely the
  *other* half of "terrible", but it is a behavior change, not a layout fix,
  so it is out of scope here. Worth its own pass.

## Changes from the spec as built

- **`.career-section-layout` kept.** The spec called it dead CSS. It is still
  emitted by `EducationList`'s non-`bare` branch — that branch has no caller
  today, but deleting the rules while the class ships is a latent regression
  for whoever uses it next. Left in place.
- **`useSyncExternalStore` on `/art`** instead of effect-set state, for the
  lint reason recorded above.
- **Stacked-mode gutters** went to a flat 16px at ≤480px rather than a
  `clamp()`. Two fixed steps (20px stacked, 16px phone) match how the rest of
  the file is written; a `clamp()` would have been the only fluid value in it.

## Milestones

All four landed.

1. **Lists** — `globals.css` classes + both list components. The single
   biggest visible fix; ships alone.
2. **Landing chrome** — hero strip fade-out, phone gutters.
3. **Story** — remove the double indent.
4. **Art** — pointer events + touch affordances.
