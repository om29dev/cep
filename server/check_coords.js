const { pool } = require('./db');
async function checkCoords() {
    try {
        const res = await pool.query("SELECT id, lat, lon FROM pipeline_nodes LIMIT 5");
        console.log("Raw Rows:", res.rows);
    } catch (e) { console.error(e); }
    pool.end();
}
checkCoords();
