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

    // Get recently played tracks for last played
    const recentlyPlayedResponse = await fetch(
      'https://api.spotify.com/v1/me/player/recently-played?limit=1',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    let lastPlayed = null;
    
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
      
      // Filter to only playlists created by the user AND public playlists
      const userCreatedPlaylists = playlistsData.items.filter(playlist => 
        playlist.owner.id === userId && playlist.public === true
      );

      // Get 3 random playlists using date as seed for consistency throughout the day (resets at midnight)
      const today = new Date();
      // Use UTC to avoid timezone issues
      const dateString = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, '0')}-${String(today.getUTCDate()).padStart(2, '0')}`;
      
      // Create a more robust seed from the date string
      let seed = 0;
      for (let i = 0; i < dateString.length; i++) {
        seed = ((seed << 5) - seed + dateString.charCodeAt(i)) & 0xffffffff;
      }
      
      // Better seeded random function using Linear Congruential Generator
      class SeededRandom {
        constructor(seed) {
          this.seed = seed % 2147483647;
          if (this.seed <= 0) this.seed += 2147483646;
        }
        
        next() {
          this.seed = (this.seed * 16807) % 2147483647;
          return (this.seed - 1) / 2147483646;
        }
      }
      
      const rng = new SeededRandom(seed);

      // Shuffle array with seeded random
      const shuffled = [...userCreatedPlaylists];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(rng.next() * (i + 1));
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