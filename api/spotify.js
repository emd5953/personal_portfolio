const { getSpotifyData } = require('./spotify-shared');

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const data = await getSpotifyData();
    res.status(200).json(data);
  } catch (error) {
    console.error('Spotify API Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch Spotify data',
      message: error.message 
    });
  }
}