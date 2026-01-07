export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      return res.status(500).json({ error: 'Missing Spotify credentials' });
    }

    // Get access token using refresh token
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    });

    if (!tokenResponse.ok) {
      throw new Error(`Token refresh failed: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Get user profile to get user ID
    const userResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!userResponse.ok) {
      throw new Error(`User profile fetch failed: ${userResponse.status}`);
    }

    const userData = await userResponse.json();
    const userId = userData.id;

    // Get recently played tracks (get more to calculate play counts)
    const recentlyPlayedResponse = await fetch(
      'https://api.spotify.com/v1/me/player/recently-played?limit=50',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    let lastPlayed = null;
    let mostPlayedToday = null;
    
    if (recentlyPlayedResponse.ok) {
      const recentlyPlayedData = await recentlyPlayedResponse.json();
      const recentTracks = recentlyPlayedData.items || [];
      
      // Last played is the most recent track
      if (recentTracks[0]) {
        const track = recentTracks[0].track;
        lastPlayed = {
          name: track.name,
          artist: track.artists.map(a => a.name).join(', '),
          album: track.album.name,
          trackId: track.id,
          playedAt: recentTracks[0].played_at,
          image: track.album.images[0]?.url,
          external_url: track.external_urls.spotify
        };
      }
      
      // Count play frequency for each track in recent history
      const trackCounts = {};
      const today = new Date().toDateString();
      
      recentTracks.forEach(item => {
        const playedDate = new Date(item.played_at).toDateString();
        // Only count plays from today
        if (playedDate === today) {
          const trackId = item.track.id;
          trackCounts[trackId] = (trackCounts[trackId] || 0) + 1;
        }
      });
      
      // Find the most played track from today
      let maxCount = 0;
      let mostPlayedTrackId = null;
      
      Object.entries(trackCounts).forEach(([trackId, count]) => {
        if (count > maxCount) {
          maxCount = count;
          mostPlayedTrackId = trackId;
        }
      });
      
      // Get the track details for most played
      if (mostPlayedTrackId && maxCount > 0) {
        const mostPlayedTrackItem = recentTracks.find(item => item.track.id === mostPlayedTrackId);
        if (mostPlayedTrackItem) {
          const track = mostPlayedTrackItem.track;
          mostPlayedToday = {
            name: track.name,
            artist: track.artists.map(a => a.name).join(', '),
            album: track.album.name,
            trackId: track.id,
            playCount: maxCount,
            image: track.album.images[0]?.url,
            external_url: track.external_urls.spotify,
            isFallback: false
          };
        }
      }
      
      // Fallback: if no track played multiple times today, use second most recent
      if (!mostPlayedToday && recentTracks[1]) {
        const track = recentTracks[1].track;
        mostPlayedToday = {
          name: track.name,
          artist: track.artists.map(a => a.name).join(', '),
          album: track.album.name,
          trackId: track.id,
          playCount: 1,
          playedAt: recentTracks[1].played_at,
          image: track.album.images[0]?.url,
          external_url: track.external_urls.spotify,
          isFallback: true
        };
      }
    }

    // Try to get actual top tracks (this might not work for new accounts)
    const topTracksResponse = await fetch(
      'https://api.spotify.com/v1/me/top/tracks?limit=1&time_range=short_term',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (topTracksResponse.ok) {
      const topTracksData = await topTracksResponse.json();
      const topTrack = topTracksData.items[0];
      
      if (topTrack) {
        mostPlayedToday = {
          name: topTrack.name,
          artist: topTrack.artists.map(a => a.name).join(', '),
          album: topTrack.album.name,
          trackId: topTrack.id,
          popularity: topTrack.popularity,
          image: topTrack.album.images[0]?.url,
          external_url: topTrack.external_urls.spotify,
          isFallback: false
        };
      }
    }

    // Get user's created playlists only
    const playlistsResponse = await fetch(
      `https://api.spotify.com/v1/users/${userId}/playlists?limit=50`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    let randomPlaylists = [];
    if (playlistsResponse.ok) {
      const playlistsData = await playlistsResponse.json();
      
      // Filter to only playlists created by the user
      const userCreatedPlaylists = playlistsData.items.filter(playlist => 
        playlist.owner.id === userId
      );

      // Get 3 random playlists using date as seed for consistency throughout the day
      const today = new Date().toDateString();
      const seed = today.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      
      // Simple seeded random function
      const seededRandom = (seed) => {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
      };

      // Shuffle array with seeded random
      const shuffled = [...userCreatedPlaylists];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(seededRandom(seed + i) * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      // Take first 3 from shuffled array
      randomPlaylists = shuffled.slice(0, 3).map(playlist => ({
        id: playlist.id,
        name: playlist.name,
        description: playlist.description || '',
        image: playlist.images[0]?.url,
        tracks: playlist.tracks.total,
        external_url: playlist.external_urls.spotify,
        isOwner: true
      }));
    }

    const response = {
      lastPlayed,
      mostPlayedToday,
      randomPlaylists,
      playlistsCount: randomPlaylists.length,
      lastUpdated: new Date().toISOString(),
      date: new Date().toDateString()
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Spotify API Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch Spotify data',
      message: error.message 
    });
  }
}