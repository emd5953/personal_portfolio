// api/get-token.js
export default async function handler(req, res) {
    const { code } = req.query;
    
    // REPLACE THESE WITH YOUR ACTUAL VALUES
    const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
    const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
    const REDIRECT_URI = 'https://www.enrinjr.com/api/get-token';
    
    if (!code) {
        // Step 1: Show the authorize button
        const scopes = 'user-read-recently-played playlist-read-private';
        const authUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${REDIRECT_URI}&scope=${scopes}`;
        
        return res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        font-family: sans-serif;
                        text-align: center;
                        padding: 50px;
                    }
                    a {
                        background: #1DB954;
                        color: white;
                        padding: 15px 30px;
                        text-decoration: none;
                        border-radius: 30px;
                        font-size: 20px;
                    }
                </style>
            </head>
            <body>
                <h1>Get Spotify Token</h1>
                <p>Click below to authorize:</p>
                <a href="${authUrl}">Connect Spotify</a>
            </body>
            </html>
        `);
    }
    
    // Step 2: Exchange code for token
    try {
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: REDIRECT_URI,
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
            }),
        });
        
        const data = await response.json();
        
        if (data.refresh_token) {
            return res.send(`
                <h1>Success!</h1>
                <h2>Your refresh token:</h2>
                <textarea style="width: 100%; height: 100px;">${data.refresh_token}</textarea>
                <p>Copy this token and save it!</p>
            `);
        } else {
            return res.send(`<h1>Error</h1><pre>${JSON.stringify(data, null, 2)}</pre>`);
        }
    } catch (error) {
        return res.send(`<h1>Error</h1><p>${error.message}</p>`);
    }
}