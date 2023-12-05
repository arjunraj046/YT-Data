const express = require('express');
const { google } = require('googleapis');
const axios = require('axios'); // Import Axios

const app = express();
const PORT = 3000;

let totoken;
let rereftoken;

const REDIRECT_URL = 'https://yt-data.onrender.com/oauth2callback';

const oauth2Client = new google.auth.OAuth2(
  '703037131815-2u8326gq9o4pn00pl2f8linrovjac2t6.apps.googleusercontent.com',
  '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',
  REDIRECT_URL
);

const scopes = [
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/youtube',
];

const refreshAccessToken = async () => {
  try {
    const { tokens } = await oauth2Client.refreshToken(rereftoken);
    oauth2Client.setCredentials(tokens);
    totoken = tokens.access_token;
    console.log('New Access Token:', tokens.access_token);
  } catch (error) {
    console.error('Error refreshing access token:', error);
  }
};




const checkAccessToken = async (req, res, next) => {

  const now = Date.now();
  if (!totoken || (oauth2Client.credentials.expiry_date || 0) < now) {
    // Token doesn't exist or has expired, refresh it
    await refreshAccessToken();
  }
  next();
};






app.get('/auth-url', (req, res) => {
   console.log("Google Auth");
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
  });
  res.send({ url: authUrl });
});

app.get('/oauth2callback', async (req, res) => {
  const { code } = req.query;

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    totoken = tokens.access_token;
    rereftoken = tokens.refresh_token;

    console.log('Access Token:', tokens.access_token);
    console.log('Refresh Token:', tokens.refresh_token);

    res.send('Authorization successful!');

  } catch (error) {
    
    console.error('Error retrieving tokens:', error);
    
    res.status(500).send('Authorization failed!');
  
  }
});

app.get('/youtube-analytics', checkAccessToken, async (req, res) => {
  try {
    const accessToken = totoken;

    const response = await axios.get('https://youtubeanalytics.googleapis.com/v2/reports', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        ids: 'channel==MINE',
        startDate: '2021-01-01',
        endDate: '2023-10-30',
        metrics: 'subscribersGained',
        dimensions: 'day',
        sort: 'day',
      },
    });

    console.log('YouTube Analytics Data:', response.data);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching YouTube Analytics data:', error.response.data);
    res.status(500).json({ error: 'Failed to fetch YouTube Analytics data' });
  }
});

app.get('/ads-revenue', checkAccessToken, async (req, res) => {
  try {
    const accessToken = totoken;

    const response = await axios.get('https://youtubeanalytics.googleapis.com/v2/reports', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        ids: 'channel==MINE',
        startDate: '2022-01-01',
        endDate: '2022-12-30',
        metrics: 'estimatedRevenue,adImpressions,monetizedPlaybacks',
        dimensions: 'day,country,video',
      },
    });

    console.log('Ads Revenue Data:', response.data);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching Ads Revenue data:', error.response.data);
    res.status(500).json({ error: 'Failed to fetch Ads Revenue data' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
