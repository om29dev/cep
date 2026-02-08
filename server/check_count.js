const { pool } = require('./db');
async function checkCount() {
    try {
        const nodes = await pool.query("SELECT COUNT(*) FROM pipeline_nodes");
        const edges = await pool.query("SELECT COUNT(*) FROM pipeline_edges");
        const nodeTypes = await pool.query("SELECT type, COUNT(*) FROM pipeline_nodes GROUP BY type");

        console.log("Nodes Count:", nodes.rows[0].count);
        console.log("Edges Count:", edges.rows[0].count);
        console.log("Node Types Breakdown:");
        nodeTypes.rows.forEach(r => console.log(`  ${r.type}: ${r.count}`));

    } catch (e) { console.error(e); }
    pool.end();
}
checkCount();
