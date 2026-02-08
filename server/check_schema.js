const { pool } = require('./db');
async function checkSchema() {
    try {
        const res = await pool.query("SELECT * FROM pipeline_nodes LIMIT 1");
        console.log("Column Names:", Object.keys(res.rows[0]));
        console.log("Sample Row:", res.rows[0]);
    } catch (e) { console.error(e); }
    pool.end();
}
checkSchema();
