/**
 * Script to test fetching real map data from Overpass API (Simpler Query)
 */
const https = require('https');
const fs = require('fs');

// Query for major roads in a 1km radius around Pimpri center
const query = `
[out:json][timeout:25];
(
  way["highway"~"primary|secondary"](around:1000, 18.6298, 73.7997);
);
out body;
>;
out skel qt;
`;

const options = {
    hostname: 'overpass-api.de',
    path: '/api/interpreter',
    method: 'POST',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'PCMC-Water-Project/1.0'
    }
};

const req = https.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('Data fetched successfully.');
        // Just print the first 200 chars to verify we got JSON
        console.log(data.substring(0, 200));
        fs.writeFileSync('server/data/test_osm_simple.json', data);
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(`data=${encodeURIComponent(query)}`);
req.end();
