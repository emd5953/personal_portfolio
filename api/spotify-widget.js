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

function getTodayBounds() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
  return { todayStart, todayEnd };
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

    // Get top track from recent listening (short-term = ~4 weeks)
    const topTracksResponse = await fetch(
      'https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=1',
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );

    let topTrackRecent = null;

    if (topTracksResponse.ok) {
      const { items: topTracks = [] } = await topTracksResponse.json();
      
      if (topTracks[0]) {
        const track = topTracks[0];
        topTrackRecent = {
          name: track.name,
          artist: track.artists.map(a => a.name).join(', '),
          duration: formatDuration(track.duration_ms),
          popularity: track.popularity
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
    const svg = generateSpotifyWidget(lastPlayed, topTrackRecent, featuredPlaylist);
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

function generateSpotifyWidget(lastPlayed, topTrackRecent, featuredPlaylist) {
  const timeAgo = lastPlayed ? getTimeAgo(lastPlayed.playedAt) : '';
  
  return `<svg width="250" height="260" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <style>
        .widget-text { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .title-text { font-family: 'Space Grotesk', 'Inter', sans-serif; }
      </style>
    </defs>
    
    <!-- Clickable background -->
    <a href="https://enrindebbarma.vercel.app/pages/storyPage.html" target="_blank">
      <!-- Main container -->
      <rect width="250" height="260" fill="#ffffff" rx="8" stroke="#e0e0e0" stroke-width="1"/>
      
      <!-- Header text -->
      <text x="125" y="15" text-anchor="middle" fill="#999999" class="widget-text" font-size="8" font-weight="500" letter-spacing="0.5px">
        LAST PLAYED (${timeAgo.toUpperCase()})
      </text>
      
      ${lastPlayed ? `
      <!-- Main track title -->
      <text x="125" y="35" text-anchor="middle" fill="#1a1a1a" class="title-text" font-size="14" font-weight="700">
        ${escapeXml(truncateText(lastPlayed.name, 14))}
      </text>
      
      <!-- Artist name -->
      <text x="125" y="48" text-anchor="middle" fill="#666666" class="widget-text" font-size="10" font-weight="400">
        ${escapeXml(truncateText(lastPlayed.artist, 18))}
      </text>
      ` : `
      <text x="125" y="40" text-anchor="middle" fill="#666666" class="widget-text" font-size="10">
        No recent tracks
      </text>
      `}
      
      <!-- Last Played Card -->
      <rect x="15" y="60" width="220" height="40" fill="#1a1a1a" rx="5"/>
      
      <!-- Album art -->
      <rect x="22" y="67" width="26" height="26" fill="#404040" rx="2"/>
      <text x="35" y="83" text-anchor="middle" fill="#1db954" class="widget-text" font-size="8">♪</text>
      
      <!-- Spotify logo -->
      <circle cx="225" cy="75" r="5" fill="#ffffff"/>
      <text x="225" y="78" text-anchor="middle" fill="#1a1a1a" class="widget-text" font-size="4" font-weight="bold">♪</text>
      
      ${lastPlayed ? `
      <!-- Track info -->
      <text x="55" y="77" fill="#ffffff" class="widget-text" font-size="9" font-weight="600">
        ${escapeXml(truncateText(lastPlayed.name, 16))}
      </text>
      
      <text x="55" y="86" fill="#b3b3b3" class="widget-text" font-size="7" font-weight="400">
        ${escapeXml(truncateText(lastPlayed.artist, 18))}
      </text>
      
      <!-- Duration -->
      <text x="170" y="82" fill="#b3b3b3" class="widget-text" font-size="6">
        ${lastPlayed.duration}
      </text>
      
      <!-- Play button -->
      <circle cx="200" cy="80" r="6" fill="#ffffff"/>
      <text x="200" y="83" text-anchor="middle" fill="#1a1a1a" class="widget-text" font-size="5">▶</text>
      ` : `
      <text x="55" y="82" fill="#b3b3b3" class="widget-text" font-size="9">
        No track available
      </text>
      `}
      
      <!-- Top Track Recent Section -->
      <text x="125" y="125" text-anchor="middle" fill="#666666" class="widget-text" font-size="10" font-weight="600">
        Top Track Recently
      </text>
      
      <!-- Top Track Card -->
      <rect x="15" y="135" width="220" height="40" fill="#1a1a1a" rx="5"/>
      
      <!-- Album art -->
      <rect x="22" y="142" width="26" height="26" fill="#8B4513" rx="2"/>
      <text x="35" y="158" text-anchor="middle" fill="#ff6b35" class="widget-text" font-size="8">♪</text>
      
      <!-- Spotify logo -->
      <circle cx="225" cy="150" r="5" fill="#ffffff"/>
      <text x="225" y="153" text-anchor="middle" fill="#1a1a1a" class="widget-text" font-size="4" font-weight="bold">♪</text>
      
      ${topTrackRecent ? `
      <text x="55" y="152" fill="#ffffff" class="widget-text" font-size="9" font-weight="600">
        ${escapeXml(truncateText(topTrackRecent.name, 16))}
      </text>
      
      <text x="55" y="161" fill="#b3b3b3" class="widget-text" font-size="7" font-weight="400">
        ${escapeXml(truncateText(topTrackRecent.artist, 18))}
      </text>
      
      <!-- Duration -->
      <text x="170" y="157" fill="#b3b3b3" class="widget-text" font-size="6">
        ${topTrackRecent.duration}
      </text>
      
      <!-- Play button -->
      <circle cx="200" cy="155" r="6" fill="#ffffff"/>
      <text x="200" y="158" text-anchor="middle" fill="#1a1a1a" class="widget-text" font-size="5">▶</text>
      ` : `
      <text x="55" y="157" fill="#b3b3b3" class="widget-text" font-size="9">
        No top tracks available
      </text>
      `}
      
      <!-- Featured Playlists Section -->
      <text x="125" y="195" text-anchor="middle" fill="#999999" class="widget-text" font-size="8" font-weight="400">
        featured playlists today
      </text>
      
      <text x="125" y="210" text-anchor="middle" fill="#666666" class="title-text" font-size="12" font-weight="600">
        ${featuredPlaylist ? escapeXml(truncateText(featuredPlaylist.name, 18)) : 'japanese folk'}
      </text>
      
      <text x="125" y="225" text-anchor="middle" fill="#999999" class="widget-text" font-size="8" font-weight="400">
        ${featuredPlaylist ? `${featuredPlaylist.tracks} tracks • Created by ${featuredPlaylist.creator}` : '14 tracks • Created by me'}
      </text>
      
      <!-- Click hint with better styling -->
      <rect x="15" y="235" width="220" height="20" fill="#f8f9fa" rx="10" stroke="#e9ecef" stroke-width="1"/>
    </a>
  </svg>`;
}