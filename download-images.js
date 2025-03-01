const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const readline = require('readline');
const url = require('url');

// Configuration with the specified file path
const csvFilePath = '/workspaces/image-to-text-AI/80_1880s_objects.csv';
const outputDir = path.join('/workspaces/image-to-text-AI', 'downloaded_images');
const delimiter = '\t'; // Tab delimiter
const TIMEOUT = 60000; // 60 seconds timeout

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log(`Created output directory: ${outputDir}`);
}

// Function to download an image using http or https module
function downloadImage(imageUrl, filepath) {
  return new Promise((resolve, reject) => {
    // Parse the URL to choose the right protocol
    const parsedUrl = url.parse(imageUrl);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;
    
    // Some URLs might need special handling
    let requestUrl = imageUrl;
    
    // Handle Wikimedia Commons URLs which aren't direct image links
    if (imageUrl.includes('commons.wikimedia.org/wiki/File:')) {
      console.log(`Skipping Wikimedia Commons wiki page (not a direct image): ${imageUrl}`);
      resolve({ skipped: true, reason: 'Not a direct image link' });
      return;
    }
    
    console.log(`Downloading: ${imageUrl}`);
    
    // Create a write stream to save the file
    const file = fs.createWriteStream(filepath);
    
    // Set up the request
    const request = protocol.get(requestUrl, { timeout: TIMEOUT }, (response) => {
      // Handle redirects (status codes 301, 302, 307)
      if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307) {
        if (response.headers.location) {
          console.log(`Following redirect: ${response.headers.location}`);
          // Close the file and request
          file.close();
          request.destroy();
          
          // Start a new download with the redirect URL
          downloadImage(response.headers.location, filepath)
            .then(resolve)
            .catch(reject);
          return;
        }
      }
      
      // Check for successful response
      if (response.statusCode !== 200) {
        file.close();
        fs.unlink(filepath, () => {});
        console.error(`✗ Failed to download (HTTP ${response.statusCode}): ${imageUrl}`);
        resolve({ 
          success: false, 
          status: response.statusCode,
          url: imageUrl
        });
        return;
      }
      
      // Pipe the response to the file
      response.pipe(file);
      
      // Handle completion
      file.on('finish', () => {
        file.close();
        
        // Check if the file actually downloaded content (> 0 bytes)
        fs.stat(filepath, (err, stats) => {
          if (err || stats.size === 0) {
            console.error(`✗ Downloaded empty file: ${imageUrl}`);
            fs.unlink(filepath, () => {});
            resolve({ 
              success: false, 
              reason: 'Empty file',
              url: imageUrl
            });
          } else {
            console.log(`✓ Downloaded: ${path.basename(filepath)} (${stats.size} bytes)`);
            resolve({ 
              success: true,
              url: imageUrl,
              size: stats.size
            });
          }
        });
      });
      
      // Handle errors during download
      file.on('error', (err) => {
        file.close();
        fs.unlink(filepath, () => {});
        console.error(`✗ Error writing file: ${err.message}`);
        resolve({ 
          success: false, 
          reason: 'File write error',
          error: err.message,
          url: imageUrl
        });
      });
    });
    
    // Handle request errors
    request.on('error', (err) => {
      file.close();
      fs.unlink(filepath, () => {});
      console.error(`✗ Error requesting: ${imageUrl}`);
      console.error(`  ${err.message}`);
      resolve({ 
        success: false, 
        reason: 'Request error',
        error: err.message,
        url: imageUrl
      });
    });
    
    // Set a custom timeout handler
    request.on('timeout', () => {
      file.close();
      request.destroy();
      fs.unlink(filepath, () => {});
      console.error(`✗ Request timeout: ${imageUrl}`);
      resolve({ 
        success: false, 
        reason: 'Timeout',
        url: imageUrl
      });
    });
    
    // End the request
    request.end();
  });
}

// Main function to process the CSV and download images
async function processCSV() {
  console.log(`Processing CSV file: ${csvFilePath}`);
  
  try {
    // Check if the file exists
    if (!fs.existsSync(csvFilePath)) {
      throw new Error(`CSV file not found: ${csvFilePath}`);
    }
    
    // Create a readline interface to read the file line by line
    const fileStream = fs.createReadStream(csvFilePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });
    
    // Tracking variables
    let foundUrls = new Set();
    let lineCount = 0;
    let downloadQueue = [];
    
    // Process each line
    for await (const line of rl) {
      lineCount++;
      
      // Skip empty lines
      if (!line.trim()) continue;
      
      // Split line by delimiter
      const columns = line.split(delimiter);
      
      // Look for JPG URLs in the columns
      for (const column of columns) {
        const trimmedValue = column.trim().replace(/"/g, ''); // Remove any quotes
        
        if (trimmedValue.toLowerCase().includes('.jpg') && 
            (trimmedValue.toLowerCase().startsWith('http') || 
             trimmedValue.toLowerCase().startsWith('www'))) {
          
          // Normalize URL - make sure it has a protocol
          let imageUrl = trimmedValue;
          if (imageUrl.toLowerCase().startsWith('www.')) {
            imageUrl = 'https://' + imageUrl;
          }
          
          // Avoid duplicates
          if (!foundUrls.has(imageUrl)) {
            foundUrls.add(imageUrl);
            
            // Create a safe filename from URL
            let filename = path.basename(imageUrl).split('?')[0]; // Remove query parameters
            
            // Ensure filename is safe and unique
            filename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
            if (filename.length > 200) {
              filename = filename.substring(0, 200); // Limit very long filenames
            }
            
            // Add a counter if this filename has been seen before
            let fileCounter = 1;
            let uniqueFilename = filename;
            while (fs.existsSync(path.join(outputDir, uniqueFilename))) {
              const extIndex = filename.lastIndexOf('.');
              if (extIndex === -1) {
                uniqueFilename = `${filename}_${fileCounter}`;
              } else {
                uniqueFilename = `${filename.substring(0, extIndex)}_${fileCounter}${filename.substring(extIndex)}`;
              }
              fileCounter++;
            }
            
            const outputPath = path.join(outputDir, uniqueFilename);
            
            // Add to download queue
            downloadQueue.push({
              url: imageUrl,
              path: outputPath,
              line: lineCount
            });
          }
        }
      }
    }
    
    // Report findings
    console.log(`Found ${downloadQueue.length} unique image URLs in ${lineCount} CSV lines`);
    
    // Start downloads with controlled concurrency
    const CONCURRENCY = 5; // Process 5 downloads at a time
    const results = {
      success: 0,
      failed: 0,
      skipped: 0
    };
    
    // Process downloads in batches
    for (let i = 0; i < downloadQueue.length; i += CONCURRENCY) {
      const batch = downloadQueue.slice(i, i + CONCURRENCY);
      const batchPromises = batch.map(item => 
        downloadImage(item.url, item.path)
          .then(result => {
            if (result.skipped) {
              results.skipped++;
            } else if (result.success) {
              results.success++;
            } else {
              results.failed++;
            }
            return result;
          })
      );
      
      await Promise.all(batchPromises);
      
      // Give a progress update after each batch
      console.log(`Progress: ${i + batch.length}/${downloadQueue.length} URLs processed`);
    }
    
    // Generate report
    console.log("\n----- DOWNLOAD SUMMARY -----");
    console.log(`Total URLs found: ${downloadQueue.length}`);
    console.log(`Successfully downloaded: ${results.success}`);
    console.log(`Failed: ${results.failed}`);
    console.log(`Skipped: ${results.skipped}`);
    console.log("---------------------------\n");
    
    console.log("Completed image download process");
    
  } catch (error) {
    console.error('Error processing CSV file:');
    console.error(error.message);
  }
}

// Run the script
processCSV();