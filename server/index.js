const crypto = require('crypto');

// ... existing imports ...

// Helper function for AI Categorization (Heuristic/Keyword based)
const predictCategory = (description) => {
    const desc = description.toLowerCase();

    if (desc.includes('water') || desc.includes('supply') || desc.includes('leak') || desc.includes('pipe') || desc.includes('pressure') || desc.includes('dirty')) {
        return 'Water Supply';
    }
    if (desc.includes('road') || desc.includes('pothole') || desc.includes('traffic') || desc.includes('street') || desc.includes('asphalt')) {
        return 'Roads & Infrastructure';
    }
    if (desc.includes('electric') || desc.includes('power') || desc.includes('light') || desc.includes('pole') || desc.includes('voltage') || desc.includes('blackout')) {
        return 'Electricity';
    }
    if (desc.includes('waste') || desc.includes('garbage') || desc.includes('trash') || desc.includes('clean') || desc.includes('drain') || desc.includes('sewage')) {
        return 'Waste Management';
    }
    if (desc.includes('noise') || desc.includes('loud') || desc.includes('speaker')) {
        return 'Noise Pollution';
    }
    if (desc.includes('tree') || desc.includes('park') || desc.includes('garden')) {
        return 'Parks & Greenery';
    }

    return 'General Grievance';
};

// ... existing code ...

const initDb = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'citizen',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS complaints (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                category TEXT NOT NULL,
                location TEXT NOT NULL,
                description TEXT NOT NULL,
                images JSONB DEFAULT '[]',
                status TEXT DEFAULT 'pending',
                ward TEXT,
                constituency TEXT,
                district TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                resolved_at TIMESTAMP,
                resolution_remarks TEXT,
                resolution_images JSONB DEFAULT '[]',
                hash TEXT,
                previous_hash TEXT
            );

            -- Migration for existing tables
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='complaints' AND column_name='user_id') THEN
                    ALTER TABLE complaints ADD COLUMN user_id INTEGER REFERENCES users(id);
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='complaints' AND column_name='ward') THEN
                    ALTER TABLE complaints ADD COLUMN ward TEXT;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='complaints' AND column_name='constituency') THEN
                    ALTER TABLE complaints ADD COLUMN constituency TEXT;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='complaints' AND column_name='district') THEN
                    ALTER TABLE complaints ADD COLUMN district TEXT;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='complaints' AND column_name='resolved_at') THEN
                    ALTER TABLE complaints ADD COLUMN resolved_at TIMESTAMP;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='complaints' AND column_name='resolution_remarks') THEN
                    ALTER TABLE complaints ADD COLUMN resolution_remarks TEXT;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='complaints' AND column_name='resolution_images') THEN
                    ALTER TABLE complaints ADD COLUMN resolution_images JSONB DEFAULT '[]';
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='complaints' AND column_name='hash') THEN
                    ALTER TABLE complaints ADD COLUMN hash TEXT;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='complaints' AND column_name='previous_hash') THEN
                    ALTER TABLE complaints ADD COLUMN previous_hash TEXT;
                END IF;
            END $$;

            CREATE TABLE IF NOT EXISTS otp_verifications (
                id SERIAL PRIMARY KEY,
                email TEXT NOT NULL,
                otp TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS patterns (
                id SERIAL PRIMARY KEY,
                issue TEXT NOT NULL,
                area TEXT NOT NULL,
                count INTEGER NOT NULL,
                severity TEXT NOT NULL,
                status TEXT DEFAULT 'Pattern Detected',
                blockchain_hash TEXT,
                tx_id TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Database initialized');
    } catch (err) {
        console.error('Error initializing database:', err);
    }
};

// ... existing code ...

// Complaint Routes
app.post('/api/complaints', verifyToken, checkRole(['citizen']), upload.array('images'), async (req, res) => {
    try {
        const { location, description, ward, constituency, district } = req.body;
        // AI: Predict Category
        const category = predictCategory(description);

        const imagePaths = req.files.map(file => file.filename);

        // Blockchain: Get last hash
        const lastComplaintResult = await pool.query('SELECT hash FROM complaints ORDER BY id DESC LIMIT 1');
        const previousHash = lastComplaintResult.rows.length > 0 ? lastComplaintResult.rows[0].hash : '0000000000000000000000000000000000000000000000000000000000000000'; // Genesis Hash

        // Blockchain: Create new hash
        // We include immutable fields: user_id, category, location, description, specific location details, timestamp (implicitly via uniqueness), and previous_hash
        // Note: For strict immutability, we should include a timestamp generated here, but db 'created_at' is generated on insert. 
        // Ideally we generate timestamp here. For now, we use a rough timestamp or just the content content which makes it content-addressable + chain.
        const dataToHash = `${req.user.id}${category}${location}${description}${ward}${constituency}${district}${previousHash}`;
        const hash = crypto.createHash('sha256').update(dataToHash).digest('hex');

        const result = await pool.query(
            'INSERT INTO complaints (user_id, category, location, description, images, ward, constituency, district, previous_hash, hash) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
            [req.user.id, category, location, description, JSON.stringify(imagePaths), ward, constituency, district, previousHash, hash]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error saving complaint:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/complaints', verifyToken, async (req, res) => {
    try {
        let result;
        const role = req.user.role.toLowerCase();

        if (role === 'officer' || role === 'admin') {
            result = await pool.query('SELECT c.*, u.username as citizen_name FROM complaints c LEFT JOIN users u ON c.user_id = u.id ORDER BY created_at DESC');
        } else {
            result = await pool.query('SELECT * FROM complaints WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
        }
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching complaints' });
    }
});

app.post('/api/complaints/:id/resolve', verifyToken, checkRole(['officer', 'admin']), upload.array('evidence'), async (req, res) => {
    try {
        const { id } = req.params;
        const { remarks } = req.body;
        const imagePaths = req.files ? req.files.map(file => file.filename) : [];

        const result = await pool.query(
            'UPDATE complaints SET status = $1, resolved_at = NOW(), resolution_remarks = $2, resolution_images = $3 WHERE id = $4 RETURNING *',
            ['resolved', remarks, JSON.stringify(imagePaths), id]
        );

        if (result.rows.length === 0) return res.status(404).json({ error: 'Complaint not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error resolving complaint' });
    }
});

// --- ADMIN ROUTES ---

// 1. Get all users
app.get('/api/admin/users', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const result = await pool.query('SELECT id, username, email, role, created_at FROM users ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// 2. Appoint Officer
app.post('/api/admin/officers', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const userCheck = await pool.query('SELECT * FROM users WHERE email = $1 OR username = $2', [email, username]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ error: 'Username or Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const role = 'officer';

        const result = await pool.query(
            'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
            [username, email, hashedPassword, role]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create officer' });
    }
});

// 3. Delete User (Protected: Cannot delete Admins)
app.delete('/api/admin/users/:id', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch user to check role before deleting
        const userCheck = await pool.query('SELECT role FROM users WHERE id = $1', [id]);

        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const targetUserRole = userCheck.rows[0].role.toLowerCase();

        // Security Check: Admins cannot be deleted
        if (targetUserRole === 'admin') {
            return res.status(403).json({ error: 'Access Denied: Cannot delete Administrator accounts.' });
        }

        // Check if user has complaints (Blockchain integrity check)
        const complaintCheck = await pool.query('SELECT 1 FROM complaints WHERE user_id = $1', [id]);
        if (complaintCheck.rows.length > 0) {
            return res.status(400).json({
                error: 'Cannot delete user. This user has immutable complaint records on the blockchain. Deleting them would break the hash chain integrity. Please deactivate the user instead.'
            });
        }

        // Proceed to delete (only if no complaints)
        await pool.query('DELETE FROM users WHERE id = $1', [id]);

        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// Pattern Detection Routes
app.get('/api/patterns', verifyToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM patterns ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching patterns' });
    }
});

app.post('/api/patterns/trigger', verifyToken, checkRole(['officer', 'admin']), async (req, res) => {
    try {
        const { exec } = require('child_process');
        const pythonPath = 'python'; // or path to your venv python
        const scriptPath = path.join(__dirname, 'ai_service', 'pattern_detection.py');

        exec(`${pythonPath} "${scriptPath}"`, (error, stdout, stderr) => {
            if (error) {
                console.error(`AI Analysis error: ${error}`);
                return res.status(500).json({ error: 'AI Analysis failed', details: stderr });
            }
            console.log(`AI Analysis output: ${stdout}`);
            res.json({ message: 'AI Analysis completed', output: stdout });
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to trigger AI analysis' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});