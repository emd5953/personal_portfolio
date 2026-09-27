import type { Metadata } from "next";
import Link from "next/link";
import { getTopTracks, type TopTrack } from "@/lib/spotify";
import "./music.css";

// The ranking moves over days, not minutes — hourly keeps Spotify off every view.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "top tracks · enrinjr",
};

function formatDuration(ms: number) {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-label="duration" role="img">
      <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 4.5V8l2.5 1.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function TrackRow({ track, rank }: { track: TopTrack; rank: number }) {
  return (
    <li className="tt-row">
      <span className="tt-rank">{rank}</span>
      <div className="tt-title">
        {track.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- 48px Spotify CDN thumbs; not worth a remotePatterns entry
          <img className="tt-cover" src={track.image} alt="" width={48} height={48} loading="lazy" />
        ) : (
          <span className="tt-cover" aria-hidden />
        )}
        <div className="tt-text">
          <a className="tt-name" href={track.url} target="_blank" rel="noopener noreferrer">
            {track.name}
          </a>
          <span className="tt-artists">
            {track.explicit && <span className="tt-explicit" title="Explicit">E</span>}
            {track.artists.join(", ")}
          </span>
        </div>
      </div>
      <span className="tt-album">{track.album}</span>
      <span className="tt-duration">{formatDuration(track.durationMs)}</span>
    </li>
  );
}

export default async function MusicPage() {
  let tracks: TopTrack[] | null = null;
  try {
    tracks = await getTopTracks(50);
  } catch (error) {
    console.error("Top tracks error:", error);
  }

  return (
    <main className="tt-page">
      <nav className="site-nav">
        <Link href="/" className="font-display text-[16px] font-semibold text-white no-underline tracking-tight">enrin</Link>
        <div className="flex gap-7">
          <Link href="/story" className="text-white/45 no-underline text-[13px] font-normal tracking-wide hover:text-white transition-colors duration-400">story</Link>
          <Link href="/art" className="text-white/45 no-underline text-[13px] font-normal tracking-wide hover:text-white transition-colors duration-400">art</Link>
        </div>
      </nav>

      <section className="tt-wrap">
        <header className="tt-header">
          <h1>Top tracks this month</h1>
          <p>Last 4 weeks on Spotify</p>
        </header>

        {tracks === null ? (
          <p className="tt-message">Couldn&apos;t reach Spotify right now.</p>
        ) : tracks.length === 0 ? (
          <p className="tt-message">Nothing on repeat yet.</p>
        ) : (
          <>
            <div className="tt-row tt-head" aria-hidden>
              <span className="tt-rank">#</span>
              <span>Title</span>
              <span className="tt-album">Album</span>
              <span className="tt-duration"><ClockIcon /></span>
            </div>
            <ol className="tt-list">
              {tracks.map((track, i) => (
                <TrackRow key={track.id} track={track} rank={i + 1} />
              ))}
            </ol>
          </>
        )}
      </section>
    </main>
  );
}
