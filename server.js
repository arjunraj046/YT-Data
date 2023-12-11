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
  'https://www.googleapis.com/auth/yt-analytics.readonly',
  'https://www.googleapis.com/auth/yt-analytics-monetary.readonly'
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




app.get('/youtube-report-types', checkAccessToken, async (req, res) => {
  try {
    const response = await axios.get('https://youtubereporting.googleapis.com/v1/reportTypes', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        onBehalfOfContentOwner: ownerID,
      },
    });
    console.log('Report Types:', response.data);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching report types:', error.response.data);
    res.status(500).json({ error: 'Failed to fetch report types' });
  }
});


app.post('/create-job', checkAccessToken, async (req, res) => {
  try {
    const requestBody = {
      reportTypeId: 'content_owner_global_ad_revenue_summary_a1',
      job: {
        name: 'AdRevenueSummaryJob', 
        reportTypes: ['content_owner_global_ad_revenue_summary_a1'],
        startTime: '2023-01-01T00:00:00Z',
        endTime: '2023-02-28T23:59:59Z',
      },
    };

    const response = await axios.post('https://youtubereporting.googleapis.com/v1/jobs', requestBody, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      params: {
        onBehalfOfContentOwner: ownerID,
      },
    });

    console.log('Created Job:', response.data);
    res.json(response.data);
  } catch (error) {
    console.error('Error creating job:', error.response.data);
    res.status(500).json({ error: 'Failed to create job' });
  }
});



app.get('/list-jobs', checkAccessToken, async (req, res) => {
  try {
    const response = await axios.get('https://youtubereporting.googleapis.com/v1/jobs', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        onBehalfOfContentOwner: ownerID,
      },
    });

    console.log('List of Jobs:', response.data);
    res.json(response.data);
  } catch (error) {
    console.error('Error listing jobs:', error.response.data);
    res.status(500).json({ error: 'Failed to list jobs' });
  }
});


app.get('/job-details/AdRevenueSummaryJob', checkAccessToken, async (req, res) => {
  try {
    const jobId = req.params.jobId; // Extract the job ID from the request params

    const response = await axios.get(`https://youtubereporting.googleapis.com/v1/jobs/${jobId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        onBehalfOfContentOwner: ownerID,
      },
    });

    console.log('Job Details:', response.data);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching job details:', error.response.data);
    res.status(500).json({ error: 'Failed to fetch job details' });
  }
});





app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});