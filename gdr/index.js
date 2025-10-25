const os = require('os');
const express = require('express');
const https = require('https');

const app = express();
const port = 3000;

app.get('/', (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).send('Missing `url` query parameter.');
  }

  const fileIdMatch = url.match(/d\/(.+?)\//);
  if (!fileIdMatch || !fileIdMatch[1]) {
    return res.status(400).send('Invalid Google Drive URL.');
  }
  const fileId = fileIdMatch[1];

  const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

  https.get(downloadUrl, (gdriveResponse) => {
    // Forward headers from Google Drive to the client
    res.setHeader('Content-disposition', gdriveResponse.headers['content-disposition']);
    res.setHeader('Content-type', gdriveResponse.headers['content-type']);
    gdriveResponse.pipe(res);
  }).on('error', (e) => {
    console.error(e);
    res.status(500).send('Error downloading file from Google Drive.');
  });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  console.log('Available IPs:');
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log(`  - ${name}: ${iface.address}`);
      }
    }
  }
});