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

app.get('/partnerChannels', checkAccessToken, async (req, res) => {
  try {
    const url = `https://www.googleapis.com/youtube/partner/v1/partnerChannels`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        onBehalfOfContentOwner: ownerID,
      },
    });
    console.log('Partner Channels:', response.data);
    res.json(response.data);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch partner channel data' });
  }
});



app.get('/allChannels', checkAccessToken, async (req, res) => {
  try {
    const url = `https://www.googleapis.com/youtube/v3/channels`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        part: 'snippet,contentDetails,statistics',
        mine: true, // Retrieves channels associated with the authenticated user
      },
    });
    console.log('All Channels:', response.data);
    res.json(response.data);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch channel data' });
  }
});


app.get('/assets',checkAccessToken,async (req,res)=>{
          console.log("contentOwners 😵 😵‍💫 🫥 🤐 🥴");
  try {
    const url = baseURL + 'contentOwners/' + ownerID + '/assets'; 
    // Replace 'assets' with the specific endpoint you want to fetch data from

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    console.log('Content Details:', response.data);
    res.json(response.data); // Sending the response data back as JSON
    
  } catch (error) {
     console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch content owner data' });
  }
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
