// api/spotify.js - Place this in your project's api folder
export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
    const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
    const REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN;
    
    try {
        // Get access token using refresh token
        const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64')
            },
            body: `grant_type=refresh_token&refresh_token=${REFRESH_TOKEN}`
        });
        
        const { access_token } = await tokenResponse.json();
        
        // Get recently played tracks
        const recentResponse = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=50', {
            headers: { 'Authorization': `Bearer ${access_token}` }
        });
        
        const recentData = await recentResponse.json();
        
        // Calculate today's most played
        const today = new Date().toDateString();
        const todaysTracks = {};
        
        recentData.items.forEach(item => {
            if (new Date(item.played_at).toDateString() === today) {
                const trackId = item.track.id;
                if (!todaysTracks[trackId]) {
                    todaysTracks[trackId] = {
                        track: item.track,
                        count: 0
                    };
                }
                todaysTracks[trackId].count++;
            }
        });
        
        // Get most played track
        const mostPlayed = Object.values(todaysTracks)
            .sort((a, b) => b.count - a.count)[0] || 
            { track: recentData.items[0]?.track, count: 1 };
        
        // Get user's playlists
        const playlistsResponse = await fetch('https://api.spotify.com/v1/me/playlists?limit=50', {
            headers: { 'Authorization': `Bearer ${access_token}` }
        });
        
        const playlistsData = await playlistsResponse.json();
        
        // Filter only public playlists and select 3 random ones
        const publicPlaylists = playlistsData.items.filter(p => p.public);
        const shuffled = publicPlaylists.sort(() => Math.random() - 0.5);
        const selectedPlaylists = shuffled.slice(0, 3);
        
        res.status(200).json({
            mostPlayed: {
                trackId: mostPlayed.track.id,
                name: mostPlayed.track.name,
                artist: mostPlayed.track.artists[0].name,
                playCount: mostPlayed.count
            },
            playlists: selectedPlaylists.map(p => ({
                id: p.id,
                name: p.name
            }))
        });
        
    } catch (error) {
        console.error('Spotify API error:', error);
        res.status(500).json({ error: 'Failed to fetch Spotify data' });
    }
}

// ===== SETUP INSTRUCTIONS =====
/*
1. Create a Spotify App:
   - Go to https://developer.spotify.com/dashboard
   - Create an app
   - Add https://your-site.vercel.app/callback as redirect URI
   - Copy Client ID and Client Secret

2. Get your refresh token (one-time setup):
   OPTION A - Use the online tool (easiest):
   - Go to: https://spotify-refresh-token.herokuapp.com/
   - Follow the instructions there
   
   OPTION B - Use your own domain:
   - Visit this URL in your browser (replace YOUR_CLIENT_ID and YOUR_DOMAIN):
     https://accounts.spotify.com/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=https://YOUR_DOMAIN/callback&scope=user-read-recently-played,playlist-read-private
   
   - After authorizing, you'll get a code in the URL
   - Exchange it for a refresh token using Postman or curl

3. Add to Vercel Environment Variables:
   - Go to your Vercel project settings
   - Add these environment variables:
     SPOTIFY_CLIENT_ID = your_client_id
     SPOTIFY_CLIENT_SECRET = your_client_secret  
     SPOTIFY_REFRESH_TOKEN = your_refresh_token

4. Deploy to Vercel

5. Your API will be available at:
   https://your-site.vercel.app/api/spotify
*/