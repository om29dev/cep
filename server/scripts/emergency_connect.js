const { pool } = require('../db');

function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180, φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180, Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function emergencyConnect() {
    const client = await pool.connect();
    try {
        console.log("EMERGENCY CONNECT: Connecting ALL ESRs to Network...");

        // 1. Get ALL ESRs
        const esrRes = await client.query("SELECT * FROM pipeline_nodes WHERE type = 'esr'");
        const esrs = esrRes.rows.map(v => ({ ...v, lat: parseFloat(v.lat), lon: parseFloat(v.lon) }));

        // 2. Get Potential Connection Points (All non-ESR nodes)
        const nRes = await client.query("SELECT * FROM pipeline_nodes WHERE type NOT IN ('esr', 'pump', 'valve', 'reservoir')");
        const networkNodes = nRes.rows.map(n => ({ ...n, lat: parseFloat(n.lat), lon: parseFloat(n.lon) }));

        console.log(`Processing ${esrs.length} ESRs...`);

        let patched = 0;

        for (const esr of esrs) {
            // Check if already connected?
            const edgeCheck = await client.query("SELECT 1 FROM pipeline_edges WHERE source_id = $1 OR target_id = $1", [esr.id]);
            if (edgeCheck.rowCount > 0) {
                // console.log(`ESR ${esr.id} already has ${edgeCheck.rowCount} connections.`);
                // continue; 
                // ACTUALLY, checking if it has connections to NETWORK (not just pump/valve) is hard.
                // Let's just add one more redundancy to be safe.
            }

            let minC = Infinity;
            let nearest = null;

            for (const node of networkNodes) {
                const d = getDistance(esr.lat, esr.lon, node.lat, node.lon);

                // Avoid self-connections if node ID is same (unlikely given filters)
                if (d < minC && d > 0) {
                    minC = d;
                    nearest = node;
                }
            }

            if (nearest) {
                // Connect if within range (e.g. 5km)
                if (minC < 5000) {
                    const edgeId = `pipe_emer_${esr.id}_to_${nearest.id}`;
                    // Use INSERT ON CONFLICT DO NOTHING if ID exists
                    const exists = await client.query("SELECT 1 FROM pipeline_edges WHERE id = $1", [edgeId]);
                    if (exists.rowCount === 0) {
                        await client.query(
                            "INSERT INTO pipeline_edges (id, source_id, target_id, diameter, distance, status) VALUES ($1, $2, $3, $4, $5, $6)",
                            [edgeId, esr.id, nearest.id, 600, minC, 'active'] // 600mm Connector
                        );
                        patched++;
                        console.log(`Connected ESR ${esr.id} -> Node ${nearest.id} (${Math.round(minC)}m)`);
                    }
                }
            }
        }

        console.log(`Emergency Connect done. Patched ${patched} ESRs.`);

    } catch (e) {
        console.error("Emergency connect failed:", e);
    } finally {
        client.release();
        pool.end();
    }
}

emergencyConnect();
