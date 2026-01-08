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
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      recentTracks.forEach(item => {
        const playedTime = new Date(item.played_at);
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
    
    return `<svg width="400" height="500" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          .widget-text { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
          .title-text { font-family: 'Space Grotesk', 'Inter', sans-serif; }
        </style>
      </defs>
      
      <!-- Clickable background -->
      <a href="https://enrindebbarma.vercel.app/pages/storyPage.html" target="_blank">
        <!-- Main container with rounded corners and border -->
        <rect width="400" height="500" fill="#ffffff" rx="16" stroke="#e0e0e0" stroke-width="1"/>
        
        <!-- Header text -->
        <text x="200" y="35" text-anchor="middle" fill="#999999" class="widget-text" font-size="12" font-weight="500" letter-spacing="1px">
          LAST PLAYED (${timeAgo.toUpperCase()})
        </text>
        
        ${lastPlayed ? `
        <!-- Main track title -->
        <text x="200" y="75" text-anchor="middle" fill="#1a1a1a" class="title-text" font-size="28" font-weight="700">
          ${escapeXml(truncateText(lastPlayed.name, 20))}
        </text>
        
        <!-- Artist name -->
        <text x="200" y="100" text-anchor="middle" fill="#666666" class="widget-text" font-size="16" font-weight="400">
          ${escapeXml(truncateText(lastPlayed.artist, 25))}
        </text>
        
        <!-- Album info -->
        <text x="200" y="120" text-anchor="middle" fill="#999999" class="widget-text" font-size="12" font-weight="400">
          FROM 沈黙の恋人
        </text>
        ` : `
        <text x="200" y="85" text-anchor="middle" fill="#666666" class="widget-text" font-size="16">
          No recent tracks
        </text>
        `}
        
        <!-- "Last Played" section label -->
        <text x="200" y="165" text-anchor="middle" fill="#666666" class="widget-text" font-size="16" font-weight="600">
          Last Played
        </text>
        
        <!-- Last Played Card -->
        <rect x="30" y="180" width="340" height="70" fill="#1a1a1a" rx="12"/>
        
        <!-- Album art -->
        <rect x="45" y="195" width="40" height="40" fill="#404040" rx="4"/>
        <text x="65" y="220" text-anchor="middle" fill="#1db954" class="widget-text" font-size="14">♪</text>
        
        <!-- Spotify logo -->
        <circle cx="350" cy="205" r="10" fill="#ffffff"/>
        <text x="350" y="210" text-anchor="middle" fill="#1a1a1a" class="widget-text" font-size="8" font-weight="bold">♪</text>
        
        ${lastPlayed ? `
        <!-- Track info in card -->
        <text x="95" y="210" fill="#ffffff" class="widget-text" font-size="14" font-weight="600">
          ${escapeXml(truncateText(lastPlayed.name, 22))}
        </text>
        
        <text x="95" y="225" fill="#b3b3b3" class="widget-text" font-size="12" font-weight="400">
          ${escapeXml(truncateText(lastPlayed.artist, 25))}
        </text>
        
        <!-- Save on Spotify with plus icon -->
        <circle cx="105" cy="235" r="6" fill="transparent" stroke="#b3b3b3" stroke-width="1"/>
        <text x="105" y="239" text-anchor="middle" fill="#b3b3b3" class="widget-text" font-size="8">+</text>
        <text x="120" y="239" fill="#b3b3b3" class="widget-text" font-size="10" font-weight="400">
          Save on Spotify
        </text>
        
        <!-- Progress bar -->
        <rect x="200" y="232" width="80" height="2" fill="#404040" rx="1"/>
        <rect x="200" y="232" width="24" height="2" fill="#b3b3b3" rx="1"/>
        
        <!-- Duration -->
        <text x="290" y="238" fill="#b3b3b3" class="widget-text" font-size="10">
          ${lastPlayed.duration}
        </text>
        
        <!-- More options -->
        <text x="310" y="215" fill="#b3b3b3" class="widget-text" font-size="12">⋯</text>
        
        <!-- Play button -->
        <circle cx="325" cy="215" r="12" fill="#ffffff"/>
        <text x="325" y="220" text-anchor="middle" fill="#1a1a1a" class="widget-text" font-size="10">▶</text>
        ` : `
        <text x="95" y="220" fill="#b3b3b3" class="widget-text" font-size="14">
          No track available
        </text>
        `}
        
        <!-- Most Played Today Section -->
        <text x="200" y="285" text-anchor="middle" fill="#666666" class="widget-text" font-size="16" font-weight="600">
          Most Played Today ${mostPlayedToday ? `(${mostPlayedToday.playCount} plays)` : ''}
        </text>
        
        <!-- Most Played Card -->
        <rect x="30" y="300" width="340" height="70" fill="#1a1a1a" rx="12"/>
        
        <!-- Album art with different color -->
        <rect x="45" y="315" width="40" height="40" fill="#8B4513" rx="4"/>
        <text x="65" y="340" text-anchor="middle" fill="#ff6b35" class="widget-text" font-size="14">♪</text>
        
        <!-- Spotify logo -->
        <circle cx="350" cy="325" r="10" fill="#ffffff"/>
        <text x="350" y="330" text-anchor="middle" fill="#1a1a1a" class="widget-text" font-size="8" font-weight="bold">♪</text>
        
        ${mostPlayedToday ? `
        <text x="95" y="330" fill="#ffffff" class="widget-text" font-size="14" font-weight="600">
          ${escapeXml(truncateText(mostPlayedToday.name, 22))}
        </text>
        
        <text x="95" y="345" fill="#b3b3b3" class="widget-text" font-size="12" font-weight="400">
          ${escapeXml(truncateText(mostPlayedToday.artist, 25))}
        </text>
        
        <!-- Save on Spotify -->
        <circle cx="105" cy="355" r="6" fill="transparent" stroke="#b3b3b3" stroke-width="1"/>
        <text x="105" y="359" text-anchor="middle" fill="#b3b3b3" class="widget-text" font-size="8">+</text>
        <text x="120" y="359" fill="#b3b3b3" class="widget-text" font-size="10" font-weight="400">
          Save on Spotify
        </text>
        
        <!-- Progress bar -->
        <rect x="200" y="352" width="80" height="2" fill="#404040" rx="1"/>
        <rect x="200" y="352" width="32" height="2" fill="#b3b3b3" rx="1"/>
        
        <!-- Duration -->
        <text x="290" y="358" fill="#b3b3b3" class="widget-text" font-size="10">
          ${mostPlayedToday.duration}
        </text>
        
        <!-- More options -->
        <text x="310" y="335" fill="#b3b3b3" class="widget-text" font-size="12">⋯</text>
        
        <!-- Play button -->
        <circle cx="325" cy="335" r="12" fill="#ffffff"/>
        <text x="325" y="340" text-anchor="middle" fill="#1a1a1a" class="widget-text" font-size="10">▶</text>
        ` : `
        <text x="95" y="340" fill="#b3b3b3" class="widget-text" font-size="14">
          No tracks played multiple times today
        </text>
        `}
        
        <!-- Featured Playlists Section -->
        <text x="200" y="405" text-anchor="middle" fill="#999999" class="widget-text" font-size="12" font-weight="400">
          featured playlists today
        </text>
        
        <text x="200" y="430" text-anchor="middle" fill="#666666" class="title-text" font-size="20" font-weight="600">
          ${featuredPlaylist ? escapeXml(truncateText(featuredPlaylist.name, 25)) : 'japanese folk'}
        </text>
        
        <text x="200" y="450" text-anchor="middle" fill="#999999" class="widget-text" font-size="12" font-weight="400">
          ${featuredPlaylist ? `${featuredPlaylist.tracks} tracks • Created by ${featuredPlaylist.creator}` : '14 tracks • Created by me'}
        </text>
        
        <!-- Click hint -->
        <text x="200" y="485" text-anchor="middle" fill="#999999" class="widget-text" font-size="11" font-weight="400">
          Click to explore my story →
        </text>
      </a>
    </svg>`;
  }
}