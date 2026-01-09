const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const url = require('url');

// Load environment variables
require('dotenv').config();

// For Node.js versions that don't have fetch built-in
let fetch;
try {
    fetch = globalThis.fetch;
    if (!fetch) {
        fetch = require('node-fetch');
    }
} catch (e) {
    console.warn('Fetch not available, Spotify API will not work');
}

// Simple password check
const EDIT_PASSWORD = process.env.EDIT_PASSWORD || 'test123';

// Rate limiting for auth attempts
const authAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

// Data file paths
const THOUGHTS_FILE = path.join(process.cwd(), 'data', 'thoughts.json');
const TIMELINE_FILE = path.join(process.cwd(), 'data', 'timeline.json');

const PORT = 4000;

// MIME types
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

// Ensure data directory exists
async function ensureDataDir() {
    const dataDir = path.join(process.cwd(), 'data');
    try {
        await fs.access(dataDir);
    } catch {
        await fs.mkdir(dataDir, { recursive: true });
    }
}

// Load data from file
async function loadData(filePath, defaultData = []) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch {
        return defaultData;
    }
}

// Save data to file
async function saveData(filePath, data) {
    await ensureDataDir();
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

// Verify password with rate limiting
function verifyPassword(password, clientIP = 'unknown') {
    const now = Date.now();
    const attempts = authAttempts.get(clientIP) || { count: 0, lastAttempt: 0 };
    
    // Reset attempts if lockout period has passed
    if (now - attempts.lastAttempt > LOCKOUT_TIME) {
        attempts.count = 0;
    }
    
    // Check if locked out
    if (attempts.count >= MAX_ATTEMPTS) {
        const timeLeft = Math.ceil((LOCKOUT_TIME - (now - attempts.lastAttempt)) / 1000 / 60);
        throw new Error(`Too many failed attempts. Try again in ${timeLeft} minutes.`);
    }
    
    const isValid = password === EDIT_PASSWORD;
    
    if (!isValid) {
        attempts.count++;
        attempts.lastAttempt = now;
        authAttempts.set(clientIP, attempts);
    } else {
        // Reset on successful auth
        authAttempts.delete(clientIP);
    }
    
    return isValid;
}

// Spotify API handler
async function handleSpotifyAPI(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (!fetch) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Fetch not available' }));
        return;
    }

    try {
        const clientId = process.env.SPOTIFY_CLIENT_ID;
        const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
        const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;

        if (!clientId || !clientSecret || !refreshToken) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Missing Spotify credentials' }));
            return;
        }

        // Get access token using refresh token
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
            throw new Error(`Token refresh failed: ${tokenResponse.status}`);
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // Get user profile to get user ID
        const userResponse = await fetch('https://api.spotify.com/v1/me', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!userResponse.ok) {
            throw new Error(`User profile fetch failed: ${userResponse.status}`);
        }

        const userData = await userResponse.json();
        const userId = userData.id;

        // Get recently played tracks for last played
        const recentlyPlayedResponse = await fetch(
            'https://api.spotify.com/v1/me/player/recently-played?limit=1',
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );

        let lastPlayed = null;
        
        if (recentlyPlayedResponse.ok) {
            const recentlyPlayedData = await recentlyPlayedResponse.json();
            const recentTracks = recentlyPlayedData.items || [];
            
            // Last played is the most recent track
            if (recentTracks[0]) {
                const track = recentTracks[0].track;
                lastPlayed = {
                    name: track.name,
                    artist: track.artists.map(a => a.name).join(', '),
                    album: track.album.name,
                    trackId: track.id,
                    playedAt: recentTracks[0].played_at,
                    image: track.album.images[0]?.url,
                    external_url: track.external_urls.spotify
                };
            }
        }

        // Get user's created playlists only
        const playlistsResponse = await fetch(
            `https://api.spotify.com/v1/users/${userId}/playlists?limit=50`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );

        let randomPlaylists = [];
        if (playlistsResponse.ok) {
            const playlistsData = await playlistsResponse.json();
            
            // Filter to only playlists created by the user
            const userCreatedPlaylists = playlistsData.items.filter(playlist => 
                playlist.owner.id === userId
            );

            // Get 3 random playlists using date as seed for consistency throughout the day
            const today = new Date();
            const dateString = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, '0')}-${String(today.getUTCDate()).padStart(2, '0')}`;
            
            let seed = 0;
            for (let i = 0; i < dateString.length; i++) {
                seed = ((seed << 5) - seed + dateString.charCodeAt(i)) & 0xffffffff;
            }
            
            const seededRandom = (inputSeed) => {
                const x = Math.sin(inputSeed) * 10000;
                return x - Math.floor(x);
            };

            const shuffled = [...userCreatedPlaylists];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(seededRandom(seed + i) * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }

            randomPlaylists = shuffled.slice(0, 3).map(playlist => ({
                id: playlist.id,
                name: playlist.name,
                description: playlist.description || '',
                image: playlist.images[0]?.url,
                tracks: playlist.tracks.total,
                external_url: playlist.external_urls.spotify,
                isOwner: true
            }));
        }

        const response = {
            lastPlayed,
            randomPlaylists,
            playlistsCount: randomPlaylists.length,
            lastUpdated: new Date().toISOString(),
            date: new Date().toDateString()
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));

    } catch (error) {
        console.error('Spotify API Error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            error: 'Failed to fetch Spotify data',
            message: error.message 
        }));
    }
}
// Content API handler
async function handleContentAPI(req, res, query) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const { type, action } = query;

    try {
        if (req.method === 'GET') {
            // Public read access
            if (type === 'thoughts') {
                const thoughts = await loadData(THOUGHTS_FILE, []);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, data: thoughts }));
                return;
            }
            
            if (type === 'timeline') {
                const timeline = await loadData(TIMELINE_FILE, []);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, data: timeline }));
                return;
            }

            // Export functionality (requires auth)
            if (action === 'export') {
                const password = req.headers.authorization?.replace('Bearer ', '');
                const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
                
                try {
                    if (!verifyPassword(password, clientIP)) {
                        res.writeHead(401, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: false, error: 'Invalid password' }));
                        return;
                    }
                } catch (error) {
                    res.writeHead(429, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: error.message }));
                    return;
                }

                const thoughts = await loadData(THOUGHTS_FILE, []);
                const timeline = await loadData(TIMELINE_FILE, []);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: true, 
                    data: { thoughts, timeline },
                    timestamp: new Date().toISOString()
                }));
                return;
            }
        }

        if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
            // Parse body first
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            
            req.on('end', async () => {
                let parsedBody = {};
                try {
                    parsedBody = JSON.parse(body);
                } catch (e) {
                    // Invalid JSON
                }

                // Check authentication for write operations
                const password = req.headers.authorization?.replace('Bearer ', '');
                const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
                
                try {
                    if (!verifyPassword(password, clientIP)) {
                        res.writeHead(401, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: false, error: 'Invalid password' }));
                        return;
                    }
                } catch (error) {
                    res.writeHead(429, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: error.message }));
                    return;
                }

                if (type === 'thoughts') {
                    const thoughts = await loadData(THOUGHTS_FILE, []);
                    
                    if (req.method === 'POST') {
                        // Add new thought
                        const newThought = {
                            id: Date.now().toString(),
                            date: new Date().toISOString().split('T')[0],
                            tag: parsedBody.tag || 'reflection',
                            title: parsedBody.title,
                            preview: parsedBody.preview,
                            createdAt: new Date().toISOString()
                        };
                        thoughts.unshift(newThought);
                        await saveData(THOUGHTS_FILE, thoughts);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true, data: newThought }));
                        return;
                    }
                    
                    if (req.method === 'PUT') {
                        // Update existing thought
                        const { id } = parsedBody;
                        const thoughtIndex = thoughts.findIndex(t => t.id === id);
                        if (thoughtIndex === -1) {
                            res.writeHead(404, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ success: false, error: 'Thought not found' }));
                            return;
                        }
                        
                        thoughts[thoughtIndex] = { ...thoughts[thoughtIndex], ...parsedBody };
                        await saveData(THOUGHTS_FILE, thoughts);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true, data: thoughts[thoughtIndex] }));
                        return;
                    }
                    
                    if (req.method === 'DELETE') {
                        // Delete thought
                        const { id } = parsedBody;
                        const filteredThoughts = thoughts.filter(t => t.id !== id);
                        await saveData(THOUGHTS_FILE, filteredThoughts);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true }));
                        return;
                    }
                }

                if (type === 'timeline') {
                    const timeline = await loadData(TIMELINE_FILE, []);
                    
                    if (req.method === 'POST') {
                        // Add new timeline entry
                        const newEntry = {
                            id: Date.now().toString(),
                            period: parsedBody.period,
                            title: parsedBody.title,
                            description: parsedBody.description,
                            tags: parsedBody.tags || [],
                            createdAt: new Date().toISOString()
                        };
                        timeline.unshift(newEntry);
                        await saveData(TIMELINE_FILE, timeline);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true, data: newEntry }));
                        return;
                    }
                    
                    if (req.method === 'PUT') {
                        // Update existing timeline entry
                        const { id } = parsedBody;
                        const entryIndex = timeline.findIndex(t => t.id === id);
                        if (entryIndex === -1) {
                            res.writeHead(404, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ success: false, error: 'Timeline entry not found' }));
                            return;
                        }
                        
                        timeline[entryIndex] = { ...timeline[entryIndex], ...parsedBody };
                        await saveData(TIMELINE_FILE, timeline);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true, data: timeline[entryIndex] }));
                        return;
                    }
                    
                    if (req.method === 'DELETE') {
                        // Delete timeline entry
                        const { id } = parsedBody;
                        const filteredTimeline = timeline.filter(t => t.id !== id);
                        await saveData(TIMELINE_FILE, filteredTimeline);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true }));
                        return;
                    }
                }
            });
            return;
        }

        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid request' }));

    } catch (error) {
        console.error('API Error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Server error' }));
    }
}

async function serveFile(filePath, res) {
    try {
        const data = await fs.readFile(filePath);
        const ext = path.extname(filePath);
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    } catch (error) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File not found');
    }
}

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // Handle API routes
    if (pathname.startsWith('/api/')) {
        // Handle Spotify API
        if (pathname === '/api/spotify') {
            return await handleSpotifyAPI(req, res);
        }
        
        // Handle content API
        if (pathname === '/api/content') {
            return await handleContentAPI(req, res, parsedUrl.query);
        }
        
        // Unknown API route
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'API endpoint not found' }));
        return;
    }

    // Serve static files
    let filePath = pathname === '/' ? '/index.html' : pathname;
    
    // Handle story page
    if (pathname === '/pages/storyPage.html') {
        filePath = '/pages/storyPage.html';
    }
    
    const fullPath = path.join(process.cwd(), filePath);
    await serveFile(fullPath, res);
});

server.listen(PORT, () => {
    console.log(`🚀 Local server running at http://localhost:${PORT}`);
    console.log(`📖 Story page: http://localhost:${PORT}/pages/storyPage.html`);
    console.log(`🔑 Test password: ${EDIT_PASSWORD}`);
    console.log(`🎵 Spotify API: ${process.env.SPOTIFY_CLIENT_ID ? 'Configured' : 'Not configured'}`);
});