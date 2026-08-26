# Landing page — responsive animation repair

## Problem

The landing choreography in `src/app/page.tsx` is authored against a ~1440×900
desktop viewport. Away from that viewport it fails in three distinct ways:

1. **Mobile is broken.** `landing.css:732` flattens `.career-body`, `.projects`
   and `.education` to `position: relative; height: auto`, but the GSAP
   timelines keep running and keep translating those elements by viewport
   fractions (`x: innerWidth * 0.22`, `-innerWidth * 0.3`, `-innerWidth * 0.333`,
   `-innerWidth * 0.85`). The three-column stage those transforms target no
   longer exists, so content is pushed off-screen or jitters. There is no
   `matchMedia` gate anywhere in the file.
2. **A duplicated CSS block.** `landing.css:743-758` re-declares
   `.kicker-stage { position: fixed; display: flex }` *inside* the
   `max-width: 768px` media query, one line after `display: none` on `:741`.
   It is a verbatim paste of `:483-498`. The kicker is visible on phones.
3. **The 769–1200px range strangles.** Column *positions* are viewport
   fractions that scale correctly; column *widths* are the leftover
   (`100vw - padding-left - 40px`, capped at `420px`). At 900px wide the
   projects column gets 248px.

Plus two absences: no `prefers-reduced-motion` path, and `100vh` throughout
(never `dvh`), so the iOS address-bar collapse resizes the viewport mid-scroll
and snaps every scrubbed timeline.

## Goals

- The page is correct and calm on phones, tablets, laptops, and 4K.
- Motion is skipped, not broken, for `prefers-reduced-motion`.
- The three-column slot geometry has one source of truth instead of an
  algebraic identity maintained by hand across two files.

## Non-goals

- No visual redesign. The desktop experience at ~1440 should look identical
  before and after.
- No change to the hero → mark Flip, the about beat, the kicker animation
  itself, or the falling-leaves layer, beyond gating them by viewport.
- No DOM restructure of the three sections into a shared grid parent (see
  Approach — considered and rejected).
- No new dependencies.
- Not touching `/story`, `/art`, or the API routes.

## Approach

**Slot geometry moves into CSS custom properties; JS reads them.**

Today the column layout is expressed twice. CSS positions each section with a
`padding-left` (`46vw`, `68vw`, `66.7vw`), and JS moves them with separate
fractions (`-0.16`, `40 - 0.3`, `-0.333`). Those constants encode an invariant —
`0.46 - 0.16 - 0.30 = 0`, so the experience panel lands at exactly `40px` at any
width — that nobody wrote down and nothing enforces. Editing the CSS padding
silently breaks the landing position with no error.

The fix: declare the three slots once as custom properties on a stage rule,
have the CSS `padding-left` consume them, and have the timelines read the
computed value and animate `x` to `slot - element.getBoundingClientRect().left`.
That is the same measure-then-move pattern `careerFitVars()` and `dockVars()`
already use successfully — it is why those two moves are already correct at
every width. This extends it to the moves that still guess.

**Rejected: rebuilding the three sections as a real CSS grid.** It is the
textbook answer and it was my first instinct, but the three sections are not
siblings in a layout container — they are three independently sticky/fixed,
full-width, z-index-layered stages that deliberately overlap. `landing.css:495`
carries an explicit warning that adding `perspective` to `.education` would make
it the containing block for the `position: fixed` children layered over it and
break the stage. A grid parent risks the same class of breakage for a benefit
the custom-property approach already delivers.

**Breakpoint strategy: two modes, not three.** Rather than tuning a third set of
constants for tablets, the scrubbed three-column choreography runs only at
`>= 1100px`. Below that, sections stack in normal flow and get simple
entrance fades. This deletes the 769–1200 dead zone instead of furnishing it,
and means only one branch carries the slot math.

## Design

### Files changed

| File | Change |
|---|---|
| `src/app/landing.css` | Slot custom properties; delete duplicate block; `dvh`; new `<1100px` stacked mode; reduced-motion block |
| `src/app/page.tsx` | Wrap timelines in `gsap.matchMedia()`; read slots from CSS; mobile entrance timelines |

### Slot tokens

Declared once, consumed by both the CSS padding and the JS animation targets:

```css
:root {
  --stage-gutter: max(40px, 5.5vw);
  --slot-1: 40px;
  --slot-2: 34.7vw;
  --slot-3: 66.7vw;
  --col-w: clamp(280px, 26vw, 420px);
}
```

`--slot-2` and `--slot-3` preserve today's landing positions exactly
(`0.68 - 0.333 = 0.347`; education already sits at `66.7vw`). `--col-w`
replaces the bare `max-width: 420px`, giving columns a floor.

### JS surface

```ts
type Slots = { s1: number; s2: number; s3: number };
function readSlots(): Slots;                    // getComputedStyle on the stage
function slideTo(el: Element, target: number): gsap.TweenVars; // x: target - rect.left
```

Both are called inside `invalidateOnRefresh` tweens, so they re-measure on
resize through the existing `ScrollTrigger.refresh()` path.

### matchMedia structure

```ts
const mm = gsap.matchMedia(rootRef);
mm.add({
  desktop: "(min-width: 1100px)",
  reduced: "(prefers-reduced-motion: reduce)",
}, (ctx) => {
  const { desktop, reduced } = ctx.conditions!;
  ...
});
```

`gsap.matchMedia` reverts its context automatically when a condition stops
matching, so a resize across 1100px tears down the desktop timelines and cleans
up their inline transforms — the current manual cleanup return stays for the
listeners only.

## Behavior

**≥1100px, motion allowed.** Identical to today. Hero title flips to the mark;
about emerges and recedes; career leaves the nav, docks left, gets kicked off;
three columns shuffle into slots 1/2/3; education rises in the third.

**<1100px, motion allowed.** Sections stack in document order at full width.
The hero → mark Flip still runs (it is viewport-relative and measured, so it is
correct at any size). The about beat keeps its blur-and-emerge but drops the
z-depth push. Career, projects and education each fade + rise on entry, with no
horizontal travel and no dock. The kicker is genuinely hidden — one
`display: none`, no shadowing duplicate.

**`prefers-reduced-motion: reduce`, any width.** No scrubbed timelines at all.
Every element renders in its final state on load: title in the nav mark, about
copy fully visible, career title docked, all three columns in place. The
slideshow crossfade and the resume-sheet drift also stop. `SplitText` still runs
(it does not move anything on its own) so the hover dance stays available for
pointer users who have only asked for less *automatic* motion.

**Resize across 1100px.** `matchMedia` reverts the outgoing branch and builds
the incoming one; `ScrollTrigger.refresh()` re-measures. No page reload needed
and no stale inline transforms.

**Short viewports (<720px tall) at desktop width.** `.career-body` and
`.projects` currently clip via `height: 100vh; padding: 15vh; overflow: hidden`.
The top padding becomes `clamp(72px, 15vh, 160px)` and the stages get
`overflow-y: auto` so a squeezed column scrolls rather than silently losing
rows.

### Edge cases

- **iOS address bar.** All `100vh` → `100dvh`. The scroll runways
  (`.hero`, `.about`, `.career-lead`) keep proportional length while the bar
  animates, instead of triggering a refresh mid-scrub.
- **Late font load.** `document.fonts.ready → ScrollTrigger.refresh()` already
  exists and still fires; `refit()` stays wired to `refreshInit`.
- **JS disabled / GSAP fails to init.** Elements must be visible by default and
  hidden *by* the timeline, never hidden in CSS and revealed by JS. The current
  code already follows this (`gsap.set` for hidden states, not CSS); the mobile
  branch must too.

## Verification

No test suite exists in this repo, so verification is manual plus a build gate.

1. `npm run build && npm run lint` — clean.
2. `npm run dev`, then check at 390×844, 768×1024, 1024×768, 1280×800,
   1440×900, 2560×1440:
   - scroll the full page; no element leaves the viewport horizontally
   - the experience panel lands flush at the left gutter (slot 1)
   - the three columns do not overlap and none is narrower than 280px
   - the kicker is absent below 1100px
3. Resize the window slowly across 1100px mid-page — no stuck transforms, no
   duplicated "career".
4. macOS System Settings → Accessibility → Reduce Motion, reload: page is fully
   readable and static.
5. iOS Safari (or devtools iPhone emulation with the dynamic toolbar): scroll
   down and back up; no snap when the address bar collapses.

## Risks / open questions

- **The 1100px threshold is a judgment call.** It is where the projects column
  would fall below ~300px. If the stacked mode reads as a downgrade on a
  1024×768 iPad, the number is the thing to tune — it is a single constant.
- **`--slot-2: 34.7vw` is derived, not designed.** It reproduces today's
  position. If the intent was "centred third", it should be `33.3vw`; the
  0.347 may itself be a rounding artifact of the original tuning. Preserving
  current behavior is the safer default; flagging in case you know otherwise.
- **Assumption:** the desktop look at 1440 is correct and worth preserving
  exactly. If any of it was already a compromise, say so and it changes what
  "no visual change" means.
- **`overflow-y: auto` on a sticky stage** can capture scroll on trackpads when
  the inner content overflows. Only bites on short viewports; if it feels bad,
  the fallback is to scale the column down instead.

## What moved during implementation

Recorded here rather than silently — the spec is the decision record.

- **Decorative overlays are hidden in CSS after all.** `.bg-career` and
  `.leaf-layer` had no default opacity; the old code hid them with a
  `gsap.set` that ran unconditionally. Once that moved inside the desktop
  branch, both covered the hero on mobile and under reduced motion. They now
  start at `opacity: 0` in CSS. This is a deliberate exception to the
  "visible by default, hidden by the timeline" rule in Behavior: they are
  decoration layered *over* content, so failing closed is the safer failure.
  The stacked branch fades them in on its own trigger; reduced motion takes
  `.leaf-layer` out of the tree entirely (`display: none`), since it animates
  on a rAF loop that `opacity: 0` would leave running.
- **`--col-w` is `clamp(280px, 30vw, 420px)`, not `26vw`.** At `26vw` the
  columns measured 374px at 1440 instead of 420 — a visible regression against
  the "no visual change at 1440" non-goal, caught by screenshot diff. `30vw`
  reaches the 420px cap from ~1400 up.
- **Reduced motion needed two more rules.** `.hero-content` is `position:
  fixed` so the title can travel to the nav mark; with no timeline to carry it
  there and fade it out it hung over every section below. It becomes
  `position: absolute` (scrolls away with its section) and `.brand-mark` —
  normally revealed at the end of that travel — is simply on.
- **`--slot-mid: 30vw` was added** to the token set. The spec named three
  slots; the shuffle actually has four positions, because experience rests at
  a midpoint while projects slide in before both move again.

## Milestones

1. **Bug fixes.** Delete the duplicate `.kicker-stage` block; `100vh → 100dvh`.
   Repo working, mobile still wrong but no longer self-contradicting.
2. **matchMedia gate.** Desktop choreography runs only ≥1100px; below it,
   sections stack with entrance fades. Mobile correct.
3. **Reduced motion.** The `reduced` branch renders final states.
4. **Slot tokens.** Custom properties land; JS reads them instead of carrying
   its own fractions. `--col-w` floor added. Tablet range absorbed.
5. **Short-viewport padding + overflow.** The `clamp()` and scroll fallback.

All five landed. Each milestone left the page shippable.

## Verification performed

Headless Chrome against a production build, page rendered in a same-origin
iframe harness so a real narrow layout viewport could be measured (headless
clamps its own window to 500px minimum, which silently crops rather than
reflows — an early 390px screenshot was misread because of this).

- 1440×900 at four scroll depths, diffed against the pre-change build: the
  dock, the kick, and the three-column shuffle land on 40 / 500 / 960 as
  before.
- 1150×860: three columns at 40 / 399 / 767, ~330px each, no overlap — the
  width that previously strangled to ~250px.
- 390×844 at three scroll depths: single column, nothing off-screen, kicker
  absent.
- 1440×900 with `--force-prefers-reduced-motion` at two depths: fully static
  and readable, no leaves, no hero overlay.
- `npm run build` and `npx eslint src/app/page.tsx` clean (4 pre-existing
  `no-img-element` warnings).

Not covered: real iOS Safari address-bar behavior, and trackpad feel of the
`overflow-y: auto` fallback on short viewports. Both need a real device.
