const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function fixColumn() {
    try {
        console.log("Checking if is_blocked exists...");
        const checkRes = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'is_blocked'
        `);

        if (checkRes.rows.length === 0) {
            console.log("Column is_blocked missing. Adding it...");
            await pool.query('ALTER TABLE users ADD COLUMN is_blocked BOOLEAN DEFAULT FALSE');
            console.log("Column added successfully.");
        } else {
            console.log("Column is_blocked already exists.");
        }

        // Verify again
        const verifyRes = await pool.query('SELECT is_blocked FROM users LIMIT 1');
        console.log("Verification SELECT successful.");

    } catch (e) {
        console.error("Error fixing column:", e.message);
    } finally {
        await pool.end();
    }
}

fixColumn();
