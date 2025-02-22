// test-youtube-auth.js
const express = require('express');
const { google } = require('googleapis');
require('dotenv').config();

// Create a minimal Express server
const app = express();
const PORT = 4000;

// Set up Google OAuth
const oauth2Client = new google.auth.OAuth2(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  `http://localhost:${PORT}/callback`
);

// Simple route to start OAuth
app.get('/', (req, res) => {
  console.log('Starting OAuth with credentials:', {
    clientId: process.env.YOUTUBE_CLIENT_ID?.substring(0, 10) + '...',
    secret: process.env.YOUTUBE_CLIENT_SECRET ? '[SECRET SET]' : '[MISSING]',
    redirectUri: `http://localhost:${PORT}/callback`
  });

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/youtube.upload'],
    prompt: 'consent'
  });
  
  res.redirect(authUrl);
});

// Callback route
app.get('/callback', async (req, res) => {
  try {
    const { code } = req.query;
    const { tokens } = await oauth2Client.getToken(code);
    
    console.log('✅ Tokens received:', {
      access_token: tokens.access_token?.substring(0, 10) + '...',
      refresh_token: tokens.refresh_token?.substring(0, 10) + '...',
      expiry_date: tokens.expiry_date
    });
    
    res.send(`
      <h1>Success! Tokens received</h1>
      <p>Add this to your .env file:</p>
      <pre>YOUTUBE_REFRESH_TOKEN=${tokens.refresh_token}</pre>
      <p>Then restart your main server.</p>
    `);
  } catch (error) {
    console.error('❌ Error getting tokens:', error);
    res.status(500).send(`Error: ${error.message}`);
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Test server running at http://localhost:${PORT}`);
});