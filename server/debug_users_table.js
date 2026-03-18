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
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users'
        `);
        console.log("Users Table Columns:");
        res.rows.forEach(row => {
            console.log(`- ${row.column_name}: ${row.data_type}`);
        });
    } catch (e) {
        console.error("Error checking schema:", e);
    } finally {
        await pool.end();
    }
}

checkUsersSchema();
