# Top tracks this month

## Problem
The site shows what Enrin last played (story page) but not what they've had on
repeat. Spotify's own "Top tracks this month" list is the clearest answer to
that, and it's only visible inside the Spotify app. Put the same list on the
site, laid out like Spotify's table.

## Goals / Non-goals
Goals
- New page `/music` listing the top 50 tracks (the API maximum per request) over the last ~4 weeks.
- Layout mirrors the Spotify screenshot: `#`, cover + title + artists, album,
  duration column with a clock header icon; explicit `E` badge before artists.
- Data comes from the existing `SPOTIFY_*` env credentials. No re-auth.

Non-goals
- Playback, 30s previews, or embedded players.
- Time-range switcher (4 weeks / 6 months / all time).
- Top artists, genres, charts.
- Play counts. Spotify's API exposes only the ranking, not counts; real
  numbers would need our own play log (cron → Supabase) or Last.fm. Considered
  and skipped.
- Linking `/music` from the landing nav — separate call once the page exists.
- Refactoring `getSpotifyData()` or the stale `docs/SPOTIFY_API.md`.

## Approach
Server component that fetches Spotify at request time with a one-hour ISR
cache (`revalidate = 3600`). The top-tracks ranking moves over days, not
minutes, so hourly is plenty and keeps the page from hitting Spotify on every
view.

Rejected: a client component fetching a new `/api/...` route, like the story
page does. It adds a loading state and a round trip for data that is
effectively static per hour, and nothing on this page is interactive.

"This month" = Spotify `time_range=short_term` (~4 weeks). That is the same
window Spotify uses for its own "Top tracks this month" list, so the page
matches what the screenshot shows. A calendar-month count is not possible —
the API only exposes these fixed windows.

Styling uses the site's palette and Space Mono rather than Spotify green/Circular,
so it reads as part of the portfolio. The *layout* is Spotify's.

## Design
- `src/lib/spotify.ts`
  - Extract the token refresh into `getAccessToken(): Promise<string>`;
    `getSpotifyData()` calls it (behavior unchanged).
  - Add:
    ```ts
    type TopTrack = {
      id: string; name: string; artists: string[]; album: string;
      image?: string; durationMs: number; explicit: boolean; url: string;
    };
    getTopTracks(limit = 10): Promise<TopTrack[]>
    ```
    Calls `GET /v1/me/top/tracks?time_range=short_term&limit=50`; picks the
    smallest album image ≥ 64px.
- `src/app/music/page.tsx` — server component, `export const revalidate = 3600`,
  `metadata.title = "top tracks · enrinjr"`. Renders header + table.
- `src/app/music/music.css` — page styles (grid table, hover row, responsive).
- No new dependencies. Covers are plain `<img>` (the existing code doesn't
  configure `next/image` remote hosts for `i.scdn.co`; adding that config for
  10 × 64px thumbnails isn't worth it).

## Behavior
- Header: "Top tracks this month"; subtitle "Last 4 weeks on Spotify" replacing
  Spotify's "Only visible to you" (it's public here). Not a relative
  "updated …" time: the render is cached for an hour, so it would go stale.
- Each row: rank, 48px cover, title (links to the track on Spotify, new tab),
  artists comma-joined with `E` badge if explicit, album, `m:ss` duration.
- Row hover: subtle surface tint, like Spotify.
- ≤ 640px: album column hidden; duration stays; title/artist truncate with
  ellipsis. No horizontal scroll.
- Spotify error or missing env: page still renders header plus a single line
  "Couldn't reach Spotify right now." Error is logged. The error render is
  cached like any other, so it shows until the next hourly revalidation.
- Fewer than 50 tracks returned: render what came back. Zero: "Nothing on
  repeat yet."

## Verification
- `npm run lint` and `npm run build` pass.
- `npm run dev`, open `/music`: 50 rows, ranks 1–50, durations match Spotify
  app for spot-checked tracks.
- Resize to 375px: album column gone, no horizontal scroll.
- Unset `SPOTIFY_REFRESH_TOKEN` locally: error line renders, no crash.
- `/story` still shows last played (regression check on the token refactor).

## Risks / open questions
- Spotify can revoke the refresh token or tighten dev-mode API access; then
  the page shows the error line until the token is regenerated
  (`scripts/get-spotify-token.mjs` — its `scopes` string lacks `user-top-read`;
  the current token has it, but the script should be updated so a regenerated
  token keeps it). Folded into milestone 1.
- Route name `/music` is my pick; say if you want `/top` or similar.

## Milestones
1. [x] `getAccessToken` + `getTopTracks` in `src/lib/spotify.ts`; add
   `user-top-read` to the token script's scopes.
2. [x] `/music` page + CSS, desktop and phone layouts, error/empty states.
