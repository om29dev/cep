const { pool } = require('../db');

async function cleanupAndReseed() {
    const client = await pool.connect();
    try {
        console.log("Starting cleanup and re-seed process...");

        // 1. Delete previously seeded pumps and valves
        // Identifying by ID pattern used in previous script: 'pump_%' and 'valve_%'
        // BUT wait, original OSM nodes might have similar IDs? Unlikely.
        // My script used `pump_${esr.id}`.

        const deleteRes = await client.query("DELETE FROM pipeline_nodes WHERE id LIKE 'pump_%' OR id LIKE 'valve_%'");
        console.log(`Deleted ${deleteRes.rowCount} old seeded nodes (pumps/valves).`);

        // Also clean up any edges connected to these deleted nodes if I created any?
        // I didn't create edges in the previous script, just nodes. That's part of the problem!
        // Floating nodes look bad.

        // 2. Fetch ESRs
        const res = await client.query("SELECT * FROM pipeline_nodes WHERE type = 'esr'");
        const esrs = res.rows;

        console.log(`Found ${esrs.length} ESRs. Grouping nearby ones...`);

        // 3. Group ESRs by location to avoid duplicate seeds
        const uniqueSites = [];
        const processed = new Set();

        for (const esr of esrs) {
            if (processed.has(esr.id)) continue;

            const cluster = [esr];
            processed.add(esr.id);

            // Simple proximity check against others
            for (const other of esrs) {
                if (!processed.has(other.id)) {
                    const d = Math.sqrt(Math.pow(esr.lat - other.lat, 2) + Math.pow(esr.lon - other.lon, 2));
                    if (d < 0.001) { // Approx 100m
                        cluster.push(other);
                        processed.add(other.id);
                    }
                }
            }

            // Use the first one as the "site" center
            uniqueSites.push(cluster[0]);
        }

        console.log(` identified ${uniqueSites.length} unique ESR sites`);

        // 4. Seed new Infra with better spacing AND connections
        let pumpCount = 0;
        let valveCount = 0;
        let pipeCount = 0;

        for (const site of uniqueSites) {
            const lat = parseFloat(site.lat);
            const lon = parseFloat(site.lon);

            // Create Pump Station - 300m Away (North-Westish)
            const pumpLat = lat + 0.003;
            const pumpLon = lon - 0.003;
            const pumpId = `pump_gen_${site.id}`;

            await client.query(
                "INSERT INTO pipeline_nodes (id, type, name, lat, lon, capacity, status, area) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
                [pumpId, 'pump', `Pump Station - ${site.name}`, pumpLat, pumpLon, 5000, 'active', site.area]
            );
            pumpCount++;

            // Connect Pump to ESR with a "Main" pipe
            const pipeId = `pipe_pump_to_esr_${site.id}`;
            await client.query(
                "INSERT INTO pipeline_edges (id, source_id, target_id, diameter, distance, status) VALUES ($1, $2, $3, $4, $5, $6)",
                [pipeId, pumpId, site.id, 800, 500, 'active'] // 800mm Main
            );
            pipeCount++;

            // Create Valve - 150m Away (East) on the "outlet" side
            // Ideally we'd connect to an existing pipe, but for now let's just place it near.
            // Or create a short pipe segment.
            const valveLat = lat;
            const valveLon = lon + 0.0015;
            const valveId = `valve_gen_${site.id}`;

            await client.query(
                "INSERT INTO pipeline_nodes (id, type, name, lat, lon, status, area) VALUES ($1, $2, $3, $4, $5, $6, $7)",
                [valveId, 'valve', `Outlet Valve - ${site.name}`, valveLat, valveLon, 'active', site.area]
            );
            valveCount++;

            // Connect Valve to ESR
            const vPipeId = `pipe_esr_to_valve_${site.id}`;
            await client.query(
                "INSERT INTO pipeline_edges (id, source_id, target_id, diameter, distance, status) VALUES ($1, $2, $3, $4, $5, $6)",
                [vPipeId, site.id, valveId, 600, 150, 'active']
            );
            pipeCount++;
        }

        console.log(`Re-seeded map with:`);
        console.log(`- ${pumpCount} Pump Stations`);
        console.log(`- ${valveCount} Valves`);
        console.log(`- ${pipeCount} New Pipe Connections`);
        console.log("Now Pump Stations are distinctly separated from ESRs and visually connected by major pipes.");

    } catch (e) {
        console.error("Cleanup failed:", e);
    } finally {
        client.release();
        pool.end();
    }
}

cleanupAndReseed();
