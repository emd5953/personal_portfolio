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

    // Generate simple SVG card
    const svg = generateSimpleCard(currentTrack, playlistOfTheDay);
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
    return `<svg width="400" height="150" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#1DB954;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#1ed760;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="400" height="150" fill="url(#bg)" rx="10"/>
        <text x="200" y="80" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="14" font-weight="bold">
          ♪ ${escapeXml(message)}
        </text>
      </svg>`;
  }

  function generateSimpleCard(currentTrack, playlistOfTheDay) {
    const timeAgo = currentTrack ? getTimeAgo(currentTrack.playedAt) : '';
    
    return `<svg width="450" height="200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#2a2a2a;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#1a1a1a;stop-opacity:1" />
          </linearGradient>
          <filter id="shadow">
            <feDropShadow dx="0" dy="4" stdDeviation="8" flood-opacity="0.3"/>
          </filter>
        </defs>
        
        <!-- Background with shadow -->
        <rect width="450" height="200" fill="url(#bg)" rx="12" filter="url(#shadow)"/>
        
        <!-- Border accent -->
        <rect x="2" y="2" width="446" height="196" fill="none" stroke="rgba(29, 185, 84, 0.3)" stroke-width="1" rx="11"/>
        
        <!-- Header section -->
        <rect x="0" y="0" width="450" height="45" fill="rgba(29, 185, 84, 0.1)" rx="12"/>
        
        <!-- Spotify icon -->
        <circle cx="25" cy="22" r="8" fill="#1DB954"/>
        <text x="25" y="27" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="10" font-weight="bold">♪</text>
        
        <!-- Header text -->
        <text x="45" y="28" fill="#1DB954" font-family="Arial, sans-serif" font-size="14" font-weight="bold">
          what i'm listening to today
        </text>
        
        ${currentTrack ? `
        <!-- Current Track Section -->
        <text x="25" y="70" fill="rgba(255,255,255,0.6)" font-family="Arial, sans-serif" font-size="11" font-weight="500" letter-spacing="1px">
          NOW PLAYING
        </text>
        
        <text x="25" y="95" fill="white" font-family="Arial, sans-serif" font-size="16" font-weight="600">
          ${escapeXml(truncateText(currentTrack.name, 35))}
        </text>
        
        <text x="25" y="115" fill="rgba(255,255,255,0.8)" font-family="Arial, sans-serif" font-size="13">
          by ${escapeXml(truncateText(currentTrack.artist, 40))}
        </text>
        
        <text x="25" y="132" fill="rgba(29, 185, 84, 0.8)" font-family="Arial, sans-serif" font-size="11">
          ${timeAgo}
        </text>
        ` : `
        <text x="25" y="85" fill="rgba(255,255,255,0.6)" font-family="Arial, sans-serif" font-size="14">
          No recent activity
        </text>
        `}
        
        ${playlistOfTheDay ? `
        <!-- Divider line -->
        <line x1="25" y1="150" x2="425" y2="150" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
        
        <!-- Playlist section -->
        <text x="25" y="170" fill="rgba(29, 185, 84, 0.8)" font-family="Arial, sans-serif" font-size="11" font-weight="500">
          PLAYLIST OF THE DAY
        </text>
        
        <text x="25" y="188" fill="rgba(255,255,255,0.9)" font-family="Arial, sans-serif" font-size="12" font-weight="500">
          ${escapeXml(truncateText(playlistOfTheDay.name, 30))} • ${playlistOfTheDay.tracks} tracks
        </text>
        ` : ''}
        
        <!-- Live indicator -->
        <circle cx="410" cy="25" r="4" fill="#1DB954">
          <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite"/>
        </circle>
        <text x="400" y="40" fill="rgba(29, 185, 84, 0.8)" font-family="Arial, sans-serif" font-size="9" font-weight="500">LIVE</text>
        
        <!-- Decorative elements -->
        <circle cx="380" cy="180" r="2" fill="rgba(29, 185, 84, 0.3)"/>
        <circle cx="395" cy="175" r="1.5" fill="rgba(29, 185, 84, 0.2)"/>
        <circle cx="405" cy="185" r="1" fill="rgba(29, 185, 84, 0.4)"/>
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