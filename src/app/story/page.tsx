"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import "../story.css";

interface Thought {
  id: string;
  date: string;
  tag: string;
  title: string;
  preview: string;
}

interface TimelineEntry {
  id: string;
  period: string;
  title: string;
  description: string;
  tags: string[];
}

export default function StoryPage() {
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);

  useEffect(() => {
    // Load dynamic content
    fetch("/api/content?type=thoughts")
      .then((r) => r.json())
      .then((d) => { if (d.success && d.data.length) setThoughts(d.data); })
      .catch(() => {});

    fetch("/api/content?type=timeline")
      .then((r) => r.json())
      .then((d) => { if (d.success && d.data.length) setTimeline(d.data); })
      .catch(() => {});

    // Load Spotify
    loadSpotify();

    // Scroll reveal
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("revealed"); }),
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );
    document.querySelectorAll(".scroll-reveal").forEach((el) => observer.observe(el));

    // Progress dots
    const updateProgress = () => {
      const sections = document.querySelectorAll("section[id]");
      let current = "intro";
      sections.forEach((s) => {
        if (s.getBoundingClientRect().top <= window.innerHeight / 2) current = s.id;
      });
      document.querySelectorAll(".progress-dot").forEach((dot) => {
        dot.classList.toggle("active", (dot as HTMLElement).dataset.section === current);
      });
    };
    window.addEventListener("scroll", updateProgress);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updateProgress);
    };
  }, []);

  async function loadSpotify() {
    try {
      const res = await fetch("/api/spotify");
      if (!res.ok) return;
      const data = await res.json();

      const trackTitle = document.querySelector(".track-title");
      const trackArtist = document.querySelector(".track-artist");
      const trackMood = document.querySelector(".track-mood");
      const indicator = document.querySelector(".today-indicator");

      if (data.lastPlayed) {
        if (trackTitle) trackTitle.textContent = data.lastPlayed.name;
        if (trackArtist) trackArtist.textContent = data.lastPlayed.artist;
        if (trackMood) trackMood.textContent = `from ${data.lastPlayed.album}`;
        if (indicator) indicator.innerHTML = `last played <span style="color:var(--text-secondary);font-weight:normal;">(${new Date(data.lastPlayed.playedAt).toLocaleTimeString()})</span>`;

        const musicPlayer = document.querySelector(".music-player");
        const featuredHeader = document.querySelector(".featured-playlists-header");
        if (musicPlayer && featuredHeader) {
          let embed = document.getElementById("spotify-embed-container");
          if (!embed) {
            embed = document.createElement("div");
            embed.id = "spotify-embed-container";
            embed.style.marginTop = "20px";
            musicPlayer.insertBefore(embed, featuredHeader);
          }
          embed.innerHTML = `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/${data.lastPlayed.trackId}?utm_source=generator&theme=0" width="100%" height="152" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`;
        }
      }

      if (data.randomPlaylists?.length) {
        const grid = document.getElementById("dynamic-playlists");
        if (grid) {
          grid.innerHTML = data.randomPlaylists.map((p: { id: string; name: string; tracks: number }) =>
            `<div class="playlist-embed-container"><h4 style="margin-bottom:10px;color:#333;">${p.name}</h4><p style="margin-bottom:15px;color:#666;font-size:14px;">${p.tracks} tracks</p><iframe style="border-radius:12px" src="https://open.spotify.com/embed/playlist/${p.id}?utm_source=generator&theme=0" width="100%" height="380" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe></div>`
          ).join("");
        }
      }

      const controls = document.querySelector(".player-controls");
      if (controls) (controls as HTMLElement).style.display = "none";
    } catch {
      const trackTitle = document.querySelector(".track-title");
      if (trackTitle) trackTitle.textContent = "Unable to load";
    }
  }

  // Fallback data
  const displayThoughts = thoughts.length ? thoughts : [
    { id: "1", date: "jul 27, 2025", tag: "nostalgia", title: "flashbacks & reminiscing", preview: "3 am. i spent the night confused... do not trust your thoughts after 11pm." },
    { id: "2", date: "mar 15, 2025", tag: "reflection", title: "the art of debugging life", preview: "sometimes fixing code is easier than fixing yourself." },
    { id: "3", date: "mar 10, 2025", tag: "tech", title: "why i fell in love with react", preview: "it wasn't the syntax or the ecosystem. it was the moment i realized how components mirror life." },
    { id: "4", date: "mar 8, 2025", tag: "life", title: "coffee shop chronicles", preview: "the best ideas come in the most unexpected places." },
    { id: "5", date: "mar 5, 2025", tag: "journey", title: "from music to code", preview: "how i transitioned creativity from music, art & style to software development." },
    { id: "6", date: "feb 28, 2025", tag: "code", title: "late night code sessions", preview: "when the world sleeps, the best code awakens." },
  ];

  const displayTimeline = timeline.length ? timeline : [
    { id: "1", period: "2021 - present", title: "the developer era", description: "diving deep into code, building projects, and discovering my passion for creating digital experiences.", tags: ["learning", "building", "growing"] },
    { id: "2", period: "2019 - 2021", title: "the discovery phase", description: "exploring different paths, trying new things, and slowly gravitating towards technology.", tags: ["exploration", "first code", "curiosity"] },
    { id: "3", period: "2017 - 2019", title: "the foundation years", description: "high school adventures, forming friendships that still matter today.", tags: ["friendship", "growth", "foundation"] },
    { id: "4", period: "early years", title: "the beginning", description: "where it all started. building with legos, taking apart electronics.", tags: ["curiosity", "wonder", "beginning"] },
  ];

  return (
    <>
      <nav className="story-nav">
        <Link href="/" className="nav-logo">enrin</Link>
        <div className="nav-sections">
          <a href="#sounds" className="nav-section">sounds</a>
          <a href="#art" className="nav-section">art</a>
          <a href="#thoughts" className="nav-section">thoughts</a>
          <a href="#timeline" className="nav-section">timeline</a>
        </div>
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <Link href="/art" className="nav-section">art</Link>
          <Link href="/career" className="back-btn">career</Link>
        </div>
      </nav>

      <div className="progress-indicator">
        {["intro", "sounds", "art", "thoughts", "timeline"].map((s) => (
          <div key={s} className={`progress-dot ${s === "intro" ? "active" : ""}`} data-section={s}
            onClick={() => document.getElementById(s)?.scrollIntoView({ behavior: "smooth" })} />
        ))}
      </div>

      <section id="intro" className="intro-section">
        <div className="intro-content">
          <h1 className="intro-title">the story</h1>
          <p className="intro-subtitle">thoughts, sounds, art, and moments that shaped the journey from curiosity to nostalgia</p>
          <a href="#sounds" className="start-btn">explore</a>
        </div>
      </section>

      <section id="sounds" className="content-section section-sounds">
        <div className="section-container">
          <div className="section-header scroll-reveal">
            <h2 className="section-title">sounds</h2>
            <p className="section-description">the soundtrack to thinking, and living</p>
          </div>
          <div className="music-player scroll-reveal">
            <div className="today-indicator">today&apos;s most played</div>
            <div className="current-track">
              <div className="track-title">loading...</div>
              <div className="track-artist">loading...</div>
              <div className="track-mood">loading...</div>
            </div>
            <div className="player-controls">
              <button className="control-btn">⏮</button>
              <button className="control-btn">⏯</button>
              <button className="control-btn">⏭</button>
              <button className="control-btn">🔀</button>
            </div>
            <div className="featured-playlists-header">featured playlists today</div>
            <div className="playlist-grid" id="dynamic-playlists" />
          </div>
        </div>
      </section>

      <section id="art" className="content-section section-art">
        <div className="section-container">
          <div className="section-header scroll-reveal">
            <h2 className="section-title">art</h2>
            <p className="section-description">visual stories and creative expressions</p>
          </div>
          <div className="song-covers-section scroll-reveal">
            <div className="main-cover-container">
              <img src="/assets/songCover.jpg" alt="Main song cover" className="main-cover-bg" />
              <div className="side-covers">
                <div className="side-cover-item left">
                  <img src="/assets/song1.jpg" alt="Song cover 1" className="side-cover-image" />
                  <p className="cover-caption">poetic</p>
                </div>
                <div className="side-cover-item right">
                  <img src="/assets/song2.jpg" alt="Song cover 2" className="side-cover-image" />
                  <p className="cover-caption">vulgarity</p>
                </div>
              </div>
            </div>
            <p className="main-cover-caption">talent show april 25&apos;</p>
          </div>
          <div className="additional-images-section scroll-reveal">
            <div className="additional-image-item">
              <img src="/assets/topAlbums.PNG" alt="Top albums" className="additional-image" />
              <p className="cover-caption">top albums</p>
            </div>
            <div className="additional-image-item">
              <img src="/assets/topSongs.PNG" alt="Top songs" className="additional-image" />
              <p className="cover-caption">top songs</p>
            </div>
          </div>
          <div className="video-section scroll-reveal">
            <div className="video-container-large">
              <iframe src="https://www.youtube.com/embed/iuqZl8EFd4s" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
            </div>
          </div>
        </div>
      </section>

      <section id="thoughts" className="content-section section-thoughts">
        <div className="section-container">
          <div className="section-header scroll-reveal">
            <h2 className="section-title">thoughts</h2>
            <p className="section-description">random musings, and life reflections</p>
          </div>
          <div className="thoughts-grid">
            {displayThoughts.map((t) => (
              <article key={t.id} className="thought-card scroll-reveal">
                <div className="thought-meta">
                  <span className="thought-date">{t.date}</span>
                  <span className="thought-tag">{t.tag}</span>
                </div>
                <h3 className="thought-title">{t.title}</h3>
                <p className="thought-preview">{t.preview}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="timeline" className="content-section section-timeline">
        <div className="section-container">
          <div className="section-header scroll-reveal">
            <h2 className="section-title">timeline</h2>
            <p className="section-description">the chapters that shaped who i am today</p>
          </div>
          <div className="timeline-container">
            <div className="timeline-line" />
            {displayTimeline.map((entry) => (
              <div key={entry.id} className="timeline-item scroll-reveal">
                <div className="timeline-marker" />
                <div className="timeline-content">
                  <div className="timeline-period">{entry.period}</div>
                  <h3 className="timeline-title">{entry.title}</h3>
                  <p className="timeline-description">{entry.description}</p>
                  <div className="timeline-tags">
                    {entry.tags.map((tag) => <span key={tag} className="timeline-tag">{tag}</span>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
