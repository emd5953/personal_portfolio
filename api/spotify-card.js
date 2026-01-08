export default async function handler(req, res) {
  // Set headers for SVG
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  try {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      return res.status(200).send(generateErrorCard('Missing Spotify credentials'));
    }

    // Get access token
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
      return res.status(200).send(generateErrorCard('Token refresh failed'));
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Get user profile
    const userResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!userResponse.ok) {
      return res.status(200).send(generateErrorCard('Failed to fetch user data'));
    }

    const userData = await userResponse.json();
    const userId = userData.id;

    // Get what I'm listening to today (recent track)
    const recentResponse = await fetch(
      'https://api.spotify.com/v1/me/player/recently-played?limit=1',
      {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }
    );

    let currentTrack = null;
    if (recentResponse.ok) {
      const recentData = await recentResponse.json();
      const recentTracks = recentData.items || [];
      
      if (recentTracks[0]) {
        const track = recentTracks[0].track;
        currentTrack = {
          name: track.name,
          artist: track.artists.map(a => a.name).join(', '),
          playedAt: recentTracks[0].played_at
        };
      }
    }

    // Get playlist of the day
    const playlistsResponse = await fetch(
      `https://api.spotify.com/v1/users/${userId}/playlists?limit=50`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }
    );

    let playlistOfTheDay = null;
    if (playlistsResponse.ok) {
      const playlistsData = await playlistsResponse.json();
      const userPlaylists = playlistsData.items.filter(playlist => 
        playlist.owner.id === userId
      );

      if (userPlaylists.length > 0) {
        // Use date as seed to get consistent playlist for the day
        const today = new Date().toDateString();
        const seed = today.split('').reduce((a, b) => {
          a = ((a << 5) - a) + b.charCodeAt(0);
          return a & a;
        }, 0);
        
        const playlistIndex = Math.abs(seed) % userPlaylists.length;
        const playlist = userPlaylists[playlistIndex];
        
        playlistOfTheDay = {
          name: playlist.name,
          tracks: playlist.tracks.total
        };
      }
    }

    // Generate Spotify-style card
    const svg = generateSpotifyCard(currentTrack, playlistOfTheDay);
    res.status(200).send(svg);

  } catch (error) {
    console.error('Spotify Card Error:', error);
    res.status(200).send(generateErrorCard('Error loading music data'));
  }

  function escapeXml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function generateErrorCard(message) {
    return `<svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="200" fill="#191414" rx="12"/>
        <rect x="0" y="0" width="400" height="40" fill="#282828" rx="12"/>
        <rect x="0" y="28" width="400" height="12" fill="#282828"/>
        
        <circle cx="20" cy="20" r="8" fill="#1DB954"/>
        <text x="20" y="25" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="10" font-weight="bold">♪</text>
        <text x="40" y="25" fill="white" font-family="Arial, sans-serif" font-size="12" font-weight="500">Spotify</text>
        
        <text x="200" y="110" text-anchor="middle" fill="#b3b3b3" font-family="Arial, sans-serif" font-size="14">
          ${escapeXml(message)}
        </text>
      </svg>`;
  }

  function generateSpotifyCard(currentTrack, playlistOfTheDay) {
    const timeAgo = currentTrack ? getTimeAgo(currentTrack.playedAt) : '';
    
    return `<svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="spotifyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#1DB954;stop-opacity:0.1" />
            <stop offset="100%" style="stop-color:#191414;stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <!-- Main Spotify embed container -->
        <rect width="400" height="200" fill="#191414" rx="12"/>
        
        <!-- Header section -->
        <rect x="0" y="0" width="400" height="40" fill="#282828" rx="12"/>
        <rect x="0" y="28" width="400" height="12" fill="#282828"/>
        
        <!-- Spotify logo and text -->
        <circle cx="20" cy="20" r="8" fill="#1DB954"/>
        <text x="20" y="25" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="10" font-weight="bold">♪</text>
        <text x="40" y="25" fill="white" font-family="Arial, sans-serif" font-size="12" font-weight="500">Spotify</text>
        
        <!-- Status text -->
        <text x="350" y="25" text-anchor="end" fill="#b3b3b3" font-family="Arial, sans-serif" font-size="11">
          ${timeAgo}
        </text>
        
        ${currentTrack ? `
        <!-- Album art placeholder -->
        <rect x="20" y="55" width="60" height="60" fill="#404040" rx="4"/>
        <text x="50" y="90" text-anchor="middle" fill="#808080" font-family="Arial, sans-serif" font-size="20">♪</text>
        
        <!-- Track info -->
        <text x="95" y="75" fill="white" font-family="Arial, sans-serif" font-size="14" font-weight="600">
          ${escapeXml(truncateText(currentTrack.name, 28))}
        </text>
        
        <text x="95" y="95" fill="#b3b3b3" font-family="Arial, sans-serif" font-size="12">
          ${escapeXml(truncateText(currentTrack.artist, 32))}
        </text>
        
        <!-- Progress bar background -->
        <rect x="95" y="105" width="280" height="3" fill="#404040" rx="1.5"/>
        <!-- Progress bar fill -->
        <rect x="95" y="105" width="84" height="3" fill="#1DB954" rx="1.5"/>
        
        <!-- Time stamps -->
        <text x="95" y="125" fill="#b3b3b3" font-family="Arial, sans-serif" font-size="10">1:23</text>
        <text x="375" y="125" text-anchor="end" fill="#b3b3b3" font-family="Arial, sans-serif" font-size="10">3:45</text>
        
        <!-- Control buttons -->
        <circle cx="320" cy="85" r="12" fill="#1DB954"/>
        <text x="320" y="90" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="12">▶</text>
        
        <!-- Heart icon -->
        <text x="350" y="90" text-anchor="middle" fill="#b3b3b3" font-family="Arial, sans-serif" font-size="14">♡</text>
        ` : `
        <!-- No track playing state -->
        <rect x="20" y="55" width="60" height="60" fill="#404040" rx="4"/>
        <text x="50" y="90" text-anchor="middle" fill="#808080" font-family="Arial, sans-serif" font-size="20">♪</text>
        
        <text x="95" y="80" fill="#b3b3b3" font-family="Arial, sans-serif" font-size="14">
          No track playing
        </text>
        `}
        
        ${playlistOfTheDay ? `
        <!-- Playlist section -->
        <rect x="20" y="140" width="360" height="40" fill="#282828" rx="6"/>
        <text x="30" y="155" fill="#b3b3b3" font-family="Arial, sans-serif" font-size="10" text-transform="uppercase">
          PLAYLIST OF THE DAY
        </text>
        <text x="30" y="170" fill="white" font-family="Arial, sans-serif" font-size="12" font-weight="500">
          ${escapeXml(truncateText(playlistOfTheDay.name, 40))}
        </text>
        <text x="350" y="165" text-anchor="end" fill="#1DB954" font-family="Arial, sans-serif" font-size="11">
          ${playlistOfTheDay.tracks} tracks
        </text>
        ` : ''}
        
      </svg>`;
  }

  function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text || '';
    return text.substring(0, maxLength - 3) + '...';
  }

  function getTimeAgo(timestamp) {
    const now = new Date();
    const played = new Date(timestamp);
    const diffMs = now - played;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return 'yesterday';
  }
}