const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function testQuery() {
    try {
        console.log("Connecting to:", process.env.DATABASE_URL);
        const res = await pool.query('SELECT id, username, full_name, email, role, is_blocked, created_at FROM users ORDER BY id ASC');
        console.log("Success! Found", res.rows.length, "users.");
    } catch (e) {
        console.error("Query Failed:", e.message);
        console.error("Stack:", e.stack);
    } finally {
        await pool.end();
    }
}

testQuery();
