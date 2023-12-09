const express = require('express');
const { google } = require('googleapis');
const axios = require('axios');

const app = express();
const PORT = 3000;

let accessToken;
let refreshToken;

const ownerID = "Jgrl-IYF1196ZxijRcZLXQ";

const CLIENT_ID = '327277406160-7oddheciuo5m459o6cfqqobf7cclhnmp.apps.googleusercontent.com';

const CLIENT_SECRET = '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';

const REDIRECT_URL = 'https://yt-data.onrender.com/oauth2callback';

let baseURL = "https://www.googleapis.com/youtube/partner/v1/";

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);

const scopes = [
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/youtube',
];




const refreshAccessToken = async () => {
  console.log("Creating Refresh Token 🤩🤩🤩");

  try {
    const { tokens } = await oauth2Client.refreshToken(refreshToken);
    oauth2Client.setCredentials(tokens);
    accessToken = tokens.access_token;
    console.log('New Access Token:', tokens.access_token);
  } catch (error) {
    console.error('Error refreshing access token:', error);
  }
};



const checkAccessToken = async (req, res, next) => {
  const now = Date.now();
  console.log("Checking Token 🧐🧐🧐🧐🧐");
  if (!accessToken || (oauth2Client.credentials.expiry_date || 0) < now) {
    await refreshAccessToken();
  }
  next();
};





app.get('/auth-url', (req, res) => {
  console.log("Google Auth");
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });
  res.send({ url: authUrl });
});




app.get('/oauth2callback', async (req, res) => {
  const { code } = req.query;

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    accessToken = tokens.access_token;
    refreshToken = tokens.refresh_token;
    
    console.log('Tokens:', tokens);
    console.log('Access Token:', tokens.access_token);
    console.log('Refresh Token:', tokens.refresh_token);

    res.send('Authorization successful!');
  } catch (error) {
    console.error('Error retrieving tokens:', error);
    res.status(500).send('Authorization failed!');
  }
});


// Route to fetch Partner Owner ID
app.get('/partnerOwnerID', checkAccessToken, async (req, res) => {
  const youtubePartner = google.youtubePartner({
    version: 'v1',
    auth: oauth2Client,
  });

  youtubePartner.partners.list({
    onBehalfOfContentOwner: ownerID, // Replace with your content owner ID
  }, (err, response) => {
    if (err) {
      console.error('Error fetching partners:', err);
      res.status(500).json({ error: 'Error fetching Partner Owner ID' });
      return;
    }
    console.log(res);

    const partnerOwnerID = response.data.items[0].id; // Assuming the ID is in the response
  
    res.json({ partnerOwnerID });
  
  });
});




app.get('/youtube-analytics', checkAccessToken, async (req, res) => {
  console.log('youtube-analytics  💀 ☠️ ');
  try {
    // Access token obtained from checkAccessToken middleware
    const response = await axios.get('https://youtubeanalytics.googleapis.com/v2/reports', {
    headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        ids: ownerID,
        // ids: 'channel==MINE',
        startDate: '2023-01-01',
        endDate: '2023-10-30',
        metrics: 'subscribersGained,subscribersLost',
        dimensions: 'day',
        sort: 'day',
      },
    });
    console.log('YouTube Analytics Data:', response.data);
    res.json(response.data)
  } catch (error) {
    console.error('Error fetching YouTube Analytics data:', error.response.data);
    res.status(500).json({ error: 'Failed to fetch YouTube Analytics data' });
  }
});


app.get('/youtube-content-list', checkAccessToken, async (req, res) => {
   console.log('youtube-content-list  💀 ☠️ ');
  try {
    const response = await axios.get('https://www.googleapis.com/youtube/v3/playlists', {
      headers: { Authorization: `Bearer ${accessToken}`},
      params: {
        part: 'snippet',
        channelId: ownerID, // Replace ownerID with the channel ID you want to fetch content for
        maxResults: 50, // You can adjust the maximum number of results per page
      },
    });
    console.log('Channel Content List:', response.data);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching channel content list:', error.response.data);
    res.status(500).json({ error: 'Failed to fetch channel content list' });
  }
});


app.get('/channel-videos', checkAccessToken, async (req, res) => {
  console.log('channel-videos  💀 ☠️ ');
  try {
    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        part: 'snippet',
        channelId: ownerID, // Replace ownerID with the channel ID you want to fetch content for
        type: 'video',
        maxResults: 50, // You can adjust the maximum number of results per page
      },
    });
    console.log('Channel Videos:', response.data);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching channel videos:', error.response.data);
    res.status(500).json({ error: 'Failed to fetch channel videos' });
  }
});





app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
