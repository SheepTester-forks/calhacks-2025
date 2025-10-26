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

// Custom Error for invalid chunks
class InvalidChunkError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InvalidChunkError';
  }
}

// Use a session object to hold credentials that can be refreshed.
const session = {
  downloadUrl: null,
  cookies: null,
};

async function getDownloadUrlAndCookies(session) {
  console.log('Fetching initial URL to get download link and cookies...');
  const initialResponse = await axios.get(GDR_URL, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    },
  });

  let cookies = initialResponse.headers['set-cookie'];

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

  console.log('Fetching confirmation page from intermediate URL...');
  const confirmResponse = await axios.get(intermediateUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      Cookie: cookies.join('; '),
    },
  });

  const newCookies = confirmResponse.headers['set-cookie']
    ? cookies.concat(confirmResponse.headers['set-cookie'])
    : cookies;

  const dom = new JSDOM(confirmResponse.data);
  const form = dom.window.document.querySelector('form#download-form');
  if (!form) {
    console.log(
      'No confirmation form found, assuming direct download from intermediate URL.'
    );
    session.downloadUrl = intermediateUrl;
    session.cookies = cookies;
    return;
  }

  const actionUrl = form.getAttribute('action');
  const inputs = form.querySelectorAll('input[type="hidden"]');
  const params = new URLSearchParams();
  inputs.forEach((input) => {
    params.append(input.name, input.value);
  });

  session.downloadUrl = `${actionUrl}?${params.toString()}`;
  session.cookies = newCookies;
  console.log('Constructed final download URL:', session.downloadUrl);
}

async function downloadFirstChunkAndGetSize(session) {
    const chunkIndex = 0;
    const chunkFileName = `chunk${String(chunkIndex).padStart(4, '0')}`;
    const chunkFilePath = path.join(CHUNKS_DIR, chunkFileName);

    console.log('Downloading first chunk and getting file size...');
    const start = 0;
    const end = CHUNK_SIZE - 1;

    const response = await axios.get(session.downloadUrl, {
        headers: {
            Cookie: session.cookies.join('; '),
            Range: `bytes=${start}-${end}`,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
        responseType: 'stream',
        validateStatus: (status) => status >= 200 && status < 300,
    });

    const contentRange = response.headers['content-range'];
    if (!contentRange) {
        throw new InvalidChunkError('Could not determine file size from first chunk download.');
    }

    const sizeMatch = contentRange.match(/\/(\d+)/);
    if (!sizeMatch || !sizeMatch[1]) {
        throw new InvalidChunkError(`Could not parse file size from content-range: ${contentRange}`);
    }
    const fileSize = parseInt(sizeMatch[1], 10);

    const contentType = response.headers['content-type'];
    if (contentType.includes('text/html')) {
        let errorData = '';
        for await (const chunk of response.data) { errorData += chunk.toString(); }
        console.error('--- Google Drive Response ---');
        console.error(errorData);
        console.error('--------------------------');
        throw new InvalidChunkError('Received HTML instead of file data for the first chunk.');
    }

    const writer = fs.createWriteStream(chunkFilePath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });

    console.log(`First chunk downloaded. Total file size: ${fileSize} bytes`);
    return fileSize;
}


async function downloadChunk(session, chunkIndex, totalChunks, fileSize) {
  const chunkFileName = `chunk${String(chunkIndex).padStart(4, '0')}`;
  const chunkFilePath = path.join(CHUNKS_DIR, chunkFileName);
  const expectedSize =
    chunkIndex === totalChunks - 1
      ? fileSize % CHUNK_SIZE || CHUNK_SIZE
      : CHUNK_SIZE;

  if (fs.existsSync(chunkFilePath)) {
    const stats = fs.statSync(chunkFilePath);
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

  const response = await axios.get(session.downloadUrl, {
    headers: {
      Cookie: session.cookies.join('; '),
      Range: `bytes=${start}-${end}`,
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    },
    responseType: 'stream',
    validateStatus: (status) => status >= 200 && status < 300,
  });

  const contentType = response.headers['content-type'];
  const contentLength = response.headers['content-length'];
  const requestedLength = end - start + 1;

  if (
    contentType.includes('text/html') ||
    (contentLength &&
      parseInt(contentLength, 10) < requestedLength &&
      chunkIndex !== totalChunks - 1)
  ) {
    let errorData = '';
    for await (const chunk of response.data) {
      errorData += chunk.toString();
    }
    if (errorData.length < 2000) {
      console.error('--- Google Drive Response ---');
      console.error(errorData);
      console.error('--------------------------');
    } else {
      console.error('Received a large error page from Google Drive. Not logging content.');
    }
    throw new InvalidChunkError(
      `Received invalid chunk ${chunkIndex}. Content-Type: ${contentType}, Content-Length: ${contentLength}.`
    );
  }

  const writer = fs.createWriteStream(chunkFilePath);
  const stream = response.data;
  const startTime2 = Date.now();

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

  await new Promise((resolve, reject) => {
    stream.on('data', (chunk) => {
      const now = Date.now();
      const timeSinceLastPacket = now - lastPacketTime;
      lastPacketTime = now;
      lastPacketSize = chunk.length;
      downloaded += chunk.length;

      const elapsedTime = (now - startTime) / 1000;
      downloadSpeed =
        elapsedTime > 0 ? (downloaded / 1024 / elapsedTime).toFixed(2) : 0;

      progressBar.update(downloaded, {
        speed: `${downloadSpeed} KB/s`,
        packetSize: lastPacketSize,
        lastPacket: timeSinceLastPacket,
      });
    });

    stream.pipe(writer);

    writer.on('finish', () => {
      const endTime = Date.now();
      const durationInSeconds = (endTime - startTime2) / 1000;
      const speedInMbps = (chunkTotal * 8) / (durationInSeconds * 1000000);
      const remainingChunks = totalChunks - (chunkIndex + 1);
      const etrInSeconds = remainingChunks * durationInSeconds;

      const formatEtr = (seconds) => {
        const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = Math.floor(seconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
      };

      const getSpeedDescription = (mbps) => {
        if (mbps < 1) return '1/5 "abysmally slow"';
        if (mbps < 10) return '2/5 "very slow"';
        if (mbps < 50) return '3/5 "moderate"';
        if (mbps < 100) return '4/5 "fast"';
        return '5/5 "very fast"';
      };

      console.log(`  Chunk downloaded in ${durationInSeconds.toFixed(2)}s`);
      console.log(`  Speed: ${speedInMbps.toFixed(2)} Mbps (${getSpeedDescription(speedInMbps)})`);
      console.log(`  ETR: ${formatEtr(etrInSeconds)}`);

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
    const MAX_RETRIES = 5;

    if (!fs.existsSync(CHUNKS_DIR)) {
        fs.mkdirSync(CHUNKS_DIR);
    }

    try {
        await getDownloadUrlAndCookies(session);

        let fileSize;
        let retries = 0;
        while (retries < MAX_RETRIES) {
            try {
                fileSize = await downloadFirstChunkAndGetSize(session);
                break; // Success
            } catch (error) {
                if (error instanceof InvalidChunkError) {
                    retries++;
                    console.error(`\nError downloading first chunk. Attempt ${retries}/${MAX_RETRIES}. Refreshing credentials...`);
                    if (retries < MAX_RETRIES) {
                        await new Promise(res => setTimeout(res, 2000));
                        await getDownloadUrlAndCookies(session);
                    } else {
                        throw new Error(`Failed to download the first chunk after ${MAX_RETRIES} attempts.`);
                    }
                } else {
                    throw error;
                }
            }
        }

        const totalChunks = Math.ceil(fileSize / CHUNK_SIZE);
        console.log(`Total chunks: ${totalChunks}`);

        const limit = maxChunksToDownload !== null ? maxChunksToDownload : totalChunks;

        // Start from chunk 1 since chunk 0 is already downloaded
        for (let i = 1; i < limit; i++) {
            let chunkRetries = 0;
            let success = false;
            while (chunkRetries < MAX_RETRIES && !success) {
                try {
                    await downloadChunk(session, i, totalChunks, fileSize);
                    success = true;
                } catch (error) {
                    if (error instanceof InvalidChunkError) {
                        chunkRetries++;
                        console.error(`\nInvalid chunk error for chunk ${i}. Attempt ${chunkRetries}/${MAX_RETRIES}. Refreshing credentials...`);
                        if (chunkRetries < MAX_RETRIES) {
                            await new Promise(res => setTimeout(res, 2000));
                            await getDownloadUrlAndCookies(session);
                        }
                    } else {
                        throw error;
                    }
                }
            }
            if (!success) {
                throw new Error(`Failed to download chunk ${i} after ${MAX_RETRIES} attempts.`);
            }
        }

        console.log('Download process finished.');
        if (maxChunksToDownload !== null) {
            console.log(`Stopped early after downloading ${maxChunksToDownload} chunks as requested.`);
        }
    } catch (error) {
        console.error(`An unrecoverable error occurred: ${error.message}`);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

main();