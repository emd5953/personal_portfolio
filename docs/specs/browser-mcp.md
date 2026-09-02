# Browser MCP — let Claude see the rendered page

**Status: proposed, not built.** Written 2026-09-02. Nothing in this document
exists yet — no code was written for it, and the portfolio does not depend on
it. Pick it up by starting at Milestone 1, which is a plain CLI and proves the
risky part before any MCP framing exists.

## Problem

Every visual bug this session was diagnosed by reading CSS and inferring what
the browser would do with it. That inference was wrong three times: the crop
bias went the wrong way, `overflow: hidden` "fixed" the column alignment by
deleting the scrolling that projects depends on, and a stale build cache served
CSS that `npm run build` had compiled correctly — invisible to every check that
was run. Each cost a round trip through a screenshot the user had to take by
hand.

The checks available today (`tsc`, `npm run build`, grepping compiled CSS)
confirm that code compiles and that rules reach the stylesheet. None of them
confirm what a person sees. That gap is the whole problem.

## Goals

- Screenshot any URL at a given viewport, scroll position, and media-feature
  state, and hand back a PNG path.
- Reach the states this codebase actually branches on: the 1099px stage
  boundary, the 480px phone rules, `(hover: none)`, `prefers-reduced-motion`,
  and scroll positions partway through a scrubbed GSAP timeline.
- Report `document.documentElement.scrollWidth` vs `innerWidth`, and the
  bounding rects of named selectors — the measurements this session kept asking
  the user for.
- No new runtime dependencies.

## Non-goals

- A general browser-automation surface (clicking, typing, form flows). This is
  for *looking*, not driving. Interaction beyond scroll is out of v1.
- Replacing the dev server, or managing its lifecycle. The server points at a
  URL that is already up.
- Visual regression baselines/diffing. Possible later; not v1.
- Cross-browser. Chrome only — it's what's installed.

## Approach

Chrome ships a full remote-control API over the DevTools Protocol, and Node 26
has a native `WebSocket`. So: launch
`/Applications/Google Chrome.app/.../Google Chrome` with
`--headless --remote-debugging-port`, connect to the page target, and drive it
with CDP. Zero dependencies, no browser download.

The alternative is Playwright, which is more robust — better waiting
primitives, a real page object model, less protocol plumbing to get wrong — at
the cost of a ~150MB `npx playwright install chromium`, plus a devDependency in
a portfolio repo that has no test suite to justify it. Rejected on weight, with
one caveat under Risks.

Rejected too: the one-shot `--screenshot` flag. It works today (verified during
this session — it produced a readable 390px capture of the landing page) but it
cannot scroll, cannot wait on real time, and under `--virtual-time-budget` the
hero's CSS letter animations did not settle. Half this codebase's behavior is
scroll-driven, so a tool that cannot scroll answers none of the open questions.

Packaged as an MCP server rather than a repo script: the capability is not
specific to this portfolio, and an MCP server is available in every project
without re-deriving it. Cost is a config entry and a Claude Code restart.

## Design

Standalone at `~/.claude/mcp/browser/`, registered in `~/.claude.json` under
global `mcpServers`. Nothing lands in the portfolio repo.

```
~/.claude/mcp/browser/
  server.js      # MCP stdio server: JSON-RPC framing, tool dispatch
  cdp.js         # minimal CDP client over native WebSocket
  chrome.js      # locate + launch + shut down Chrome, port handling
```

`@modelcontextprotocol/sdk` is a single dependency and handles the stdio
framing correctly; the JSON-RPC surface here is small enough to implement raw.
Decide at build time — try the SDK, drop to raw if it drags in a tree.

### Tools

```ts
browser_screenshot({
  url: string,
  width?: number,          // default 1440
  height?: number,         // default 900
  deviceScaleFactor?: number,  // default 2
  scrollTo?: number | string,  // px, or a selector to scroll into view
  media?: { hover?: "none" | "hover";
            prefersReducedMotion?: "reduce" | "no-preference";
            colorScheme?: "light" | "dark" }, 
  waitMs?: number,         // default 1200, after load and after scroll
  fullPage?: boolean,      // default false
  outDir?: string,
}) -> { path: string, width: number, height: number }

browser_measure({
  url: string,
  selectors: string[],
  width?, height?, scrollTo?, media?, waitMs?,
}) -> {
  scrollWidth: number, innerWidth: number, overflows: boolean,
  rects: Record<string, { top, left, width, height } | null>,
}
```

`browser_measure` is the half that would have settled the column-alignment
question in one call instead of four exchanges.

### Lifecycle

One Chrome process per server, launched lazily on first call, reused across
calls, killed on server shutdown. A `--user-data-dir` under a temp path keeps
it clear of the user's real profile. Port 0 for an OS-assigned port, read back
from Chrome's `DevToolsActivePort` file rather than guessed.

## Behavior

- **Chrome not found** → error naming the paths tried. Never silently fall back
  to a different renderer.
- **URL unreachable** → error with the status or connection failure. Do not
  return a screenshot of an error page as if it were the app.
- **Navigation timeout** (default 15s) → error, kill the page, keep the browser.
- **`scrollTo` as a selector that matches nothing** → error, not a silent
  scroll to 0. Silent fallbacks are what made the CSS inference unreliable.
- **Scroll-driven animation** → after scrolling, wait `waitMs` in *real* time so
  ScrollTrigger's scrub can settle. No virtual time anywhere.
- **Repeat calls to the same URL** reuse the browser but always renavigate, so
  no state leaks between captures.

## Verification

The tool is verified against the bugs from this session, since each has a known
answer:

1. Landing at 390×844 — the hero title must not overlay the about section
   (fixed in 3216f6b). A capture that shows it overlapping means the tool is
   lying or the fix regressed.
2. Landing at 1440×900 scrolled to the stage — `browser_measure` on
   `.career-body .exp-row`, `.projects-inner .work-card`,
   `.education-inner .edu-head`. The three `top` values should agree within
   ~5px. This is the measurement that was asked for and never obtained.
3. `/art` with `media.hover = "none"` — film cards must render lit
   (`brightness(0.85)`), not dimmed.
4. All three routes at 320/390/481/700/1099/1100 — `overflows` must be false.
   This settles the open question about the education row between 481 and
   700px, which is still unresolved.
5. Point it at a deliberately stale build to confirm it catches what
   `npm run build` cannot.

## Risks / open questions

- **Headless ≠ headed.** Fonts, scrollbar width, and compositing can differ.
  Mitigation: `--hide-scrollbars` and an explicit `deviceScaleFactor`; treat
  captures as strong evidence, not proof, for sub-pixel questions.
- **CDP plumbing is the risky part.** Waiting correctly for "the page has
  settled" is exactly what Playwright does well and what a hand-rolled client
  gets wrong. If `waitMs` proves flaky in practice, switch to Playwright — the
  tool surface above does not change, only what is behind it.
- **`dvh` units under headless** may resolve against a different viewport than
  a real mobile browser, where the URL bar moves. `--stage-top` and the hero
  are built on `dvh`, so headless may be optimistic here.
- **Assumption:** the asset gate releases. The landing holds `.assets-pending`
  until the first hero image decodes; if that never fires headless, every
  capture is a black screen. The one-shot test did render the backdrop, so this
  looks fine, but it is the first thing to check.

## Milestones

1. `chrome.js` + `cdp.js` + a plain CLI (`node shot.js <url> --width 390`).
   Usable immediately via Bash, and proves the hard part before any MCP
   framing exists.
2. `browser_measure` on the same CLI. Settles the two open layout questions.
3. Wrap both as an MCP server; register it; restart Claude Code.
4. Run the five verification cases above and record the results here.
