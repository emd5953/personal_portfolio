export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body;

  // You'll set these when you first access the system
  const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

  if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
    return res.status(500).json({ 
      error: 'Admin credentials not configured',
      setup: true 
    });
  }

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    // Create session token (simple timestamp + random)
    const sessionToken = Date.now() + '_' + Math.random().toString(36).substring(7);
    
    // Set session cookie (expires in 2 minutes of inactivity)
    res.setHeader('Set-Cookie', [
      `session=${sessionToken}; HttpOnly; Path=/; Max-Age=${2 * 60}`,
      `lastActivity=${Date.now()}; HttpOnly; Path=/; Max-Age=${2 * 60}`
    ]);

    return res.json({ 
      success: true, 
      message: 'Login successful',
      redirect: '/dev-dashboard.html'
    });
  }

  return res.status(401).json({ 
    success: false, 
    message: 'Invalid credentials' 
  });
}