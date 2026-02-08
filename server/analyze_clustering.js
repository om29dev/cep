const { pool } = require('./db');

// Function to calculate Haversine distance
function getHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

async function analyzeClustering() {
    const client = await pool.connect();
    try {
        console.log("Analyzing node clustering...");

        // Get all critical nodes
        const res = await client.query("SELECT id, type, lat, lon FROM pipeline_nodes WHERE type IN ('esr', 'pump', 'valve')");
        const nodes = res.rows.map(n => ({ ...n, lat: parseFloat(n.lat), lon: parseFloat(n.lon) }));

        let duplicateClusters = 0;
        const processed = new Set();
        const clusters = [];

        for (let i = 0; i < nodes.length; i++) {
            if (processed.has(nodes[i].id)) continue;

            const cluster = [nodes[i]];
            processed.add(nodes[i].id);

            for (let j = i + 1; j < nodes.length; j++) {
                if (processed.has(nodes[j].id)) continue;

                const dist = getHaversineDistance(nodes[i].lat, nodes[i].lon, nodes[j].lat, nodes[j].lon);

                // If within 50 meters, consider them part of the same physical location/cluster
                if (dist < 50) {
                    cluster.push(nodes[j]);
                    processed.add(nodes[j].id);
                }
            }

            if (cluster.length > 1) {
                clusters.push(cluster);
                duplicateClusters++;
            }
        }

        console.log(`Found ${duplicateClusters} clusters of nodes within 50m of each other.`);

        clusters.forEach((c, idx) => {
            console.log(`\nCluster ${idx + 1}:`);
            c.forEach(n => console.log(`  - [${n.type.toUpperCase()}] ${n.id} (${n.lat.toFixed(5)}, ${n.lon.toFixed(5)})`));
        });

    } catch (e) {
        console.error("Analysis failed:", e);
    } finally {
        client.release();
        pool.end();
    }
}

analyzeClustering();
