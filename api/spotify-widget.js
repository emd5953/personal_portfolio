// Helper functions
function escapeXml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDuration(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function getTimeAgo(timestamp) {
  const now = new Date();
  const played = new Date(timestamp);
  const diffMs = now - played;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return 'yesterday';
}

function truncateText(text, maxLength) {
  if (!text || text.length <= maxLength) return text || '';
  return text.substring(0, maxLength - 3) + '...';
}


export default async function handler(req, res) {
  // Set headers
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { SPOTIFY_CLIENT_ID: clientId, SPOTIFY_CLIENT_SECRET: clientSecret, SPOTIFY_REFRESH_TOKEN: refreshToken } = process.env;

    if (!clientId || !clientSecret || !refreshToken) {
      return res.status(200).send(generateErrorWidget('Missing Spotify credentials'));
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
      return res.status(200).send(generateErrorWidget('Token refresh failed'));
    }

    const { access_token: accessToken } = await tokenResponse.json();

    // Get user profile
    const userResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!userResponse.ok) {
      return res.status(200).send(generateErrorWidget('Failed to fetch user data'));
    }

    const { id: userId } = await userResponse.json();

    // Get recently played tracks for last played
    const recentResponse = await fetch(
      'https://api.spotify.com/v1/me/player/recently-played?limit=1',
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );

    let lastPlayed = null;

    if (recentResponse.ok) {
      const { items: recentTracks = [] } = await recentResponse.json();
      
      // Get last played track
      if (recentTracks[0]) {
        const track = recentTracks[0].track;
        lastPlayed = {
          name: track.name,
          artist: track.artists.map(a => a.name).join(', '),
          playedAt: recentTracks[0].played_at,
          duration: formatDuration(track.duration_ms)
        };
      }
    }

    // Get featured playlist
    const playlistsResponse = await fetch(
      `https://api.spotify.com/v1/users/${userId}/playlists?limit=50`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );

    let featuredPlaylist = null;
    if (playlistsResponse.ok) {
      const { items: playlists = [] } = await playlistsResponse.json();
      const userPlaylists = playlists.filter(playlist => playlist.owner.id === userId);

      if (userPlaylists.length > 0) {
        // Use date-based seeded random for consistent daily playlist
        const today = new Date();
        const dateString = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
        const seed = dateString.split('').reduce((a, b) => {
          a = ((a << 5) - a) + b.charCodeAt(0);
          return a & a;
        }, 0);
        
        const playlistIndex = Math.abs(seed) % userPlaylists.length;
        const playlist = userPlaylists[playlistIndex];
        
        featuredPlaylist = {
          name: playlist.name,
          tracks: playlist.tracks.total,
          creator: 'Enrin'
        };
      }
    }

    // Generate and send the widget
    const svg = generateSpotifyWidget(lastPlayed, featuredPlaylist);
    res.status(200).send(svg);

  } catch (error) {
    console.error('Spotify Widget Error:', error);
    res.status(200).send(generateErrorWidget('Error loading music data'));
  }
}

function generateErrorWidget(message) {
  return `<svg width="400" height="600" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <style>
        .error-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
      </style>
    </defs>
    
    <a href="https://enrindebbarma.vercel.app/pages/storyPage.html" target="_blank">
      <rect width="400" height="600" fill="#f8f9fa" rx="12" stroke="#e9ecef" stroke-width="1"/>
      <rect x="0" y="0" width="400" height="60" fill="#ffffff" rx="12"/>
      <rect x="0" y="48" width="400" height="12" fill="#ffffff"/>
      
      <text x="200" y="35" text-anchor="middle" fill="#1db954" class="error-text" font-size="16" font-weight="600">
        Spotify Widget
      </text>
      <text x="200" y="300" text-anchor="middle" fill="#6c757d" class="error-text" font-size="14">
        ${escapeXml(message)}
      </text>
      <text x="200" y="330" text-anchor="middle" fill="#6c757d" class="error-text" font-size="12">
        Click to view my story
      </text>
    </a>
  </svg>`;
}

function generateSpotifyWidget(lastPlayed, featuredPlaylist) {
  const timeAgo = lastPlayed ? getTimeAgo(lastPlayed.playedAt) : '';
  
  return `<svg width="320" height="200" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <style>
        .widget-text { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .title-text { font-family: 'Space Grotesk', 'Inter', sans-serif; }
      </style>
    </defs>
    
    <!-- Clickable background -->
    <a href="https://enrindebbarma.vercel.app/pages/storyPage.html" target="_blank">
      <!-- Main container -->
      <rect width="320" height="200" fill="#ffffff" rx="8" stroke="#e0e0e0" stroke-width="1"/>
      
      <!-- Header text -->
      <text x="160" y="15" text-anchor="middle" fill="#999999" class="widget-text" font-size="8" font-weight="500" letter-spacing="0.5px">
        LAST PLAYED (${timeAgo.toUpperCase()})
      </text>
      
      ${lastPlayed ? `
      <!-- Main track title -->
      <text x="160" y="35" text-anchor="middle" fill="#1a1a1a" class="title-text" font-size="14" font-weight="700">
        ${escapeXml(truncateText(lastPlayed.name, 14))}
      </text>
      
      <!-- Artist name -->
      <text x="160" y="48" text-anchor="middle" fill="#666666" class="widget-text" font-size="10" font-weight="400">
        ${escapeXml(truncateText(lastPlayed.artist, 18))}
      </text>
      ` : `
      <text x="160" y="40" text-anchor="middle" fill="#666666" class="widget-text" font-size="10">
        No recent tracks
      </text>
      `}
      
      <!-- Last Played Card -->
      <rect x="20" y="60" width="280" height="40" fill="#1a1a1a" rx="5"/>
      
      <!-- Album art -->
      <rect x="28" y="67" width="26" height="26" fill="#404040" rx="2"/>
      <text x="41" y="83" text-anchor="middle" fill="#1db954" class="widget-text" font-size="8">♪</text>
      
      <!-- Spotify logo -->
      <circle cx="285" cy="75" r="5" fill="#ffffff"/>
      <text x="285" y="78" text-anchor="middle" fill="#1a1a1a" class="widget-text" font-size="4" font-weight="bold">♪</text>
      
      ${lastPlayed ? `
      <!-- Track info -->
      <text x="62" y="77" fill="#ffffff" class="widget-text" font-size="9" font-weight="600">
        ${escapeXml(truncateText(lastPlayed.name, 22))}
      </text>
      
      <text x="62" y="86" fill="#b3b3b3" class="widget-text" font-size="7" font-weight="400">
        ${escapeXml(truncateText(lastPlayed.artist, 25))}
      </text>
      
      <!-- Duration -->
      <text x="220" y="82" fill="#b3b3b3" class="widget-text" font-size="6">
        ${lastPlayed.duration}
      </text>
      
      <!-- Play button -->
      <circle cx="250" cy="80" r="6" fill="#ffffff"/>
      <text x="250" y="83" text-anchor="middle" fill="#1a1a1a" class="widget-text" font-size="5">▶</text>
      ` : `
      <text x="62" y="82" fill="#b3b3b3" class="widget-text" font-size="9">
        No track available
      </text>
      `}
      
      <!-- Featured Playlists Section -->
      ${featuredPlaylist ? `
      <text x="160" y="125" text-anchor="middle" fill="#999999" class="widget-text" font-size="8" font-weight="400">
        featured playlists today
      </text>
      
      <text x="160" y="140" text-anchor="middle" fill="#666666" class="title-text" font-size="12" font-weight="600">
        ${escapeXml(truncateText(featuredPlaylist.name, 25))}
      </text>
      
      <text x="160" y="155" text-anchor="middle" fill="#999999" class="widget-text" font-size="8" font-weight="400">
        ${featuredPlaylist.tracks} tracks • Created by ${featuredPlaylist.creator}
      </text>
      ` : `
      <text x="160" y="140" text-anchor="middle" fill="#999999" class="widget-text" font-size="10" font-weight="400">
        No playlists available
      </text>
      `}
      
      <!-- Click hint with better styling -->
      <rect x="20" y="175" width="280" height="20" fill="#f8f9fa" rx="10" stroke="#e9ecef" stroke-width="1"/>
    </a>
  </svg>`;
}