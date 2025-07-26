// api/spotify.js - Updated to show only playlists YOU created
export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    
    const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
    const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
    const REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN;
    
    // Check if environment variables are set
    if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
        return res.status(500).json({ 
            error: 'Missing Spotify credentials',
            details: 'Please set SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, and SPOTIFY_REFRESH_TOKEN in Vercel environment variables'
        });
    }
    
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
        
        if (!tokenResponse.ok) {
            const errorData = await tokenResponse.json();
            console.error('Token error:', errorData);
            return res.status(500).json({ error: 'Failed to get access token', details: errorData });
        }
        
        const { access_token } = await tokenResponse.json();
        
        // Get current user info
        const userResponse = await fetch('https://api.spotify.com/v1/me', {
            headers: { 'Authorization': `Bearer ${access_token}` }
        });
        
        if (!userResponse.ok) {
            return res.status(500).json({ error: 'Failed to get user info' });
        }
        
        const userData = await userResponse.json();
        const userId = userData.id;
        
        // Get recently played tracks
        const recentResponse = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=50', {
            headers: { 'Authorization': `Bearer ${access_token}` }
        });
        
        if (!recentResponse.ok) {
            const errorData = await recentResponse.json();
            console.error('Recent tracks error:', errorData);
            return res.status(500).json({ error: 'Failed to get recent tracks', details: errorData });
        }
        
        const recentData = await recentResponse.json();
        
        // Calculate today's most played
        const today = new Date().toDateString();
        const todaysTracks = {};
        
        if (recentData.items && recentData.items.length > 0) {
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
        }
        
        // Get most played track (today's or most recent)
        let mostPlayed;
        const todaysTracksList = Object.values(todaysTracks);
        
        if (todaysTracksList.length > 0) {
            // If we have today's tracks, get the most played
            mostPlayed = todaysTracksList.sort((a, b) => b.count - a.count)[0];
        } else if (recentData.items && recentData.items.length > 0) {
            // Otherwise, get the most recent track
            mostPlayed = { 
                track: recentData.items[0].track, 
                count: 1 
            };
        } else {
            // No tracks available
            mostPlayed = null;
        }
        
        // Get user's playlists
        const playlistsResponse = await fetch('https://api.spotify.com/v1/me/playlists?limit=50', {
            headers: { 'Authorization': `Bearer ${access_token}` }
        });
        
        let selectedPlaylists = [];
        
        if (playlistsResponse.ok) {
            const playlistsData = await playlistsResponse.json();
            
            if (playlistsData.items && playlistsData.items.length > 0) {
                // Filter only playlists created by YOU (not followed playlists)
                const myPlaylists = playlistsData.items.filter(p => 
                    p.owner.id === userId && // Only playlists you own
                    p.public // Only public playlists
                );
                
                console.log(`Found ${myPlaylists.length} playlists created by ${userId}`);
                
                // Randomly select 3 of your own playlists
                const shuffled = myPlaylists.sort(() => Math.random() - 0.5);
                selectedPlaylists = shuffled.slice(0, 3);
                
                // If you have fewer than 3 playlists, just use what's available
                if (selectedPlaylists.length === 0) {
                    console.log('No public playlists found created by you');
                }
            }
        }
        
        // Build response
        const response = {
            mostPlayed: mostPlayed ? {
                trackId: mostPlayed.track.id,
                name: mostPlayed.track.name,
                artist: mostPlayed.track.artists[0].name,
                playCount: mostPlayed.count,
                album: mostPlayed.track.album.name,
                image: mostPlayed.track.album.images[0]?.url
            } : null,
            playlists: selectedPlaylists.map(p => ({
                id: p.id,
                name: p.name,
                tracks: p.tracks.total,
                image: p.images[0]?.url,
                owner: p.owner.display_name || p.owner.id
            })),
            userId: userId,
            playlistsFound: selectedPlaylists.length,
            lastUpdated: new Date().toISOString()
        };
        
        // Cache for 5 minutes
        res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
        res.status(200).json(response);
        
    } catch (error) {
        console.error('Spotify API error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch Spotify data', 
            message: error.message 
        });
    }
}