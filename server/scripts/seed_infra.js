const { pool } = require('../db');

async function seedMissingInfra() {
    const client = await pool.connect();
    try {
        console.log("Seeding missing infrastructure (Pumps, Valves)...");

        // 1. Get existing ESRs to place infra near them
        const res = await client.query("SELECT * FROM pipeline_nodes WHERE type = 'esr'");
        const esrs = res.rows;

        if (esrs.length === 0) {
            console.log("No ESRs found to attach infra to.");
            return;
        }

        let pumpCount = 0;
        let valveCount = 0;

        for (const esr of esrs) {
            const lat = parseFloat(esr.lat);
            const lon = parseFloat(esr.lon);

            // Add a Pump Station near each cluster of ESRs (approx 500m away)
            // Random offset
            const pumpLat = lat + (Math.random() - 0.5) * 0.005;
            const pumpLon = lon + (Math.random() - 0.5) * 0.005;

            const pumpId = `pump_${esr.id}`;

            // Check if exists
            const existing = await client.query("SELECT 1 FROM pipeline_nodes WHERE id = $1", [pumpId]);
            if (existing.rowCount === 0) {
                await client.query(
                    "INSERT INTO pipeline_nodes (id, type, name, lat, lon, capacity, status, area) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
                    [pumpId, 'pump', `Pump Station - ${esr.area}`, pumpLat, pumpLon, 5000, 'active', esr.area]
                );
                pumpCount++;
            }

            // Add 1-2 Valves on pipes near ESR
            for (let i = 0; i < 2; i++) {
                const valveLat = lat + (Math.random() - 0.5) * 0.002;
                const valveLon = lon + (Math.random() - 0.5) * 0.002;
                const valveId = `valve_${esr.id}_${i}`;

                const vExist = await client.query("SELECT 1 FROM pipeline_nodes WHERE id = $1", [valveId]);
                if (vExist.rowCount === 0) {
                    await client.query(
                        "INSERT INTO pipeline_nodes (id, type, name, lat, lon, status, area) VALUES ($1, $2, $3, $4, $5, $6, $7)",
                        [valveId, 'valve', `Valve ${i + 1} - ${esr.name}`, valveLat, valveLon, 'active', esr.area]
                    );
                    valveCount++;
                }
            }
        }

        console.log(`Seeded ${pumpCount} Pumps and ${valveCount} Valves.`);

    } catch (e) {
        console.error("Seeding failed:", e);
    } finally {
        client.release();
        pool.end();
    }
}

seedMissingInfra();
