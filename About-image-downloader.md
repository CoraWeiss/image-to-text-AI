# CSV Image Downloader

## Overview

This Node.js script automatically extracts image URLs from a CSV file and downloads them to a local directory. It's designed to be robust, handling network errors, timeouts, and various edge cases that can occur when downloading files from the web.

## Features

- **CSV Parsing**: Processes tab-delimited CSV files line by line
- **URL Detection**: Automatically finds image URLs ending with `.jpg`
- **Concurrent Downloads**: Downloads multiple images simultaneously for efficiency
- **Error Handling**: Robust error management for network issues and timeouts
- **Redirect Support**: Follows HTTP and HTTPS redirects automatically
- **Duplicate Prevention**: Avoids downloading the same image twice
- **Progress Tracking**: Shows real-time download progress information
- **File Size Verification**: Ensures downloaded files contain actual data
- **Custom Filename Generation**: Creates safe filenames from URLs
- **Detailed Reporting**: Provides a summary of successful and failed downloads

## How It Works

1. **Configuration**: The script is configured to read from a specific CSV file path and save images to a designated directory
2. **CSV Processing**: The file is read line by line to efficiently handle large files
3. **URL Extraction**: Each line is split by tab delimiters, and cells are checked for image URLs
4. **Download Queue**: Valid image URLs are added to a download queue, avoiding duplicates
5. **Controlled Downloading**: Images are downloaded in batches with controlled concurrency
6. **Verification**: Each downloaded file is verified to ensure it contains valid data
7. **Summary Report**: A detailed summary is shown after all downloads are complete

## Technical Details

### URL Handling

The script processes URLs by:
- Normalizing URLs (adding protocol if missing)
- Handling both HTTP and HTTPS protocols
- Removing query parameters for cleaner filenames
- Following HTTP redirects (status codes 301, 302, 307)
- Special handling for wiki pages that aren't direct image links

### Error Management

The script includes several error-handling mechanisms:
- Request timeouts (60-second default)
- HTTP status code checking
- Empty file detection
- Write error handling
- Connection error recovery
- Batch processing to avoid overwhelming network resources

### File Operations

For file management, the script:
- Creates the output directory if it doesn't exist
- Generates safe filenames from URLs
- Avoids filename collisions by adding counters
- Removes incomplete downloads when errors occur
- Verifies file sizes after download

## Usage

1. Save the script to your project directory
2. Ensure Node.js is installed on your system
3. Configure the CSV file path and output directory variables at the top of the script
4. Run the script:
   ```bash
   node download-images-improved.js
   ```

## Requirements

- Node.js (v12 or higher recommended)
- Read/write access to the file system
- Internet connectivity to download images

## Example Output

```
Processing CSV file: /workspaces/image-to-text-AI/80_1880s_objects.csv
Found 45 unique image URLs in 80 CSV lines
Downloading: https://example.com/image1.jpg
Downloading: https://example.com/image2.jpg
✓ Downloaded: image1.jpg (256423 bytes)
✓ Downloaded: image2.jpg (125769 bytes)
...
Progress: 10/45 URLs processed
...

----- DOWNLOAD SUMMARY -----
Total URLs found: 45
Successfully downloaded: 38
Failed: 5
Skipped: 2
---------------------------

Completed image download process
```

## Common Issues

- **Timeouts**: Some servers might have anti-scraping measures or slow response times
- **Access Denied**: Some websites may block automated downloads
- **Empty Files**: Some URLs might redirect to login pages or error pages
- **Invalid URLs**: The CSV might contain malformed URLs that look like image links

## Customization

You can customize the script by modifying:
- `csvFilePath`: Path to your CSV file
- `outputDir`: Directory where images will be saved
- `delimiter`: Character used to separate columns (default: tab)
- `TIMEOUT`: Time in milliseconds before a download times out (default: 60000)
- `CONCURRENCY`: Number of simultaneous downloads (default: 5)