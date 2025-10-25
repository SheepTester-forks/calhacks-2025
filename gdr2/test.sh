#!/bin/bash

echo "tip: your working directory should be in gdr2/"

# Test script for gdr2

# Clean up previous test runs
echo "Cleaning up old chunks..."
rm -f chunks/chunk0000 chunks/chunk0001 chunks/chunk0002

# Run the downloader to get the first 3 chunks
echo "Running downloader to fetch 3 chunks..."
node index.js 3

# Verify the first chunk
echo "Verifying the first chunk..."
if [ -f "chunks/chunk0000" ]; then
    # Check for ZIP magic bytes (PK)
    if [[ $(xxd -p -l 2 chunks/chunk0000) == "504b" ]]; then
        echo "Test PASSED: First chunk has ZIP magic bytes."
        exit 0
    else
        echo "Test FAILED: First chunk does not have ZIP magic bytes."
        exit 1
    fi
else
    echo "Test FAILED: First chunk was not downloaded."
    exit 1
fi
