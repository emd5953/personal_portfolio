import { getSpotifyData } from "@/lib/spotify";

// Always render fresh — never cache at build/edge.
export const dynamic = "force-dynamic";
export const revalidate = 0;

function escapeXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function truncate(s: string, max: number) {
  return s.length > max ? s.slice(0, max - 1).trimEnd() + "…" : s;
}

// Fetch the album art and inline it as a data URI. GitHub proxies README
// images through Camo, which will not load external <image> hrefs inside an
// SVG, so the cover must be embedded.
async function fetchImageDataUri(url?: string): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") || "image/jpeg";
    const buf = Buffer.from(await res.arrayBuffer());
    return `data:${contentType};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

function svgResponse(svg: string) {
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      // Discourage GitHub's Camo proxy from serving a stale image.
      "Cache-Control": "no-cache, no-store, max-age=0, must-revalidate",
    },
  });
}

function card({
  label,
  title,
  artist,
  cover,
}: {
  label: string;
  title: string;
  artist: string;
  cover: string | null;
}) {
  const coverEl = cover
    ? `<image x="16" y="16" width="88" height="88" href="${cover}" clip-path="url(#cover)" preserveAspectRatio="xMidYMid slice"/>`
    : `<rect x="16" y="16" width="88" height="88" rx="8" fill="#282828"/>
       <text x="60" y="66" text-anchor="middle" font-size="34" fill="#1DB954">♪</text>`;

  return `<svg width="420" height="120" viewBox="0 0 420 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeXml(label)}: ${escapeXml(title)} by ${escapeXml(artist)}">
  <defs>
    <clipPath id="cover"><rect x="16" y="16" width="88" height="88" rx="8"/></clipPath>
    <clipPath id="card"><rect width="420" height="120" rx="12"/></clipPath>
  </defs>
  <g clip-path="url(#card)">
    <rect width="420" height="120" fill="#121212"/>
    ${coverEl}
    <g font-family="Segoe UI, Helvetica, Arial, sans-serif">
      <text x="124" y="38" fill="#1DB954" font-size="11" font-weight="700" letter-spacing="1.5">${escapeXml(label.toUpperCase())}</text>
      <text x="124" y="66" fill="#ffffff" font-size="17" font-weight="700">${escapeXml(truncate(title, 26))}</text>
      <text x="124" y="88" fill="#b3b3b3" font-size="13">${escapeXml(truncate(artist, 32))}</text>
    </g>
    <path transform="translate(388,16) scale(0.85)" fill="#1DB954" d="M12 0a12 12 0 100 24 12 12 0 000-24zm5.5 17.3a.75.75 0 01-1.03.25c-2.82-1.72-6.37-2.11-10.55-1.16a.75.75 0 11-.33-1.46c4.57-1.04 8.5-.59 11.66 1.34.35.22.46.68.25 1.03zm1.47-3.27a.94.94 0 01-1.29.31c-3.23-1.98-8.15-2.56-11.97-1.4a.94.94 0 11-.54-1.8c4.36-1.32 9.78-.68 13.49 1.6.44.27.58.85.31 1.29zm.13-3.4C15.73 8.34 9.1 8.13 5.4 9.25a1.12 1.12 0 11-.65-2.15c4.25-1.29 11.57-1.04 16.13 1.66a1.12 1.12 0 11-1.14 1.93z"/>
  </g>
</svg>`;
}

export async function GET() {
  try {
    const data = await getSpotifyData();
    const track = data.lastPlayed ?? data.mostPlayedToday;

    if (!track) {
      return svgResponse(
        card({
          label: "Spotify",
          title: "Not playing anything",
          artist: "—",
          cover: null,
        })
      );
    }

    const isLastPlayed = Boolean(data.lastPlayed);
    const cover = await fetchImageDataUri(track.image);

    return svgResponse(
      card({
        label: isLastPlayed ? "Last played" : "Top track today",
        title: track.name,
        artist: track.artist,
        cover,
      })
    );
  } catch (error) {
    console.error("Spotify Widget Error:", error);
    return svgResponse(
      card({
        label: "Spotify",
        title: "Unavailable right now",
        artist: "—",
        cover: null,
      })
    );
  }
}
