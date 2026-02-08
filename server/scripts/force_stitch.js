const { pool } = require('../db');

function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180, φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180, Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function forceStitch() {
    const client = await pool.connect();
    try {
        console.log("Force Stitching Valves...");

        // 1. Get Valves
        const vRes = await client.query("SELECT * FROM pipeline_nodes WHERE type = 'valve'");
        const valves = vRes.rows.map(v => ({ ...v, lat: parseFloat(v.lat), lon: parseFloat(v.lon) }));

        // 2. Get Potential Connection Points 
        const nRes = await client.query("SELECT * FROM pipeline_nodes WHERE type NOT IN ('esr', 'pump', 'valve', 'reservoir')");
        const networkNodes = nRes.rows.map(n => ({ ...n, lat: parseFloat(n.lat), lon: parseFloat(n.lon) }));

        console.log(`Processing ${valves.length} Valves...`);

        let patched = 0;

        for (const valve of valves) {
            // Find ALL nearest nodes, sort by dist
            // We want to verify if it's already connected?
            // "stitching" implies adding an edge if none exists.

            // Check existing edges for this valve
            const edgeCheck = await client.query("SELECT 1 FROM pipeline_edges WHERE source_id = $1 OR target_id = $1", [valve.id]);
            // It should have at least 1 edge (from ESR). If it has < 2, it needs an outlet to network.
            if (edgeCheck.rowCount >= 2) {
                // console.log(`Valve ${valve.id} already has ${edgeCheck.rowCount} connections. Skipping.`);
                continue;
            }

            let minC = Infinity;
            let nearest = null;

            for (const node of networkNodes) {
                const d = getDistance(valve.lat, valve.lon, node.lat, node.lon);
                if (d < minC) {
                    minC = d;
                    nearest = node;
                }
            }

            if (nearest) {
                if (minC < 5000) { // Increased to 5km
                    const edgeId = `pipe_force_stitch_${valve.id}_to_${nearest.id}`;
                    await client.query(
                        "INSERT INTO pipeline_edges (id, source_id, target_id, diameter, distance, status) VALUES ($1, $2, $3, $4, $5, $6)",
                        [edgeId, valve.id, nearest.id, 400, minC, 'active']
                    );
                    patched++;
                    console.log(`Force-stitched Valve ${valve.id} -> Node ${nearest.id} (${Math.round(minC)}m)`);
                } else {
                    console.log(`Valve ${valve.id} is TRULY isolated (>5km to nearest node).`);
                }
            }
        }

        console.log(`Force stitching done. Patched ${patched} valves.`);

    } catch (e) {
        console.error("Force stitch failed:", e);
    } finally {
        client.release();
        pool.end();
    }
}

forceStitch();
