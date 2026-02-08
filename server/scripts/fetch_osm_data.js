/**
 * PCMC Map Data Fetcher
 * Fetches real road and infrastructure data from OpenStreetMap (Overpass API)
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '../data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'pcmc_osm_raw.json');

// Ensure data directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Overpass QL Query
// We fetch:
// 1. Major roads (highway = primary, secondary, tertiary, trunk) - these define the "Main/Distribution" lines
// 2. Residential roads - these define "Local" lines
// 3. Water infrastructure (reservoirs, tanks, etc.)
// Boundbox: Roughly covering PCMC area (Lat 18.53 to 18.72, Lng 73.70 to 73.90)

const query = `
[out:json][timeout:60];
(
  // Area definition (approximate bounding box for PCMC)
  // node(18.53, 73.70, 18.72, 73.90);
  
  // Fetch Water Infrastructure
  node["man_made"~"water_.*|storage_tank|reservoir"](18.53, 73.70, 18.72, 73.90);
  way["man_made"~"water_.*|storage_tank|reservoir"](18.53, 73.70, 18.72, 73.90);
  relation["man_made"~"water_.*|storage_tank|reservoir"](18.53, 73.70, 18.72, 73.90);

  // Fetch Major Roads (Proxies for Main Pipelines)
  way["highway"~"trunk|primary|secondary"](18.53, 73.70, 18.72, 73.90);
  
  // Fetch Some Local Roads for Density (Limited to save size, strictly residential might be too much)
  // way["highway"="tertiary"](18.53, 73.70, 18.72, 73.90);
);
out body;
>;
out skel qt;
`;

console.log("Fetching map data from OpenStreetMap...");
console.log("Querying area: PCMC (Approx Bounds: 18.53, 73.70 to 18.72, 73.90)");

const options = {
    hostname: 'overpass-api.de',
    path: '/api/interpreter',
    method: 'POST',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'PCMC-Water-Network-Project/1.0'
    }
};

const req = https.request(options, (res) => {
    console.log(`API Response Status: ${res.statusCode}`);

    if (res.statusCode !== 200) {
        console.error("Failed to fetch data.");
        return;
    }

    let data = '';
    let spinnerChars = ['|', '/', '-', '\\'];
    let spinnerIdx = 0;

    res.on('data', (chunk) => {
        data += chunk;
        process.stdout.write(`\rDownloading... ${spinnerChars[spinnerIdx++ % 4]} (${Math.round(data.length / 1024)} KB)`);
    });

    res.on('end', () => {
        console.log(`\nDownload complete! Total size: ${(data.length / 1024 / 1024).toFixed(2)} MB`);

        try {
            // Verify JSON validity
            JSON.parse(data);

            fs.writeFileSync(OUTPUT_FILE, data);
            console.log(`Successfully saved raw OSM data to: ${OUTPUT_FILE}`);
            console.log("You can now run 'node server/utils/osmToPipeline.js' (once created) to convert this to graph data.");

        } catch (e) {
            console.error("Error: Received invalid JSON data from API.");
            console.error(data.substring(0, 500)); // Print start of data to debug
        }
    });
});

req.on('error', (e) => {
    console.error(`Request error: ${e.message}`);
});

req.write(`data=${encodeURIComponent(query)}`);
req.end();
