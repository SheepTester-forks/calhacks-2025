const fs = require('fs');
const path = require('path');
const readline = require('readline');

/*
Result:

{
  maxBid: 37.435,
  maxTotal: 352.72,
  maxBidPlaces: 4,
  maxTotalPlaces: 2,
  countries: Set(12) {
    'US',
    'IN',
    'AU',
    'CA',
    'DE',
    'GB',
    'ES',
    'KR',
    'BR',
    'FR',
    'JP',
    'MX'
  },
  maxTsLen: 13,
  maxIdLen: 4,
  maxUserIdLen: 7
}
*/

// The script assumes it's run from the project root directory,
// where the 'data' directory is located.
const dataDir = path.resolve(process.cwd(), 'data/');

let maxBid = 0;
let maxTotal = 0;
let maxBidPlaces = 0;
let maxTotalPlaces = 0;
const countries = new Set();
let maxTsLen = 0;
let maxIdLen = 0;
let maxUserIdLen = 0;

/**
 * Processes a single CSV file, reading it line by line.
 * @param {string} filePath - The path to the CSV file.
 */
async function processFile(filePath) {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity, // Handles different line endings
  });

  let isFirstLine = true;
  for await (const line of rl) {
    if (isFirstLine) {
      isFirstLine = false;
      continue; // Skip header row
    }

    const [
      ts,
      type,
      auction_id,
      advertiser_id,
      publisher_id,
      bid_price,
      user_id,
      total_price,
      country,
    ] = line.split(',');
    maxBid = Math.max(maxBid, +bid_price);
    maxTotal = Math.max(maxTotal, +total_price);
    maxTsLen = Math.max(maxTsLen, ts.length);
    maxUserIdLen = Math.max(maxUserIdLen, user_id.length);
    maxIdLen = Math.max(maxIdLen, publisher_id.length, advertiser_id.length);
    if (bid_price)
      maxBidPlaces = Math.max(maxBidPlaces, bid_price.split('.')[1].length);
    if (total_price)
      maxTotalPlaces = Math.max(
        maxTotalPlaces,
        total_price.split('.')[1].length
      );
    countries.add(country);
    // row is a string[]
    // For now, we are not doing anything with the row.
  }
}

/**
 * Main function to find and process all CSV files in the data directory.
 */
async function main() {
  try {
    const files = await fs.promises.readdir(dataDir);
    const csvFiles = files
      .filter((file) => path.extname(file).toLowerCase() === '.csv')
      .sort(); // Process files in alphabetical order

    if (csvFiles.length === 0) {
      console.log(`No CSV files found in ${dataDir}`);
      return;
    }

    console.log(`Found CSV files to process: ${csvFiles.join(', ')}`);

    for (const csvFile of csvFiles) {
      const filePath = path.join(dataDir, csvFile);
      console.log(`\nProcessing ${filePath}...`);
      await processFile(filePath);
      console.log(`Finished processing ${filePath}.`);
      console.log({
        maxBid,
        maxTotal,
        maxBidPlaces,
        maxTotalPlaces,
        countries,
        maxTsLen,
        maxIdLen,
        maxUserIdLen,
      });
    }
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.error(`Error: The directory '${dataDir}' does not exist.`);
      console.error(
        "Please ensure the script is run from the root of the project and the 'data' directory exists."
      );
    } else {
      console.error('An error occurred:', err);
    }
    process.exit(1);
  }
}

main();
