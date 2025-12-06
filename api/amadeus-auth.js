// Amadeus API Authentication
// This function gets an access token from Amadeus

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Vercel serverless functions - remove VITE_ prefix
  const API_KEY = process.env.AMADEUS_API_KEY || process.env.VITE_AMADEUS_API_KEY;
  const API_SECRET = process.env.AMADEUS_API_SECRET || process.env.VITE_AMADEUS_API_SECRET;

  if (!API_KEY || !API_SECRET) {
    console.error('Missing credentials:', { 
      hasApiKey: !!API_KEY, 
      hasApiSecret: !!API_SECRET 
    });
    return res.status(500).json({ 
      error: 'Amadeus credentials not configured',
      details: 'Check Vercel environment variables'
    });
  }

  try {
    // Request access token from Amadeus
    const response = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: API_KEY,
        client_secret: API_SECRET,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Amadeus auth error:', errorData);
      return res.status(response.status).json({ error: 'Failed to authenticate with Amadeus' });
    }

    const data = await response.json();
    
    return res.status(200).json({
      access_token: data.access_token,
      expires_in: data.expires_in,
    });
  } catch (error) {
    console.error('Error getting Amadeus token:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
