/**
 * Database Connection and Schema Initialization
 * Uses PostgreSQL to store pipeline network data.
 */

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize Database Query
const query = (text, params) => pool.query(text, params);

/**
 * Initialize Tables
 */
const initDb = async () => {
    const client = await pool.connect();
    try {
        console.log("Initializing Database Schema...");

        await client.query('BEGIN');

        // Create Nodes Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS pipeline_nodes (
                id VARCHAR(255) PRIMARY KEY,
                type VARCHAR(50) NOT NULL,
                name VARCHAR(255),
                lat DECIMAL(10, 8) NOT NULL,
                lon DECIMAL(11, 8) NOT NULL,
                capacity INTEGER DEFAULT 0,
                status VARCHAR(50) DEFAULT 'active',
                area VARCHAR(100) DEFAULT 'pcmc',
                metadata JSONB
            );
        `);

        // Create Edges Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS pipeline_edges (
                id VARCHAR(255) PRIMARY KEY,
                source_id VARCHAR(255) REFERENCES pipeline_nodes(id) ON DELETE CASCADE,
                target_id VARCHAR(255) REFERENCES pipeline_nodes(id) ON DELETE CASCADE,
                diameter INTEGER NOT NULL,
                material VARCHAR(50),
                status VARCHAR(50) DEFAULT 'active',
                distance DECIMAL(10, 2),
                original_way_id BIGINT,
                metadata JSONB
            );
        `);

        // Create Areas/Wards Table (Optional, for now hardcoded in JS usually, but good for DB)
        // Leaving out for now to keep migration simple, can add later if needed.

        await client.query('COMMIT');
        console.log("Database Schema Initialized Successfully.");
    } catch (e) {
        await client.query('ROLLBACK');
        console.error("Error initializing database:", e);
    } finally {
        client.release();
    }
};

// Auto-run init if this file is run directly
if (require.main === module) {
    initDb().then(() => pool.end());
}

module.exports = {
    query,
    pool,
    initDb
};
