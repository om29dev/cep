const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkUsersSchema() {
    try {
        const res = await pool.query(`
            SELECT table_schema, column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users'
            ORDER BY table_schema, ordinal_position
        `);
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error("Error checking schema:", e);
    } finally {
        await pool.end();
    }
}

checkUsersSchema();
