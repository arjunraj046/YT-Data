const express = require('express')
const { google } = require('googleapis')
const axios = require('axios')

const app = express()
const PORT = 3000

let accessToken
let refreshToken = '1//0gd9M2-SeZIbdCgYIARAAGBASNwF-L9IrLyGrZFrYFhGgZfmFruhxCNyBPVHhiqgAqWXtx99fghTZTWTR_5Jy2jdN_ob9DWPJOCQ'

const ownerID = "Jgrl-IYF1196ZxijRcZLXQ"
const CLIENT_ID = '327277406160-7oddheciuo5m459o6cfqqobf7cclhnmp.apps.googleusercontent.com'
const CLIENT_SECRET = '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'
const REDIRECT_URL = 'https://yt-data.onrender.com/oauth2callback'

// let baseURL = "https://www.googleapis.com/youtube/partner/v1/"

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL)

const scopes = [
  'https://www.googleapis.com/auth/youtube.readonly', 
  'https://www.googleapis.com/auth/youtube',
  'https://www.googleapis.com/auth/youtubepartner',
  'https://www.googleapis.com/auth/yt-analytics.readonly',
  // 'https://www.googleapis.com/auth/youtubepartner-content-owner‌​-readonly',
  'https://www.googleapis.com/auth/yt-analytics-monetary.readonly' 
]

let reports

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

// creating auth url for the client 
app.get('/auth-url', (req, res) => {
  console.log("Google Auth");
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });
  res.send({ url: authUrl });
});

// Catch the tokens with redirect url 
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


// fetch the types of reports 
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

// get list of jobs which already created.....
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

// route to create a new job.....
app.post('/create-job', checkAccessToken, async (req, res) => {
  try {
    const param = {
      'id':'12323TH',
      // 'reportTypeId':'content_owner_estimated_revenue_a1',
      // 'reportTypeId':'content_owner_global_ad_revenue_summary_a1',
      'reportTypeId':'content_owner_asset_estimated_revenue_a1',
      'name':'adsRate',
      'createTime':new Date('2023-12-01').toISOString(),
      'expireTime':new Date('2023-12-13').toISOString(),
      'systemManaged':false
    }
    const response = await axios.post(`https://youtubereporting.googleapis.com/v1/jobs?onBehalfOfContentOwner=${ownerID}`, param, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })
    console.log("------------------------------------------------------------------------------------------------------------------");
    console.log('Created Job:', response.data);
    console.log("------------------------------------------------------------------------------------------------------------------");
    res.json(response.data);
  } catch (error) {
    console.log("------------------------------------------------------------------------------------------------------------------");
    console.error('Error creating job:::::', error.response.data);
    console.log("------------------------------------------------------------------------------------------------------------------");
    res.status(500).json({ error: 'Failed to create job' });
  }
});
// report need to download and process
app.get('/reports', checkAccessToken, async (req, res) => {
  try {
    const jobId = "a5d87955-f89c-4f12-a959-d2ce0ae19ce3";
    const ownerID = "Jgrl-IYF1196ZxijRcZLXQ"; 
    let url =        `https://youtubereporting.googleapis.com/v1/jobs/${jobId}/reports?onBehalfOfContentOwner=${ownerID}`;
    console.log("URL is this ::",url);
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    console.log("------------------------------------------------------------------------------");
    console.log('Report:', response.data);
    console.log(response);
    console.log("------------------------------------------------------------------------------");
    res.json(response.data);
  } catch (error) {
    console.log("------------------------------------------------------------------------------");
    console.error('Error fetching report:', error.response.data, error);
    console.log("------------------------------------------------------------------------------");
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});



// Define a route to fetch extended YouTube analytics
app.get('/youtube-analytics', (req, res) => {
  const youtubeAnalytics = google.youtubeAnalytics({
    version: 'v2',
    auth: oauth2Client,
  })
    
  youtubeAnalytics.reports.query({
      dimensions: 'day',
      startDate: '2023-11-01',
      endDate: '2023-11-30', 
      filters: 'claimedStatus==claimed',
      ids: `contentOwner==${ownerID}`,
      includeHistoricalChannelData: true,
      metrics: 'views,estimatedRevenue,estimatedAdRevenue,estimatedRedPartnerRevenue',
    }).then((data) =>{
          console.log("---------------------------------------------------------------------------------------------------");
          console.log(data.data);
          console.log("---------------------------------------------------------------------------------------------------");
          res.json(data.data)
        })
        .catch((error) =>{
          console.log("---------------------------------------------------------------------------------------------------");
          console.log(error);
          console.log("---------------------------------------------------------------------------------------------------");
          res.status(500).json({ error: 'The API returned an error', details: error.errors })          
        });
});



// Define a route to fetch extended YouTube analytics
app.get('/youtube-analytics1', (req, res) => {
  const youtubeAnalytics = google.youtubeAnalytics({
    version: 'v2',
    auth: oauth2Client,
  })
    
  youtubeAnalytics.reports.query({
    dimensions: 'date,channel_id,video_id,asset_id,claimed_status,uploader_type,live_or_on_demand,subscribed_status,country_code',
    metrics: [
      'views',
      'watch_time_minutes',
      'average_view_duration_seconds',
      'average_view_duration_percentage',
      'annotation_click_through_rate',
      'annotation_close_rate',
      'annotation_impressions',
      'annotation_clickable_impressions',
      'annotation_closable_impressions',
      'annotation_clicks',
      'annotation_closes',
      'card_click_rate',
      'card_teaser_click_rate',
      'card_impressions',
      'card_teaser_impressions',
      'card_clicks',
      'card_teaser_clicks',
      'red_views',
      'red_watch_time_minutes',
    ],
    ids: `contentOwner==${ownerID}`,
    startDate: '2023-01-01',
    endDate: '2023-12-31',
    filters: 'claimedStatus==claimed',
    // dimensions: 'date,channel_id,video_id,asset_id,claimed_status,uploader_type,live_or_on_demand,subscribed_status,country_code',
    // metrics: 'views,watch_time_minutes,average_view_duration_seconds,average_view_duration_percentage,annotation_click_through_rate,annotation_close_rate,annotation_impressions,annotation_clickable_impressions,annotation_closable_impressions,annotation_clicks,annotation_closes,card_click_rate,card_teaser_click_rate,card_impressions,card_teaser_impressions,card_clicks,card_teaser_clicks,red_views,red_watch_time_minutes',
    // ids: `contentOwner==${ownerID}`,
    // startDate: '2023-01-01',
    // endDate: '2023-12-31',
    // filters: 'claimedStatus==claimed',  
    // dimensions: 'day',
     // startDate: '2023-11-01',
      // endDate: '2023-11-30', 
      // filters: 'claimedStatus==claimed',
      // ids: `contentOwner==${ownerID}`,
      // includeHistoricalChannelData: true,
      // dimensions: 'date,channel_id,video_id,asset_id,claimed_status,uploader_type,live_or_on_demand,subscribed_status,country_code',
      // metrics: 'views,watch_time_minutes,average_view_duration_seconds,average_view_duration_percentage,annotation_click_through_rate,annotation_close_rate,annotation_impressions,annotation_clickable_impressions,annotation_closable_impressions,annotation_clicks,annotation_closes,card_click_rate,card_teaser_click_rate,card_impressions,card_teaser_impressions,card_clicks,card_teaser_clicks,red_views,red_watch_time_minutes',
      // metrics: 'views,estimatedRevenue,estimatedAdRevenue,estimatedRedPartnerRevenue',
    }).then((data) =>{
          console.log("---------------------------------------------------------------------------------------------------");
          console.log(data.data);
          console.log("---------------------------------------------------------------------------------------------------");
          res.json(data.data)
        })
        .catch((error) =>{
          console.log("---------------------------------------------------------------------------------------------------");
          console.log(error);
          console.log("---------------------------------------------------------------------------------------------------");
          res.status(500).json({ error: 'The API returned an error', details: error.errors })          
        });
});




// sending the token back ...
app.get("/accesstoken",(req,res)=>{
  checkAccessToken
  res.send(accessToken)
})
// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found 404...' });
});
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});