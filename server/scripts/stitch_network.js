const { pool } = require('../db');

// Haversine helper
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180, φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180, Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function stitchNetwork() {
    const client = await pool.connect();
    try {
        console.log("Stitching Valves to Distribution Network...");

        // 1. Get all Valves
        const vRes = await client.query("SELECT * FROM pipeline_nodes WHERE type = 'valve'");
        const valves = vRes.rows.map(v => ({ ...v, lat: parseFloat(v.lat), lon: parseFloat(v.lon) }));

        if (valves.length === 0) {
            console.log("No valves found.");
            return;
        }

        // 2. Get Potential Connection Points (Junctions, Hydrants, or generic nodes)
        // We exclude ESRs and Pumps to avoid looping back to source or inputs.
        // We want to connect to the "Distribution" network (which are mostly junctions or untyped points from OSM).
        // OR we can just select ALL nodes and filter in loop.
        const nRes = await client.query("SELECT * FROM pipeline_nodes WHERE type NOT IN ('esr', 'pump', 'valve', 'reservoir')");
        const networkNodes = nRes.rows.map(n => ({ ...n, lat: parseFloat(n.lat), lon: parseFloat(n.lon) }));

        console.log(`Found ${valves.length} Valves and ${networkNodes.length} Network Nodes.`);

        let connectionsMade = 0;

        for (const valve of valves) {
            // Find nearest acceptable node
            let minC = Infinity;
            let nearest = null;

            for (const node of networkNodes) {
                const d = getDistance(valve.lat, valve.lon, node.lat, node.lon);

                // Only connect if reasonable distance (e.g., < 1km)
                // If it's too far, maybe this valve serves a local area not mapped?
                if (d < minC && d < 2000) {
                    minC = d;
                    nearest = node;
                }
            }

            if (nearest) {
                // Check if already connected? (Skip for simplicity, duplicate edges are harmless-ish or checked by ID)
                const edgeId = `pipe_stitch_${valve.id}_to_${nearest.id}`;

                // Verify existence
                const check = await client.query("SELECT 1 FROM pipeline_edges WHERE id = $1", [edgeId]);
                if (check.rowCount === 0) {
                    await client.query(
                        "INSERT INTO pipeline_edges (id, source_id, target_id, diameter, distance, status) VALUES ($1, $2, $3, $4, $5, $6)",
                        [edgeId, valve.id, nearest.id, 400, minC, 'active'] // 400mm Feeder
                    );
                    connectionsMade++;
                    // console.log(`Connected Valve ${valve.id} -> Node ${nearest.id} (${Math.round(minC)}m)`);
                }
            } else {
                console.log(`Valve ${valve.id} is isolated (nearest node > 2000m)`);
            }
        }

        console.log(`Stitching complete. Created ${connectionsMade} new connections.`);

    } catch (e) {
        console.error("Stitching failed:", e);
    } finally {
        client.release();
        pool.end();
    }
}

stitchNetwork();
