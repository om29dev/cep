/**
 * Seed Database with Test Users
 * Creates 3 users: admin, officer, and citizen with password "123"
 */

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const seedUsers = async () => {
    try {
        console.log('Starting user seeding...');

        // Hash the password "123"
        const hashedPassword = await bcrypt.hash('123', 10);

        // Define the 3 users
        const users = [
            {
                username: 'admin',
                full_name: 'Admin User',
                email: 'admin@pcmc.gov.in',
                password: hashedPassword,
                role: 'admin',
                phone: '+91-9876543210',
                user_ward: 'Ward 1',
                user_area: 'PCMC'
            },
            {
                username: 'officer',
                full_name: 'Officer Singh',
                email: 'officer@pcmc.gov.in',
                password: hashedPassword,
                role: 'officer',
                phone: '+91-9876543211',
                user_ward: 'Ward 5',
                user_area: 'Pimpri'
            },
            {
                username: 'citizen',
                full_name: 'Citizen Kumar',
                email: 'citizen@example.com',
                password: hashedPassword,
                role: 'citizen',
                phone: '+91-9876543212',
                user_ward: 'Ward 10',
                user_area: 'Chinchwad'
            }
        ];

        // Insert users
        for (const user of users) {
            try {
                // Check if user already exists
                const existing = await pool.query(
                    'SELECT id FROM users WHERE username = $1 OR email = $2',
                    [user.username, user.email]
                );

                if (existing.rows.length > 0) {
                    console.log(`User ${user.username} already exists, skipping...`);
                    continue;
                }

                // Insert new user
                const result = await pool.query(
                    `INSERT INTO users (username, full_name, email, password, role, phone, user_ward, user_area) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
                     RETURNING id, username, role`,
                    [user.username, user.full_name, user.email, user.password, user.role, user.phone, user.user_ward, user.user_area]
                );

                console.log(`✓ Created ${user.role}: ${user.username} (ID: ${result.rows[0].id})`);
            } catch (err) {
                console.error(`Error creating user ${user.username}:`, err.message);
            }
        }

        console.log('\n=== User Seeding Complete ===');
        console.log('Login credentials:');
        console.log('Admin    - username: admin    | password: 123');
        console.log('Officer  - username: officer  | password: 123');
        console.log('Citizen  - username: citizen  | password: 123');

    } catch (error) {
        console.error('Error seeding users:', error);
    } finally {
        await pool.end();
    }
};

// Run the seeding
seedUsers();
