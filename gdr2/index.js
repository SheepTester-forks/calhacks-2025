import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';
import cliProgress from 'cli-progress';

const GDR_URL =
  'https://drive.google.com/file/d/1nXjm6xDhWX_TkTD-vrElYGzpKk5NBw6m/view?usp=drivesdk';
const CHUNK_SIZE = 10 * 1024 * 1024; // 10 MB
const CHUNKS_DIR = 'chunks';

const maxChunksToDownload = process.argv[2]
  ? parseInt(process.argv[2], 10)
  : null;

async function getDownloadUrlAndCookies() {
  console.log('Fetching initial URL to get download link and cookies...');
  const initialResponse = await axios.get(GDR_URL, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    },
  });

  const cookies = initialResponse.headers['set-cookie'];
  // fs.writeFileSync('debug_initial.html', initialResponse.data);

  // The initial page contains a script with viewerData, which has the usercontent URL.
  let intermediateUrlMatch = initialResponse.data.match(
    /"(https?:\/\/drive\.usercontent\.google\.com\/uc\?[^"]+)"/
  );
  if (!intermediateUrlMatch || !intermediateUrlMatch[1]) {
    throw new Error(
      'Could not find intermediate usercontent URL in initial page.'
    );
  }

  let intermediateUrl = intermediateUrlMatch[1]
    .replace(/\\u003d/g, '=')
    .replace(/\\u0026/g, '&');
  console.log('Found intermediate URL:', intermediateUrl);

  // Now, fetch the intermediate URL. This should give us the "virus scan" page.
  console.log('Fetching confirmation page from intermediate URL...');
  const confirmResponse = await axios.get(intermediateUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      Cookie: cookies.join('; '),
    },
  });

  // The response might update cookies. We need to handle them.
  const newCookies = confirmResponse.headers['set-cookie']
    ? cookies.concat(confirmResponse.headers['set-cookie'])
    : cookies;
  // fs.writeFileSync('debug_confirm.html', confirmResponse.data);

  const dom = new JSDOM(confirmResponse.data);
  // The form for large files.
  const form = dom.window.document.querySelector('form#download-form');
  if (!form) {
    // if the form is not found, it may be a direct download already
    console.log(
      'No confirmation form found, assuming direct download from intermediate URL.'
    );
    return { downloadUrl: intermediateUrl, cookies };
  }

  const actionUrl = form.getAttribute('action');
  const inputs = form.querySelectorAll('input[type="hidden"]');
  const params = new URLSearchParams();
  inputs.forEach((input) => {
    params.append(input.name, input.value);
  });

  const downloadUrl = `${actionUrl}?${params.toString()}`;
  console.log('Constructed final download URL:', downloadUrl);

  // Return the final URL and the combined cookies
  return { downloadUrl, cookies: newCookies };
}

async function getFileSize(url, cookies) {
  console.log('Fetching file size with a partial GET request...');
  const response = await axios.get(url, {
    headers: {
      Cookie: cookies.join('; '),
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      Range: 'bytes=0-0', // Request only the first byte
    },
    maxRedirects: 5,
    responseType: 'stream',
  });

  // We don't need the body, so destroy the stream immediately.
  response.data.destroy();

  const contentRange = response.headers['content-range'];
  if (!contentRange) {
    const contentLength = response.headers['content-length'];
    if (contentLength && parseInt(contentLength, 10) > 0) {
      console.log('File size from content-length:', contentLength);
      return parseInt(contentLength, 10);
    }
    throw new Error(
      'Could not determine file size. Neither content-range nor content-length is available.'
    );
  }

  const sizeMatch = contentRange.match(/\/(\d+)/);
  if (!sizeMatch || !sizeMatch[1]) {
    throw new Error(
      `Could not parse file size from content-range: ${contentRange}`
    );
  }

  const fileSize = parseInt(sizeMatch[1], 10);
  if (fileSize <= 0) {
    throw new Error(`Invalid file size received from content-range: ${fileSize}`);
  }

  console.log('File size:', fileSize);
  return fileSize;
}

async function downloadChunk(url, cookies, chunkIndex, totalChunks, fileSize) {
  const chunkFileName = `chunk${String(chunkIndex).padStart(4, '0')}`;
  const chunkFilePath = path.join(CHUNKS_DIR, chunkFileName);

  if (fs.existsSync(chunkFilePath)) {
    const stats = fs.statSync(chunkFilePath);
    // If it's the last chunk, it might be smaller
    const expectedSize =
      chunkIndex === totalChunks - 1
        ? fileSize % CHUNK_SIZE || CHUNK_SIZE
        : CHUNK_SIZE;

    if (stats.size === expectedSize) {
      console.log(
        `Chunk ${chunkIndex}/${totalChunks - 1} already exists and is complete. Skipping.`
      );
      return;
    } else {
      console.log(
        `Chunk ${chunkIndex}/${totalChunks - 1} exists but is incomplete. Redownloading.`
      );
    }
  }

  const start = chunkIndex * CHUNK_SIZE;
  const end = Math.min(start + CHUNK_SIZE - 1, fileSize - 1);

  const response = await axios.get(url, {
    headers: {
      Cookie: cookies.join('; '),
      Range: `bytes=${start}-${end}`,
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    },
    responseType: 'stream',
  });

  const writer = fs.createWriteStream(chunkFilePath);
  const stream = response.data;

  const progressBar = new cliProgress.SingleBar(
    {
      format:
        'Chunk {chunkIndex}/{totalChunks} [{bar}] {percentage}% | ETA: {eta}s | {value}/{total} bytes | Speed: {speed} | Packet Size: {packetSize} bytes | Last Packet: {lastPacket}ms ago',
    },
    cliProgress.Presets.shades_classic
  );

  const chunkTotal = end - start + 1;
  progressBar.start(chunkTotal, 0, {
    chunkIndex: chunkIndex,
    totalChunks: totalChunks - 1,
    speed: 'N/A',
    packetSize: 'N/A',
    lastPacket: 'N/A',
  });

  let downloaded = 0;
  let lastPacketTime = Date.now();
  let lastPacketSize = 0;
  let downloadSpeed = 0;
  let startTime = Date.now();

  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => {
      const now = Date.now();
      const timeSinceLastPacket = now - lastPacketTime;
      lastPacketTime = now;
      lastPacketSize = chunk.length;
      downloaded += chunk.length;

      const elapsedTime = (now - startTime) / 1000; // in seconds
      downloadSpeed =
        elapsedTime > 0 ? (downloaded / 1024 / elapsedTime).toFixed(2) : 0; // KB/s

      progressBar.update(downloaded, {
        speed: `${downloadSpeed} KB/s`,
        packetSize: lastPacketSize,
        lastPacket: timeSinceLastPacket,
      });
    });

    stream.pipe(writer);

    writer.on('finish', () => {
      progressBar.stop();
      resolve();
    });

    const onError = (err) => {
      progressBar.stop();
      reject(err);
    };

    writer.on('error', onError);
    stream.on('error', onError);
  });
}

async function main() {
  console.log('GDR2 starting up...');

  if (!fs.existsSync(CHUNKS_DIR)) {
    fs.mkdirSync(CHUNKS_DIR);
  }

  try {
    const { downloadUrl, cookies } = await getDownloadUrlAndCookies();
    const fileSize = await getFileSize(downloadUrl, cookies);
    const totalChunks = Math.ceil(fileSize / CHUNK_SIZE);

    console.log(`Total file size: ${fileSize} bytes`);
    console.log(`Total chunks: ${totalChunks}`);

    const limit =
      maxChunksToDownload !== null ? maxChunksToDownload : totalChunks;

    for (let i = 0; i < limit; i++) {
      await downloadChunk(downloadUrl, cookies, i, totalChunks, fileSize);
    }

    console.log('Download process finished.');
    if (maxChunksToDownload !== null) {
      console.log(
        `Stopped early after downloading ${maxChunksToDownload} chunks as requested.`
      );
    }
  } catch (error) {
    console.error('An error occurred:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

main();
