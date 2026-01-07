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

    // Get recently played tracks
    const recentlyPlayedResponse = await fetch(
      'https://api.spotify.com/v1/me/player/recently-played?limit=50',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (!recentlyPlayedResponse.ok) {
      throw new Error(`Spotify API failed: ${recentlyPlayedResponse.status}`);
    }

    const recentlyPlayedData = await recentlyPlayedResponse.json();

    // Get top tracks for more data
    const topTracksResponse = await fetch(
      'https://api.spotify.com/v1/me/top/tracks?limit=10&time_range=short_term',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    let topTracksData = null;
    if (topTracksResponse.ok) {
      topTracksData = await topTracksResponse.json();
    }

    // Process the data
    const tracks = recentlyPlayedData.items || [];
    const mostRecentTrack = tracks[0];

    let mostPlayed = null;
    if (mostRecentTrack) {
      const track = mostRecentTrack.track;
      mostPlayed = {
        name: track.name,
        artist: track.artists.map(a => a.name).join(', '),
        album: track.album.name,
        trackId: track.id,
        playedAt: mostRecentTrack.played_at,
        image: track.album.images[0]?.url,
        external_url: track.external_urls.spotify
      };
    }

    // Get playlists
    const playlistsResponse = await fetch(
      'https://api.spotify.com/v1/me/playlists?limit=6',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    let playlists = [];
    if (playlistsResponse.ok) {
      const playlistsData = await playlistsResponse.json();
      playlists = playlistsData.items.map(playlist => ({
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        image: playlist.images[0]?.url,
        tracks: playlist.tracks.total,
        external_url: playlist.external_urls.spotify
      }));
    }

    const response = {
      mostPlayed,
      recentTracks: tracks.slice(0, 10).map(item => ({
        name: item.track.name,
        artist: item.track.artists.map(a => a.name).join(', '),
        album: item.track.album.name,
        playedAt: item.played_at,
        trackId: item.track.id
      })),
      topTracks: topTracksData?.items?.slice(0, 5).map(track => ({
        name: track.name,
        artist: track.artists.map(a => a.name).join(', '),
        album: track.album.name,
        trackId: track.id,
        popularity: track.popularity
      })) || [],
      playlists,
      lastUpdated: new Date().toISOString()
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