import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

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
  fs.writeFileSync('debug_initial.html', initialResponse.data);

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
  fs.writeFileSync('debug_confirm.html', confirmResponse.data);

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
  console.log('Fetching file size with HEAD...');
  const response = await axios.head(url, {
    headers: {
      Cookie: cookies.join('; '),
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    },
    maxRedirects: 5,
  });
  const contentLength = response.headers['content-length'];
  if (!contentLength || parseInt(contentLength, 10) <= 0) {
    throw new Error(`Invalid content-length received: ${contentLength}`);
  }
  console.log('File size:', contentLength);
  return parseInt(contentLength, 10);
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

  console.log(
    `Downloading chunk ${chunkIndex}/${totalChunks - 1} (bytes ${start}-${end})...`
  );

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

  return new Promise((resolve, reject) => {
    let timeout;
    let isStalled = false;
    let stallStartTime;

    const startTimeout = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        console.log(
          `[Chunk ${chunkIndex}] No data received for 10 seconds. Download may be stalled.`
        );
        isStalled = true;
        stallStartTime = Date.now();
      }, 10000);
    };

    stream.on('data', (chunk) => {
      if (isStalled) {
        const stallDuration = (Date.now() - stallStartTime) / 1000; // in seconds
        const bytesReceived = chunk.length;
        const mbps =
          stallDuration > 0
            ? (bytesReceived * 8) / (stallDuration * 1000000)
            : 0;

        console.log(
          `[Chunk ${chunkIndex}] Data received. Download has resumed. Stall lasted ${stallDuration.toFixed(
            2
          )}s. Received ${bytesReceived} bytes (average rate over stall: ${mbps.toFixed(
            2
          )} Mbps).`
        );
        isStalled = false;
      }
      startTimeout();
    });

    stream.pipe(writer);
    startTimeout();

    writer.on('finish', () => {
      clearTimeout(timeout);
      resolve();
    });

    const onError = (err) => {
      clearTimeout(timeout);
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
