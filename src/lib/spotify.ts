export async function getSpotifyData() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Missing Spotify credentials");
  }

  const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }),
  });

  if (!tokenResponse.ok) throw new Error(`Token refresh failed: ${tokenResponse.status}`);
  const { access_token: accessToken } = await tokenResponse.json();

  const userResponse = await fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!userResponse.ok) throw new Error(`User profile fetch failed: ${userResponse.status}`);
  const { id: userId } = await userResponse.json();

  // Look up the intro/player track so we can use its 30s preview clip.
  let introTrack: { name: string; artist: string; previewUrl: string | null; image?: string; trackId: string } | null = null;
  const introQuery = encodeURIComponent("Summer's Over Interlude Drake");
  const searchResponse = await fetch(`https://api.spotify.com/v1/search?q=${introQuery}&type=track&limit=1`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (searchResponse.ok) {
    const searchData = await searchResponse.json();
    const t = searchData.tracks?.items?.[0];
    if (t) {
      introTrack = {
        name: t.name,
        artist: (t.artists || []).map((a: { name: string }) => a.name).join(", "),
        previewUrl: t.preview_url ?? null,
        image: t.album?.images?.[0]?.url,
        trackId: t.id,
      };
    }
  }

  const firstResponse = await fetch("https://api.spotify.com/v1/me/player/recently-played?limit=50", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  let allRecentTracks: Array<{ track: { id: string; name: string; artists: Array<{ name: string }>; album: { name: string; images: Array<{ url: string }> }; external_urls: { spotify: string } }; played_at: string }> = [];
  if (firstResponse.ok) {
    const firstData = await firstResponse.json();
    allRecentTracks = firstData.items || [];
    if (allRecentTracks.length === 50 && firstData.next) {
      const secondResponse = await fetch(firstData.next, { headers: { Authorization: `Bearer ${accessToken}` } });
      if (secondResponse.ok) {
        const secondData = await secondResponse.json();
        allRecentTracks = allRecentTracks.concat(secondData.items || []);
      }
    }
  }

  let lastPlayed = null;
  let mostPlayedToday = null;

  if (allRecentTracks.length > 0) {
    const track = allRecentTracks[0].track;
    lastPlayed = {
      name: track.name,
      artist: track.artists.map((a) => a.name).join(", "),
      album: track.album.name,
      trackId: track.id,
      playedAt: allRecentTracks[0].played_at,
      image: track.album.images[0]?.url,
      external_url: track.external_urls.spotify,
    };

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayTracks = allRecentTracks.filter((item) => new Date(item.played_at) >= todayStart);

    const trackCounts: Record<string, { count: number; track: typeof track; lastPlayedAt: string }> = {};
    todayTracks.forEach((item) => {
      const id = item.track.id;
      if (!trackCounts[id]) trackCounts[id] = { count: 0, track: item.track, lastPlayedAt: item.played_at };
      trackCounts[id].count++;
      if (new Date(item.played_at) > new Date(trackCounts[id].lastPlayedAt)) trackCounts[id].lastPlayedAt = item.played_at;
    });

    let maxCount = 1;
    let mostPlayedTrackId: string | null = null;
    Object.keys(trackCounts).forEach((id) => {
      if (trackCounts[id].count > maxCount) { maxCount = trackCounts[id].count; mostPlayedTrackId = id; }
    });

    if (mostPlayedTrackId && trackCounts[mostPlayedTrackId]) {
      const td = trackCounts[mostPlayedTrackId];
      mostPlayedToday = {
        name: td.track.name, artist: td.track.artists.map((a) => a.name).join(", "),
        album: td.track.album.name, trackId: td.track.id, playCount: td.count,
        lastPlayedAt: td.lastPlayedAt, image: td.track.album.images[0]?.url,
        external_url: td.track.external_urls.spotify,
      };
    }
  }

  const playlistsResponse = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists?limit=50`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  let randomPlaylists: Array<{ id: string; name: string; description: string; image?: string; tracks: number; external_url: string; isOwner: boolean }> = [];
  if (playlistsResponse.ok) {
    const playlistsData = await playlistsResponse.json();
    const userCreatedPlaylists = playlistsData.items.filter(
      (p: { owner: { id: string }; public: boolean }) => p.owner.id === userId && p.public === true
    );

    const today = new Date();
    const dateString = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, "0")}-${String(today.getUTCDate()).padStart(2, "0")}`;
    let seed = 0;
    for (let i = 0; i < dateString.length; i++) seed = ((seed << 5) - seed + dateString.charCodeAt(i)) & 0xffffffff;

    class SeededRandom { seed: number; constructor(s: number) { this.seed = s % 2147483647; if (this.seed <= 0) this.seed += 2147483646; } next() { this.seed = (this.seed * 16807) % 2147483647; return (this.seed - 1) / 2147483646; } }
    const rng = new SeededRandom(seed);
    const shuffled = [...userCreatedPlaylists];
    for (let i = shuffled.length - 1; i > 0; i--) { const j = Math.floor(rng.next() * (i + 1)); [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; }

    randomPlaylists = shuffled.slice(0, 3).map((p: { id: string; name: string; description?: string; images: Array<{ url: string }>; tracks: { total: number }; external_urls: { spotify: string } }) => ({
      id: p.id, name: p.name, description: p.description || "", image: p.images[0]?.url,
      tracks: p.tracks.total, external_url: p.external_urls.spotify, isOwner: true,
    }));
  }

  return { lastPlayed, mostPlayedToday, randomPlaylists, introTrack, playlistsCount: randomPlaylists.length, lastUpdated: new Date().toISOString(), date: new Date().toDateString() };
}
