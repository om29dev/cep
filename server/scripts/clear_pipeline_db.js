/**
 * Clear Pipeline Data from DB
 * Usage: node server/scripts/clear_pipeline_db.js
 */

const { pool } = require('../db');

async function clearData() {
    const client = await pool.connect();
    try {
        console.log("Clearing Pipeline Data from DB...");

        await client.query('BEGIN');

        // Delete in order (Edges first due to FK constraint)
        await client.query('DELETE FROM pipeline_edges');
        console.log("Deleted all rows from pipeline_edges.");

        await client.query('DELETE FROM pipeline_nodes');
        console.log("Deleted all rows from pipeline_nodes.");

        await client.query('COMMIT');

        console.log("Successfully cleared pipeline data from database.");
    } catch (e) {
        await client.query('ROLLBACK');
        console.error("Error clearing data:", e);
    } finally {
        client.release();
        pool.end();
    }
}

clearData();
