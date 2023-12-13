const express = require('express')
const { google } = require('googleapis')
const axios = require('axios')

const app = express()
const PORT = 3000

let accessToken
let refreshToken

const ownerID = "Jgrl-IYF1196ZxijRcZLXQ"
const CLIENT_ID = '327277406160-7oddheciuo5m459o6cfqqobf7cclhnmp.apps.googleusercontent.com'
const CLIENT_SECRET = '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'
const REDIRECT_URL = 'https://yt-data.onrender.com/oauth2callback'
let baseURL = "https://www.googleapis.com/youtube/partner/v1/"
const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL)
const scopes = [
  'https://www.googleapis.com/auth/youtube.readonly', 
  'https://www.googleapis.com/auth/youtube',
  'https://www.googleapis.com/auth/youtubepartner',
  'https://www.googleapis.com/auth/yt-analytics.readonly',
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

// response get the listed job which already created 
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

// route to create a new job 
app.post('/create-job', checkAccessToken, async (req, res) => {
  try {
    const param = {
      'id':'12323TH',
      'reportTypeId':'content_owner_estimated_revenue_a1',
      'name':'Test1',
      'createTime':new Date('2023-12-01').toISOString(),
      'expireTime':new Date('2023-12-11').toISOString(),
      'systemManaged':false
    }
    const response = await axios.post(`https://youtubereporting.googleapis.com/v1/jobs?onBehalfOfContentOwner=${ownerID}`, param, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })
    console.log("------------------------------------------------------------------------------");
    console.log('Created Job:', response.data);
    console.log("------------------------------------------------------------------------------");
    res.json(response.data);
  } catch (error) {
    console.log("------------------------------------------------------------------------------");
    console.error('Error creating job:::::', error.response.data);
    console.log("------------------------------------------------------------------------------");
    res.status(500).json({ error: 'Failed to create job' });
  }
});

// check with out report id 
app.get('/report1', checkAccessToken, async (req, res) => {
  try {
    // const reportId = "content_owner_estimated_revenue_a1";
    const jobId = "4e055ed3-a7f3-41c8-b045-7a98b665bba6";
    const ownerID = "Jgrl-IYF1196ZxijRcZLXQ"; 
    let url =        `https://youtubereporting.googleapis.com/v1/jobs/${jobId}/reports?onBehalfOfContentOwner=${ownerID}`;
    console.log(url);
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    console.log("------------------------------------------------------------------------------");
    console.log('Report:', response.data);

    reports = response.data?.reports;
    console.log("------------------------------------------------------------------------------");
    res.json(response.data);
  } catch (error) {
    console.log("------------------------------------------------------------------------------");
    console.error('Error fetching report:', error.response.data, error);
    console.log("------------------------------------------------------------------------------");
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});


app.get("/getreport",checkAccessToken,(req,res)=>{
  let num = 1
  console.log("download URL is ::",reports[num].downloadUrl)
  const downloadPath = "C:\Users\arjun\OneDrive\Documents\GitHub\YT-Data\downloads"

axios({
  method: 'get',
  url: reports[num].downloadUrl,
  headers: headers,
  responseType: 'stream', 
})
  .then(response => {
    const fileStream = require('fs').createWriteStream(downloadPath);
    response.data.pipe(fileStream);

    fileStream.on('finish', () => {
      console.log('File downloaded successfully');
    });

    fileStream.on('error', err => {
      console.error('Error writing to file:', err);
    });
  })
  .catch(error => {
    console.error('Error downloading file:', error);
  });
  // axios({
  //   method: 'post', 
  //   url: reports[num].downloadUrl,
  //   headers: headers,
  //   data: requestData,
  // })
  //   .then(response => {
  //     // Handle successful response
  //     console.log('Response:', response.data);
  //   })
  //   .catch(error => {
  //     // Handle error
  //     console.error('Error:', error);
  //   });





})





// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});