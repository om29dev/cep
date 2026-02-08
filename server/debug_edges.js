const { pool } = require('./db');
async function run() {
    try {
        const id = 'inf_13382599924';
        const res = await pool.query("SELECT * FROM pipeline_edges WHERE source_id = $1 OR target_id = $1", [id]);
        console.log(`Edges for ${id}:`, res.rows);
    } catch (e) { console.error(e); } finally { pool.end(); }
}
run();
