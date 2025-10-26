const fs = require('fs');
const path = require('path');
const readline = require('readline');

// The script assumes it's run from the project root directory,
// where the 'data' directory is located.
const dataDir = path.resolve(process.cwd(), 'data');

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

    const row = line.split(',');
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
    }
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.error(`Error: The directory '${dataDir}' does not exist.`);
      console.error('Please ensure the script is run from the root of the project and the \'data\' directory exists.');
    } else {
      console.error('An error occurred:', err);
    }
    process.exit(1);
  }
}

main();