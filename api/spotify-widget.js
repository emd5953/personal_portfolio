export default async function handler(req, res) {
  // Set headers for SVG with click functionality
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  // Add CORS headers
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

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Get user profile
    const userResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!userResponse.ok) {
      return res.status(200).send(generateErrorWidget('Failed to fetch user data'));
    }

    const userData = await userResponse.json();
    const userId = userData.id;

    // Get recently played tracks
    const recentResponse = await fetch(
      'https://api.spotify.com/v1/me/player/recently-played?limit=50',
      {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }
    );

    let lastPlayed = null;
    let mostPlayedToday = null;

    if (recentResponse.ok) {
      const recentData = await recentResponse.json();
      const recentTracks = recentData.items || [];
      
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

      // Calculate today's most played track
      const trackCounts = {};
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Start of today in local time
      
      recentTracks.forEach(item => {
        const playedTime = new Date(item.played_at);
        // Only count plays from today (after midnight local time)
        if (playedTime >= todayStart) {
          const trackId = item.track.id;
          if (!trackCounts[trackId]) {
            trackCounts[trackId] = {
              count: 0,
              track: item.track
            };
          }
          trackCounts[trackId].count++;
        }
      });
      
      let maxCount = 0;
      let mostPlayedTrack = null;
      
      Object.values(trackCounts).forEach(({ count, track }) => {
        if (count > maxCount) {
          maxCount = count;
          mostPlayedTrack = track;
        }
      });
      
      if (mostPlayedTrack && maxCount > 0) {
        mostPlayedToday = {
          name: mostPlayedTrack.name,
          artist: mostPlayedTrack.artists.map(a => a.name).join(', '),
          playCount: maxCount,
          duration: formatDuration(mostPlayedTrack.duration_ms)
        };
      }
    }

    // Get featured playlist
    const playlistsResponse = await fetch(
      `https://api.spotify.com/v1/users/${userId}/playlists?limit=50`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }
    );

    let featuredPlaylist = null;
    if (playlistsResponse.ok) {
      const playlistsData = await playlistsResponse.json();
      const userPlaylists = playlistsData.items.filter(playlist => 
        playlist.owner.id === userId
      );

      if (userPlaylists.length > 0) {
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

    // Generate the widget SVG
    const svg = generateSpotifyWidget(lastPlayed, mostPlayedToday, featuredPlaylist);
    res.status(200).send(svg);

  } catch (error) {
    console.error('Spotify Widget Error:', error);
    res.status(200).send(generateErrorWidget('Error loading music data'));
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

  function generateErrorWidget(message) {
    return `<svg width="400" height="600" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          .error-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        </style>
      </defs>
      
      <!-- Clickable background -->
      <a href="https://enrindebbarma.vercel.app/pages/storyPage.html" target="_blank">
        <rect width="400" height="600" fill="#f8f9fa" rx="12" stroke="#e9ecef" stroke-width="1"/>
        
        <!-- Header -->
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

  function generateSpotifyWidget(lastPlayed, mostPlayedToday, featuredPlaylist) {
    const timeAgo = lastPlayed ? getTimeAgo(lastPlayed.playedAt) : '';
    
    return `<svg width="350" height="400" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          .widget-text { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
          .title-text { font-family: 'Space Grotesk', 'Inter', sans-serif; }
        </style>
      </defs>
      
      <!-- Clickable background -->
      <a href="https://enrindebbarma.vercel.app/pages/storyPage.html" target="_blank">
        <!-- Main container with rounded corners and border -->
        <rect width="350" height="400" fill="#ffffff" rx="12" stroke="#e0e0e0" stroke-width="1"/>
        
        <!-- Header text -->
        <text x="175" y="25" text-anchor="middle" fill="#999999" class="widget-text" font-size="10" font-weight="500" letter-spacing="1px">
          LAST PLAYED (${timeAgo.toUpperCase()})
        </text>
        
        ${lastPlayed ? `
        <!-- Main track title -->
        <text x="175" y="55" text-anchor="middle" fill="#1a1a1a" class="title-text" font-size="22" font-weight="700">
          ${escapeXml(truncateText(lastPlayed.name, 18))}
        </text>
        
        <!-- Artist name -->
        <text x="175" y="75" text-anchor="middle" fill="#666666" class="widget-text" font-size="14" font-weight="400">
          ${escapeXml(truncateText(lastPlayed.artist, 22))}
        </text>
        
        <!-- Album info -->
        <text x="175" y="90" text-anchor="middle" fill="#999999" class="widget-text" font-size="10" font-weight="400">
          FROM 沈黙の恋人
        </text>
        ` : `
        <text x="175" y="65" text-anchor="middle" fill="#666666" class="widget-text" font-size="14">
          No recent tracks
        </text>
        `}
        
        <!-- "Last Played" section label -->
        <text x="175" y="125" text-anchor="middle" fill="#666666" class="widget-text" font-size="14" font-weight="600">
          Last Played
        </text>
        
        <!-- Last Played Card -->
        <rect x="25" y="135" width="300" height="60" fill="#1a1a1a" rx="8"/>
        
        <!-- Album art -->
        <rect x="35" y="145" width="35" height="35" fill="#404040" rx="3"/>
        <text x="52.5" y="167" text-anchor="middle" fill="#1db954" class="widget-text" font-size="12">♪</text>
        
        <!-- Spotify logo -->
        <circle cx="305" cy="155" r="8" fill="#ffffff"/>
        <text x="305" y="159" text-anchor="middle" fill="#1a1a1a" class="widget-text" font-size="6" font-weight="bold">♪</text>
        
        ${lastPlayed ? `
        <!-- Track info in card -->
        <text x="80" y="160" fill="#ffffff" class="widget-text" font-size="12" font-weight="600">
          ${escapeXml(truncateText(lastPlayed.name, 20))}
        </text>
        
        <text x="80" y="172" fill="#b3b3b3" class="widget-text" font-size="10" font-weight="400">
          ${escapeXml(truncateText(lastPlayed.artist, 22))}
        </text>
        
        <!-- Save on Spotify with plus icon -->
        <circle cx="85" cy="182" r="5" fill="transparent" stroke="#b3b3b3" stroke-width="1"/>
        <text x="85" y="185" text-anchor="middle" fill="#b3b3b3" class="widget-text" font-size="6">+</text>
        <text x="95" y="185" fill="#b3b3b3" class="widget-text" font-size="8" font-weight="400">
          Save on Spotify
        </text>
        
        <!-- Progress bar -->
        <rect x="180" y="180" width="60" height="1.5" fill="#404040" rx="0.75"/>
        <rect x="180" y="180" width="18" height="1.5" fill="#b3b3b3" rx="0.75"/>
        
        <!-- Duration -->
        <text x="250" y="184" fill="#b3b3b3" class="widget-text" font-size="8">
          ${lastPlayed.duration}
        </text>
        
        <!-- More options -->
        <text x="270" y="162" fill="#b3b3b3" class="widget-text" font-size="10">⋯</text>
        
        <!-- Play button -->
        <circle cx="285" cy="162" r="10" fill="#ffffff"/>
        <text x="285" y="166" text-anchor="middle" fill="#1a1a1a" class="widget-text" font-size="8">▶</text>
        ` : `
        <text x="80" y="167" fill="#b3b3b3" class="widget-text" font-size="12">
          No track available
        </text>
        `}
        
        <!-- Most Played Today Section -->
        <text x="175" y="225" text-anchor="middle" fill="#666666" class="widget-text" font-size="14" font-weight="600">
          Most Played Today ${mostPlayedToday ? `(${mostPlayedToday.playCount} plays)` : ''}
        </text>
        
        <!-- Most Played Card -->
        <rect x="25" y="235" width="300" height="60" fill="#1a1a1a" rx="8"/>
        
        <!-- Album art with different color -->
        <rect x="35" y="245" width="35" height="35" fill="#8B4513" rx="3"/>
        <text x="52.5" y="267" text-anchor="middle" fill="#ff6b35" class="widget-text" font-size="12">♪</text>
        
        <!-- Spotify logo -->
        <circle cx="305" cy="255" r="8" fill="#ffffff"/>
        <text x="305" y="259" text-anchor="middle" fill="#1a1a1a" class="widget-text" font-size="6" font-weight="bold">♪</text>
        
        ${mostPlayedToday ? `
        <text x="80" y="260" fill="#ffffff" class="widget-text" font-size="12" font-weight="600">
          ${escapeXml(truncateText(mostPlayedToday.name, 20))}
        </text>
        
        <text x="80" y="272" fill="#b3b3b3" class="widget-text" font-size="10" font-weight="400">
          ${escapeXml(truncateText(mostPlayedToday.artist, 22))}
        </text>
        
        <!-- Save on Spotify -->
        <circle cx="85" cy="282" r="5" fill="transparent" stroke="#b3b3b3" stroke-width="1"/>
        <text x="85" y="285" text-anchor="middle" fill="#b3b3b3" class="widget-text" font-size="6">+</text>
        <text x="95" y="285" fill="#b3b3b3" class="widget-text" font-size="8" font-weight="400">
          Save on Spotify
        </text>
        
        <!-- Progress bar -->
        <rect x="180" y="280" width="60" height="1.5" fill="#404040" rx="0.75"/>
        <rect x="180" y="280" width="24" height="1.5" fill="#b3b3b3" rx="0.75"/>
        
        <!-- Duration -->
        <text x="250" y="284" fill="#b3b3b3" class="widget-text" font-size="8">
          ${mostPlayedToday.duration}
        </text>
        
        <!-- More options -->
        <text x="270" y="262" fill="#b3b3b3" class="widget-text" font-size="10">⋯</text>
        
        <!-- Play button -->
        <circle cx="285" cy="262" r="10" fill="#ffffff"/>
        <text x="285" y="266" text-anchor="middle" fill="#1a1a1a" class="widget-text" font-size="8">▶</text>
        ` : `
        <text x="80" y="267" fill="#b3b3b3" class="widget-text" font-size="12">
          No tracks played multiple times today
        </text>
        `}
        
        <!-- Featured Playlists Section -->
        <text x="175" y="325" text-anchor="middle" fill="#999999" class="widget-text" font-size="10" font-weight="400">
          featured playlists today
        </text>
        
        <text x="175" y="345" text-anchor="middle" fill="#666666" class="title-text" font-size="16" font-weight="600">
          ${featuredPlaylist ? escapeXml(truncateText(featuredPlaylist.name, 22)) : 'japanese folk'}
        </text>
        
        <text x="175" y="360" text-anchor="middle" fill="#999999" class="widget-text" font-size="10" font-weight="400">
          ${featuredPlaylist ? `${featuredPlaylist.tracks} tracks • Created by ${featuredPlaylist.creator}` : '14 tracks • Created by me'}
        </text>
        
        <!-- Click hint -->
        <text x="175" y="385" text-anchor="middle" fill="#999999" class="widget-text" font-size="9" font-weight="400">
          Click to explore my story →
        </text>
      </a>
    </svg>`;
  }
}