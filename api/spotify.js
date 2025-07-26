// api/spotify.js - Updated with more accurate play counting
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
    
    // Helper function to fetch extended history
    async function getExtendedHistory(access_token) {
        let allTracks = [];
        let after = null;
        const today = new Date().toDateString();
        
        // Fetch up to 5 pages (250 tracks total)
        for (let i = 0; i < 5; i++) {
            const url = after 
                ? `https://api.spotify.com/v1/me/player/recently-played?limit=50&after=${after}`
                : 'https://api.spotify.com/v1/me/player/recently-played?limit=50';
                
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${access_token}` }
            });
            
            if (!response.ok) {
                console.error(`Failed to fetch page ${i + 1} of history`);
                break;
            }
            
            const data = await response.json();
            if (!data.items || data.items.length === 0) break;
            
            // Add tracks to our collection
            allTracks = [...allTracks, ...data.items];
            
            // Check if we've gone past today
            const oldestTrack = data.items[data.items.length - 1];
            const oldestDate = new Date(oldestTrack.played_at).toDateString();
            
            if (oldestDate !== today) {
                console.log(`Reached tracks from ${oldestDate}, stopping fetch`);
                // Filter to only include today's tracks from this batch
                allTracks = allTracks.filter(item => 
                    new Date(item.played_at).toDateString() === today
                );
                break;
            }
            
            // Get cursor for next page
            after = data.cursors?.after;
            if (!after) break;
        }
        
        console.log(`Fetched ${allTracks.length} tracks from today`);
        return allTracks;
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
        
        // Get extended history for accurate counts
        const allRecentTracks = await getExtendedHistory(access_token);
        
        // Calculate today's most played with better accuracy
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const todaysTracks = {};
        
        allRecentTracks.forEach(item => {
            const playedAt = new Date(item.played_at);
            
            // Only count if played after today's start
            if (playedAt >= todayStart) {
                const trackId = item.track.id;
                if (!todaysTracks[trackId]) {
                    todaysTracks[trackId] = {
                        track: item.track,
                        count: 0,
                        plays: [] // Store play times for debugging
                    };
                }
                todaysTracks[trackId].count++;
                todaysTracks[trackId].plays.push(playedAt);
            }
        });
        
        // Get most played track with additional stats
        let mostPlayed = null;
        const todaysTracksList = Object.values(todaysTracks);
        
        if (todaysTracksList.length > 0) {
            // Sort by play count
            mostPlayed = todaysTracksList.sort((a, b) => b.count - a.count)[0];
            
            // Calculate listening pattern
            const firstPlay = new Date(Math.min(...mostPlayed.plays.map(d => d.getTime())));
            const lastPlay = new Date(Math.max(...mostPlayed.plays.map(d => d.getTime())));
            const timeSpan = lastPlay - firstPlay;
            const hoursSpan = Math.round(timeSpan / 3600000 * 10) / 10; // Round to 1 decimal
            
            console.log(`Most played: "${mostPlayed.track.name}" - ${mostPlayed.count} plays over ${hoursSpan} hours`);
            
            // Add extra stats to mostPlayed
            mostPlayed.stats = {
                firstPlayToday: firstPlay.toLocaleTimeString(),
                lastPlayToday: lastPlay.toLocaleTimeString(),
                hoursSpan: hoursSpan
            };
        } else if (allRecentTracks.length > 0) {
            // Fallback to most recent track if no plays today
            mostPlayed = { 
                track: allRecentTracks[0].track, 
                count: 1,
                stats: {
                    firstPlayToday: new Date(allRecentTracks[0].played_at).toLocaleTimeString(),
                    lastPlayToday: new Date(allRecentTracks[0].played_at).toLocaleTimeString(),
                    hoursSpan: 0
                }
            };
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
                
                // Daily rotation based on date seed
                const dailySeed = new Date().toDateString().split('').reduce((a, b) => {
                    return ((a << 5) - a) + b.charCodeAt(0);
                }, 0);
                
                // Consistently shuffle based on daily seed
                const shuffled = [...myPlaylists].sort((a, b) => {
                    const seedA = Math.sin(dailySeed + a.id.charCodeAt(0)) * 10000;
                    const seedB = Math.sin(dailySeed + b.id.charCodeAt(0)) * 10000;
                    return (seedA - Math.floor(seedA)) - (seedB - Math.floor(seedB));
                });
                
                selectedPlaylists = shuffled.slice(0, 3);
                
                if (selectedPlaylists.length === 0) {
                    console.log('No public playlists found created by you');
                }
            }
        }
        
        // Build response with debug info
        const response = {
            mostPlayed: mostPlayed ? {
                trackId: mostPlayed.track.id,
                name: mostPlayed.track.name,
                artist: mostPlayed.track.artists[0].name,
                playCount: mostPlayed.count,
                album: mostPlayed.track.album.name,
                image: mostPlayed.track.album.images[0]?.url,
                // Include timing stats
                firstPlayedToday: mostPlayed.stats.firstPlayToday,
                lastPlayedToday: mostPlayed.stats.lastPlayToday,
                listeningSpan: `${mostPlayed.stats.hoursSpan} hours`
            } : null,
            playlists: selectedPlaylists.map(p => ({
                id: p.id,
                name: p.name,
                tracks: p.tracks.total,
                image: p.images[0]?.url,
                owner: p.owner.display_name || p.owner.id
            })),
            debug: {
                totalTracksAnalyzed: allRecentTracks.length,
                uniqueTracksToday: todaysTracksList.length,
                totalPlaysToday: todaysTracksList.reduce((sum, t) => sum + t.count, 0),
                topTracks: todaysTracksList
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 5)
                    .map(t => ({
                        name: t.track.name,
                        artist: t.track.artists[0].name,
                        plays: t.count
                    }))
            },
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