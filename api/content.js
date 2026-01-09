const fs = require('fs').promises;
const path = require('path');

// Simple password check (you can change this)
const EDIT_PASSWORD = process.env.EDIT_PASSWORD || 'your-secret-password';

// Rate limiting for auth attempts
const authAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

// Data file paths
const THOUGHTS_FILE = path.join(process.cwd(), 'data', 'thoughts.json');
const TIMELINE_FILE = path.join(process.cwd(), 'data', 'timeline.json');

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

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { type, action } = req.query;

    try {
        if (req.method === 'GET') {
            // Public read access
            if (type === 'thoughts') {
                const thoughts = await loadData(THOUGHTS_FILE, []);
                return res.json({ success: true, data: thoughts });
            }
            
            if (type === 'timeline') {
                const timeline = await loadData(TIMELINE_FILE, []);
                return res.json({ success: true, data: timeline });
            }

            // Export functionality (requires auth)
            if (action === 'export') {
                const password = req.headers.authorization?.replace('Bearer ', '');
                const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
                
                try {
                    if (!verifyPassword(password, clientIP)) {
                        return res.status(401).json({ success: false, error: 'Invalid password' });
                    }
                } catch (error) {
                    return res.status(429).json({ success: false, error: error.message });
                }

                const thoughts = await loadData(THOUGHTS_FILE, []);
                const timeline = await loadData(TIMELINE_FILE, []);
                
                return res.json({ 
                    success: true, 
                    data: { thoughts, timeline },
                    timestamp: new Date().toISOString()
                });
            }
        }

        if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
            // Check authentication for write operations
            const password = req.headers.authorization?.replace('Bearer ', '');
            const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
            
            try {
                if (!verifyPassword(password, clientIP)) {
                    return res.status(401).json({ success: false, error: 'Invalid password' });
                }
            } catch (error) {
                return res.status(429).json({ success: false, error: error.message });
            }

            if (type === 'thoughts') {
                const thoughts = await loadData(THOUGHTS_FILE, []);
                
                if (req.method === 'POST') {
                    // Add new thought
                    const newThought = {
                        id: Date.now().toString(),
                        date: new Date().toISOString().split('T')[0],
                        tag: req.body.tag || 'reflection',
                        title: req.body.title,
                        preview: req.body.preview,
                        createdAt: new Date().toISOString()
                    };
                    thoughts.unshift(newThought);
                    await saveData(THOUGHTS_FILE, thoughts);
                    return res.json({ success: true, data: newThought });
                }
                
                if (req.method === 'PUT') {
                    // Update existing thought
                    const { id } = req.body;
                    const thoughtIndex = thoughts.findIndex(t => t.id === id);
                    if (thoughtIndex === -1) {
                        return res.status(404).json({ success: false, error: 'Thought not found' });
                    }
                    
                    thoughts[thoughtIndex] = { ...thoughts[thoughtIndex], ...req.body };
                    await saveData(THOUGHTS_FILE, thoughts);
                    return res.json({ success: true, data: thoughts[thoughtIndex] });
                }
                
                if (req.method === 'DELETE') {
                    // Delete thought
                    const { id } = req.body;
                    const filteredThoughts = thoughts.filter(t => t.id !== id);
                    await saveData(THOUGHTS_FILE, filteredThoughts);
                    return res.json({ success: true });
                }
            }

            if (type === 'timeline') {
                const timeline = await loadData(TIMELINE_FILE, []);
                
                if (req.method === 'POST') {
                    // Add new timeline entry
                    const newEntry = {
                        id: Date.now().toString(),
                        period: req.body.period,
                        title: req.body.title,
                        description: req.body.description,
                        tags: req.body.tags || [],
                        createdAt: new Date().toISOString()
                    };
                    timeline.unshift(newEntry);
                    await saveData(TIMELINE_FILE, timeline);
                    return res.json({ success: true, data: newEntry });
                }
                
                if (req.method === 'PUT') {
                    // Update existing timeline entry
                    const { id } = req.body;
                    const entryIndex = timeline.findIndex(t => t.id === id);
                    if (entryIndex === -1) {
                        return res.status(404).json({ success: false, error: 'Timeline entry not found' });
                    }
                    
                    timeline[entryIndex] = { ...timeline[entryIndex], ...req.body };
                    await saveData(TIMELINE_FILE, timeline);
                    return res.json({ success: true, data: timeline[entryIndex] });
                }
                
                if (req.method === 'DELETE') {
                    // Delete timeline entry
                    const { id } = req.body;
                    const filteredTimeline = timeline.filter(t => t.id !== id);
                    await saveData(TIMELINE_FILE, filteredTimeline);
                    return res.json({ success: true });
                }
            }
        }

        return res.status(400).json({ success: false, error: 'Invalid request' });

    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ success: false, error: 'Server error' });
    }
}