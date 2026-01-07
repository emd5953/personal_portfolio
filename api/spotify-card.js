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
      return generateErrorCard('Missing Spotify credentials');
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
      return generateErrorCard('Token refresh failed');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Get recently played tracks
    const recentResponse = await fetch(
      'https://api.spotify.com/v1/me/player/recently-played?limit=50',
      {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }
    );

    if (!recentResponse.ok) {
      return generateErrorCard('Failed to fetch Spotify data');
    }

    const recentData = await recentResponse.json();
    const recentTracks = recentData.items || [];

    if (recentTracks.length === 0) {
      return generateErrorCard('No recent tracks found');
    }

    // Get last played
    const lastTrack = recentTracks[0].track;
    const lastPlayed = {
      name: lastTrack.name,
      artist: lastTrack.artists.map(a => a.name).join(', '),
      album: lastTrack.album.name,
      playedAt: recentTracks[0].played_at
    };

    // Count plays from today
    const today = new Date().toDateString();
    const trackCounts = {};
    
    recentTracks.forEach(item => {
      const playedDate = new Date(item.played_at).toDateString();
      if (playedDate === today) {
        const trackId = item.track.id;
        trackCounts[trackId] = (trackCounts[trackId] || 0) + 1;
      }
    });

    // Find most played today
    let mostPlayedToday = null;
    let maxCount = 0;
    
    Object.entries(trackCounts).forEach(([trackId, count]) => {
      if (count > maxCount) {
        maxCount = count;
        const trackItem = recentTracks.find(item => item.track.id === trackId);
        if (trackItem) {
          mostPlayedToday = {
            name: trackItem.track.name,
            artist: trackItem.track.artists.map(a => a.name).join(', '),
            playCount: count
          };
        }
      }
    });

    // Generate SVG card
    const svg = generateMusicCard(lastPlayed, mostPlayedToday);
    res.status(200).send(svg);

  } catch (error) {
    console.error('Spotify Card Error:', error);
    res.status(200).send(generateErrorCard('Error loading music data'));
  }

  function generateErrorCard(message) {
    return `
      <svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#1DB954;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#1ed760;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="400" height="200" fill="url(#bg)" rx="10"/>
        <text x="200" y="100" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="14" font-weight="bold">
          🎵 ${message}
        </text>
      </svg>
    `;
  }

  function generateMusicCard(lastPlayed, mostPlayedToday) {
    const timeAgo = getTimeAgo(lastPlayed.playedAt);
    
    return `<svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#1DB954;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#1ed760;stop-opacity:1" />
          </linearGradient>
          <filter id="shadow">
            <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.3"/>
          </filter>
        </defs>
        
        <!-- Background -->
        <rect width="400" height="200" fill="url(#bg)" rx="15" filter="url(#shadow)"/>
        
        <!-- Header -->
        <text x="20" y="30" fill="white" font-family="Arial, sans-serif" font-size="16" font-weight="bold">
          🎵 enrin's music
        </text>
        
        <!-- Last Played Section -->
        <text x="20" y="55" fill="rgba(255,255,255,0.8)" font-family="Arial, sans-serif" font-size="11" font-weight="bold">
          LAST PLAYED ${timeAgo.toUpperCase()}
        </text>
        
        <text x="20" y="75" fill="white" font-family="Arial, sans-serif" font-size="14" font-weight="bold">
          ${truncateText(lastPlayed.name, 35)}
        </text>
        
        <text x="20" y="92" fill="rgba(255,255,255,0.9)" font-family="Arial, sans-serif" font-size="12">
          ${truncateText(lastPlayed.artist, 40)}
        </text>
        
        <!-- Divider -->
        <line x1="20" y1="110" x2="380" y2="110" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
        
        <!-- Most Played Today Section -->
        ${mostPlayedToday ? `
        <text x="20" y="135" fill="rgba(255,255,255,0.8)" font-family="Arial, sans-serif" font-size="11" font-weight="bold">
          🔥 MOST PLAYED TODAY (${mostPlayedToday.playCount} PLAYS)
        </text>
        
        <text x="20" y="155" fill="white" font-family="Arial, sans-serif" font-size="14" font-weight="bold">
          ${truncateText(mostPlayedToday.name, 35)}
        </text>
        
        <text x="20" y="172" fill="rgba(255,255,255,0.9)" font-family="Arial, sans-serif" font-size="12">
          ${truncateText(mostPlayedToday.artist, 40)}
        </text>
        ` : `
        <text x="20" y="145" fill="rgba(255,255,255,0.8)" font-family="Arial, sans-serif" font-size="12">
          🔥 No repeated tracks today
        </text>
        `}
        
        <!-- Spotify Logo -->
        <circle cx="360" cy="40" r="15" fill="rgba(255,255,255,0.2)"/>
        <text x="360" y="45" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="12">♪</text>
        
        <!-- Live indicator -->
        <circle cx="360" cy="170" r="4" fill="#ff4444">
          <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite"/>
        </circle>
        <text x="350" y="185" fill="rgba(255,255,255,0.7)" font-family="Arial, sans-serif" font-size="10">LIVE</text>
      </svg>`;
  }

  function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
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