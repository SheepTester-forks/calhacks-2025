const os = require('os');
const express = require('express');
const https = require('https');

const app = express();
const port = 3000;

app.get('/', (req, res) => {
  const { url } = req.query;
  console.log(`[${new Date().toISOString()}] Received request for URL: ${url}`);

  if (!url) {
    console.log(`[${new Date().toISOString()}] Missing 'url' query parameter.`);
    return res.status(400).send('Missing `url` query parameter.');
  }

  const fileIdMatch = url.match(/d\/(.+?)\//);
  if (!fileIdMatch || !fileIdMatch[1]) {
    console.log(`[${new Date().toISOString()}] Invalid Google Drive URL: ${url}`);
    return res.status(400).send('Invalid Google Drive URL.');
  }
  const fileId = fileIdMatch[1];
  console.log(`[${new Date().toISOString()}] Extracted File ID: ${fileId}`);

  const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
  console.log(`[${new Date().toISOString()}] Initial download URL: ${downloadUrl}`);

  const makeRequest = (url, options = {}) => {
    https.get(url, options, (gdriveResponse) => {
      console.log(`[${new Date().toISOString()}] Response status code: ${gdriveResponse.statusCode}`);
      console.log(`[${new Date().toISOString()}] Response headers from Google:`, gdriveResponse.headers);

      if (gdriveResponse.statusCode >= 300 && gdriveResponse.statusCode < 400 && gdriveResponse.headers.location) {
        console.log(`[${new Date().toISOString()}] Received redirect to: ${gdriveResponse.headers.location}`);
        // Follow the redirect
        makeRequest(gdriveResponse.headers.location);
        return; // Stop processing this response
      }

      if (gdriveResponse.headers['content-type'] && gdriveResponse.headers['content-type'].includes('text/html')) {
        console.log(`[${new Date().toISOString()}] Received HTML response, likely a confirmation page.`);
        let body = '';
        gdriveResponse.on('data', (chunk) => {
          body += chunk;
        });
        gdriveResponse.on('end', () => {
          console.log(`[${new Date().toISOString()}] Finished receiving HTML body.`);
        const actionMatch = body.match(/action="([^"]+)"/);
        const idMatch = body.match(/name="id" value="([^"]+)"/);
        const exportMatch = body.match(/name="export" value="([^"]+)"/);
        const confirmMatch = body.match(/name="confirm" value="([^"]+)"/);
        const uuidMatch = body.match(/name="uuid" value="([^"]+)"/);

        if (actionMatch && idMatch && exportMatch && confirmMatch && uuidMatch) {
            const formActionUrl = actionMatch[1].replace(/&amp;/g, '&');
            const id = idMatch[1];
            const exportVal = exportMatch[1];
            const confirmToken = confirmMatch[1];
            const uuid = uuidMatch[1];

            const downloadUrlWithConfirm = `${formActionUrl}?id=${id}&export=${exportVal}&confirm=${confirmToken}&uuid=${uuid}`;
            console.log(`[${new Date().toISOString()}] Constructed final download URL: ${downloadUrlWithConfirm}`);
            const cookies = gdriveResponse.headers['set-cookie'];
            console.log(`[${new Date().toISOString()}] Cookies from Google:`, cookies);

            const newOptions = {
              ...options,
              headers: {
                ...options.headers,
                'Cookie': cookies.join('; ')
              }
            };
            console.log(`[${new Date().toISOString()}] Making second request to: ${downloadUrlWithConfirm}`);
            makeRequest(downloadUrlWithConfirm, newOptions);
          } else {
            console.error(`[${new Date().toISOString()}] Could not find confirmation token in HTML body.`);
            console.error(`[${new Date().toISOString()}] HTML Body:`, body);
            res.status(500).send('Could not find confirmation token for large file download.');
          }
        });
      } else {
        console.log(`[${new Date().toISOString()}] Received non-HTML response, piping directly.`);
        res.setHeader('Content-disposition', gdriveResponse.headers['content-disposition'] ?? '');
        res.setHeader('Content-type', gdriveResponse.headers['content-type'] ?? '');
        res.setHeader('Content-Length', gdriveResponse.headers['content-length'] ?? '');
        gdriveResponse.pipe(res);
      }
    }).on('error', (e) => {
      console.error(`[${new Date().toISOString()}] Error during request to Google:`, e);
      if (!res.headersSent) {
        res.status(500).send('Error downloading file from Google Drive.');
      }
    });
  };

  makeRequest(downloadUrl);
});

const server = app.listen(port, () => {
  console.log(`[${new Date().toISOString()}] Server listening on port ${port}`);
  console.log('Available IPs:');
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log(`  - ${name}: ${iface.address}`);
      }
    }
  }
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
