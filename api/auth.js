export default function handler(req, res) {
  const cookies = parseCookies(req.headers.cookie || '');
  const session = cookies.session;
  const lastActivity = parseInt(cookies.lastActivity || '0');
  
  if (!session || !lastActivity) {
    return res.status(401).json({ authenticated: false });
  }

  const now = Date.now();
  const twoMinutes = 2 * 60 * 1000; // 2 minutes in milliseconds
  
  // Check if session expired (2 minutes of inactivity)
  if (now - lastActivity > twoMinutes) {
    return res.status(401).json({ 
      authenticated: false, 
      reason: 'Session expired due to inactivity' 
    });
  }

  // Update last activity
  res.setHeader('Set-Cookie', [
    `session=${session}; HttpOnly; Path=/; Max-Age=${2 * 60}`,
    `lastActivity=${now}; HttpOnly; Path=/; Max-Age=${2 * 60}`
  ]);

  return res.json({ authenticated: true });
}

function parseCookies(cookieHeader) {
  const cookies = {};
  cookieHeader.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=');
    if (name && value) {
      cookies[name] = decodeURIComponent(value);
    }
  });
  return cookies;
}