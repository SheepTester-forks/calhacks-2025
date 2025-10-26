import express from 'express';
import fs from 'fs';
import path from 'path';
import os from 'os';

const CHUNKS_DIR = 'chunks';

function startServer() {
  const app = express();
  const port = 3000;

  app.get('/', (req, res) => {
    const chunkFiles = fs
      .readdirSync(CHUNKS_DIR)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    if (!chunkFiles.length) {
      return res.status(404).send('No chunks found.');
    }

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', 'attachment; filename="downloaded-file"');

    let currentChunkIndex = 0;

    function streamNextChunk() {
      if (currentChunkIndex >= chunkFiles.length) {
        res.end();
        return;
      }

      const chunkFilePath = path.join(CHUNKS_DIR, chunkFiles[currentChunkIndex]);
      const readStream = fs.createReadStream(chunkFilePath);

      readStream.on('end', () => {
        currentChunkIndex++;
        streamNextChunk();
      });

      readStream.on('error', (err) => {
        console.error('Error streaming chunk:', err);
        res.status(500).send('Error streaming file.');
      });

      readStream.pipe(res, { end: false });
    }

    streamNextChunk();
  });

  const server = app.listen(port, () => {
    console.log(`\nServer listening on port ${port}`);
    console.log('Available IPs:');
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          console.log(`  - ${name}: http://${iface.address}:${port}`);
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
}

startServer();