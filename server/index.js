const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // Assuming bcryptjs based on typical usage, if fails, try bcrypt
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const fs = require('fs');
const nodemailer = require('nodemailer');
const { analyzeComplaint, detectPattern } = require('./ai_service'); // Added AI Service

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: 'http://localhost:5173', // Frontend URL
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads directory exists
if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
    fs.mkdirSync(path.join(__dirname, 'uploads'));
}

// Database Connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// File Upload Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// Security Middleware
const verifyToken = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Access Denied' });

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).json({ error: 'Invalid Token' });
    }
};

const checkRole = (roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Access Denied' });
    }
    next();
};
// Helper function for AI Categorization (Heuristic/Keyword based)
const predictCategory = (description) => {
    const desc = description.toLowerCase();

    // Check if it's even about water
    const waterKeywords = ['water', 'pipe', 'supply', 'leak', 'drain', 'sewer', 'sewage', 'pressure', 'hydrant', 'tanker', 'dirty', 'contamination', 'meter', 'valve'];
    const isWaterRelated = waterKeywords.some(keyword => desc.includes(keyword));

    if (!isWaterRelated) {
        return 'Non-Water Related';
    }

    if (desc.includes('no water') || desc.includes('cutdown') || desc.includes('not coming') || desc.includes('supply')) {
        return 'No Water Supply';
    }
    if (desc.includes('leak') || desc.includes('burst') || desc.includes('flow') || desc.includes('open pipe')) {
        return 'Water Leakage';
    }
    if (desc.includes('dirty') || desc.includes('smell') || desc.includes('color') || desc.includes('quality') || desc.includes('contamination')) {
        return 'Contaminated Water';
    }
    if (desc.includes('low') || desc.includes('slow') || desc.includes('pressure')) {
        return 'Low Water Pressure';
    }
    if (desc.includes('drain') || desc.includes('sewage') || desc.includes('sewer') || desc.includes('overflow') || desc.includes('blockage')) {
        return 'Drainage & Sewage';
    }
    if (desc.includes('illegal') || desc.includes('theft') || desc.includes('direct connection')) {
        return 'Illegal Connection';
    }

    return 'Other Water Issue';
};

// ... existing code ...


const initDb = async () => {
    try {
        // 1. Create Tables safely (IF NOT EXISTS)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                full_name TEXT NOT NULL,
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
                district TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                resolved_at TIMESTAMP,
                resolution_remarks TEXT,
                resolution_images JSONB DEFAULT '[]',
                hash TEXT,
                previous_hash TEXT,
                ai_summary TEXT,
                ai_urgency TEXT,
                ai_sentiment TEXT,
                nonce INTEGER DEFAULT 0
            );

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
                nonce INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Check for specific columns (Migrations for older DBs if mostly preserving info, 
        // though we just did a hard reset so this might be redundant but safe)
        // (Skipping complex migration logic as we know we just reset, but keeping it simple is best)

        // Seeding removed as per request
        console.log('Database initialized.');

        console.log('Database initialized.');
    } catch (err) {
        console.error('Error initializing database:', err);
    }
};

// Call initDb on start
initDb();

// ... existing code ...

// EMAIL CONFIGURATION
const transporter = nodemailer.createTransport({
    service: 'gmail', // Assuming Gmail; change to host/port if using another provider
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

app.post('/api/auth/send-otp', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required' });

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Save to DB
        await pool.query('INSERT INTO otp_verifications (email, otp) VALUES ($1, $2)', [email, otp]);

        // Send Email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your Verification Code - UIIS',
            text: `Your verification code is: ${otp}. It is valid for 10 minutes.`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #2563eb;">UIIS Verification</h2>
                    <p>Your One-Time Password (OTP) for registration is:</p>
                    <h1 style="background: #f3f4f6; padding: 10px 20px; display: inline-block; border-radius: 8px; letter-spacing: 5px;">${otp}</h1>
                    <p>Please enter this code to complete your registration.</p>
                    <p style="font-size: 12px; color: #666; margin-top: 20px;">If you didn't request this code, please ignore this email.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`[EMAIL SERVICE] OTP sent to ${email}`);

        res.json({ message: 'OTP sent successfully to your email' });
    } catch (err) {
        console.error('Email error:', err);
        res.status(500).json({ error: 'Failed to send OTP email. Please check server logs.' });
    }
});

app.post('/api/auth/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        // Check latest OTP
        const result = await pool.query(
            'SELECT * FROM otp_verifications WHERE email = $1 ORDER BY created_at DESC LIMIT 1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'No OTP found for this email' });
        }

        if (result.rows[0].otp !== otp) {
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        // Optional: Expiry check (e.g., 5 mins)

        res.json({ message: 'OTP verified successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Verification failed' });
    }
});

// AUTH ROUTES
app.post('/api/auth/register', async (req, res) => {
    try {
        // Now accepting fullName
        const { username, fullName, email, password, role } = req.body;

        // Basic Check
        if (!username || !fullName || !password) {
            return res.status(400).json({ error: 'Username, Full Name, and Password are required.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert with full_name
        const result = await pool.query(
            'INSERT INTO users (username, full_name, email, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, full_name, role',
            [username, fullName, email, hashedPassword, role || 'citizen']
        );

        const user = result.rows[0];
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });

        res.cookie('token', token, { httpOnly: true });
        res.status(201).json(user);
    } catch (err) {
        if (err.code === '23505') {
            res.status(400).json({ error: 'Username or Email already exists' });
        } else {
            console.error(err);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body; // Changed from email to username

        // Query by username
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

        if (result.rows.length === 0) return res.status(400).json({ error: 'User not found' });

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });

        res.cookie('token', token, { httpOnly: true });
        res.json({ id: user.id, username: user.username, full_name: user.full_name, role: user.role });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get Current User (Session persistence)
app.get('/api/auth/me', verifyToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, username, full_name, role FROM users WHERE id = $1', [req.user.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Logout Route
app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
});

// Complaint Routes
app.post('/api/complaints', verifyToken, checkRole(['citizen']), upload.array('images'), async (req, res) => {
    try {
        const { location, description, district } = req.body;

        // AI: Intelligent Analysis
        const aiAnalysis = await analyzeComplaint(description);

        // Fallback to heuristic if AI fails or key is missing
        const category = aiAnalysis?.category || predictCategory(description);

        if (aiAnalysis?.is_spam) {
            return res.status(400).json({ error: `Submission Rejected: The system detected this as invalid or spam (${aiAnalysis.spam_reason || "Nonsense detected"}). Please provide a valid description.` });
        }

        if (category === 'Non-Water Related') {
            return res.status(400).json({ error: 'This system only supports water-related issues. Please report other municipal problems (roads, electricity, etc.) to the appropriate department.' });
        }

        const ai_urgency = aiAnalysis?.urgency || 'Medium';
        const ai_sentiment = aiAnalysis?.sentiment || 'Neutral';

        const imagePaths = req.files.map(file => file.filename);

        // Blockchain: Get last hash
        const lastComplaintResult = await pool.query('SELECT hash FROM complaints ORDER BY id DESC LIMIT 1');
        const previousHash = lastComplaintResult.rows.length > 0 ? lastComplaintResult.rows[0].hash : '0000000000000000000000000000000000000000000000000000000000000000';

        // --- PROOF OF WORK (MINING) RULE ---
        // Requirement: Hash must start with '000' (Difficulty: 3)
        let nonce = 0;
        let hash = '';
        const difficulty = '000';

        console.log(`[BLOCKCHAIN] Mining new complaint record...`);
        const startTime = Date.now();

        while (true) {
            const dataToHash = `${req.user.id}${category}${location}${description}${district}${previousHash}${ai_urgency}${nonce}`;
            hash = crypto.createHash('sha256').update(dataToHash).digest('hex');

            if (hash.startsWith(difficulty)) {
                break;
            }
            nonce++;
        }

        const timeTaken = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`[BLOCKCHAIN] Block Mined! Nonce: ${nonce}, Time: ${timeTaken}s, Hash: ${hash}`);

        const result = await pool.query(
            'INSERT INTO complaints (user_id, category, location, description, images, district, previous_hash, hash, ai_urgency, ai_sentiment, nonce) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
            [req.user.id, category, location, description, JSON.stringify(imagePaths), district, previousHash, hash, ai_urgency, ai_sentiment, nonce]
        );

        // Auto-mine patterns after new complaint
        // We don't await this to keep response fast, or we can await if we want to ensure it's done. 
        // Given it's fast (PoW difficulty 3), awaiting is fine and safer for consistency.
        await minePatterns();

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



// --- BLOCKCHAIN INTEGRITY VERIFICATION ---
app.get('/api/blockchain/verify', verifyToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM complaints ORDER BY id ASC');
        const complaints = result.rows;

        let isValid = true;
        const chainStatus = [];
        let expectedPreviousHash = '0000000000000000000000000000000000000000000000000000000000000000';
        const difficulty = '000';

        for (const complaint of complaints) {
            const dataToHash = `${complaint.user_id}${complaint.category}${complaint.location}${complaint.description}${complaint.district}${complaint.previous_hash}${complaint.ai_summary}${complaint.ai_urgency}${complaint.nonce}`;
            const calculatedHash = crypto.createHash('sha256').update(dataToHash).digest('hex');

            const isHashValid = calculatedHash === complaint.hash;
            const isChainValid = complaint.previous_hash === expectedPreviousHash;
            const isDifficultyMet = calculatedHash.startsWith(difficulty);

            chainStatus.push({
                id: complaint.id,
                storedHash: complaint.hash,
                calculatedHash: calculatedHash,
                previousHash: complaint.previous_hash,
                isHashValid,
                isChainValid,
                isDifficultyMet
            });

            if (!isHashValid || !isChainValid || !isDifficultyMet) {
                isValid = false;
            }
            expectedPreviousHash = complaint.hash;
        }

        // Verify Patterns
        const patternsResult = await pool.query('SELECT * FROM patterns');
        const patterns = patternsResult.rows;
        let patternsValid = true;

        for (const pattern of patterns) {
            const dataToHash = `${pattern.area}${pattern.issue}${pattern.count}${pattern.nonce}`;
            const calculatedHash = crypto.createHash('sha256').update(dataToHash).digest('hex');
            if (calculatedHash !== pattern.blockchain_hash || !calculatedHash.startsWith(difficulty)) {
                patternsValid = false;
                isValid = false;
            }
        }

        res.json({
            isValid,
            totalRecords: complaints.length,
            patternProofs: patterns.length,
            patternsValid,
            lastVerifiedAt: new Date(),
            details: chainStatus
        });
    } catch (err) {
        console.error('Blockchain verification error:', err);
        res.status(500).json({ error: 'Failed to verify blockchain integrity' });
    }
});

// --- PATTERN PROOF MINING & RETRIEVAL ---

// 1. Get all pattern proofs
app.get('/api/blockchain/patterns', verifyToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM patterns ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch pattern proofs' });
    }
});

// 2. Generate and Mine Patterns from clusters
// Pattern Mining Function
// Pattern Mining Function
const minePatterns = async () => {
    try {
        // 1. Get active complaints grouped by District
        const complaintsResult = await pool.query('SELECT description, district, category, created_at FROM complaints WHERE status != $1 ORDER BY created_at DESC', ['resolved']);
        const allComplaints = complaintsResult.rows;

        // Group by District
        const districtGroups = {};
        allComplaints.forEach(c => {
            const district = c.district || 'Unknown';
            if (!districtGroups[district]) districtGroups[district] = [];
            districtGroups[district].push(c.description);
        });

        const difficulty = '000';
        const generated = [];

        // 2. Analyze each district with AI
        for (const [district, descriptions] of Object.entries(districtGroups)) {
            // User said "dont do condition like 5 same type".
            // We'll trust the AI with even small batches (e.g., > 1) to define severity.
            if (descriptions.length < 2) continue;

            // Call AI Service
            // We slice to send max 20 recent complaints to avoid token limits, usually enough to see a pattern
            const recentDescriptions = descriptions.slice(0, 20);
            const aiResult = await detectPattern(recentDescriptions, district);

            if (aiResult && aiResult.detected) {
                const issue = aiResult.issue_title;
                const severity = aiResult.severity; // AI decides High/Medium
                const count = descriptions.length;
                const area = district;

                // Mining Proof of Work
                let nonce = 0;
                let hash = '';

                while (true) {
                    const dataToHash = `${area}${issue}${severity}${nonce}`;
                    hash = crypto.createHash('sha256').update(dataToHash).digest('hex');
                    if (hash.startsWith(difficulty)) break;
                    nonce++;
                }

                // Check for duplicates (prevent spamming the SAME pattern detection)
                // We check if a pattern with same Issue Title & Area exists created in the last 24 hours
                const existing = await pool.query(
                    `SELECT 1 FROM patterns 
                     WHERE area = $1 AND issue = $2 
                     AND created_at > NOW() - INTERVAL '24 hours'`,
                    [area, issue]
                );

                if (existing.rows.length === 0) {
                    const result = await pool.query(
                        'INSERT INTO patterns (issue, area, count, severity, blockchain_hash, nonce) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
                        [issue, area, count, severity, hash, nonce]
                    );
                    generated.push(result.rows[0]);
                    console.log(`[AI-PATTERN] Detected & Mined: ${issue} in ${area} (${severity})`);
                }
            }
        }
        return { count: generated.length, patterns: generated };
    } catch (err) {
        console.error('Auto-mining error:', err);
        return { count: 0, patterns: [] };
    }
};

// 2. Generate and Mine Patterns from clusters
app.post('/api/blockchain/patterns/generate', verifyToken, checkRole(['officer', 'admin', 'citizen']), async (req, res) => {
    try {
        const result = await minePatterns();
        res.json({
            message: `Scanned and mined ${result.count} new Pattern Proofs.`,
            count: result.count,
            patterns: result.patterns
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to generate pattern proofs' });
    }
});

app.post('/api/subscribe', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required' });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Welcome to UIIS Impact Reports',
            text: `You have successfully subscribed to the Urban Water Intelligence System impact reports. We will keep you updated on the latest urban resilience insights.`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #00D2FF;">Welcome to UIIS Network</h2>
                    <p>You have successfully subscribed to the <strong>Urban Water Intelligence System</strong> mailing list.</p>
                    <p>We are committed to providing you with data-driven insights for a smarter, more resilient future.</p>
                    <p>Expect monthly updates on urban impact reports and platform enhancements.</p>
                    <br/>
                    <p style="font-size: 12px; color: #666;">If you did not request this subscription, please ignore this email.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`[EMAIL SERVICE] Subscription confirmed for ${email}`);
        res.json({ message: 'Subscription successful' });
    } catch (err) {
        console.error('Subscription error:', err);
        res.status(500).json({ error: 'Failed to subscribe' });
    }
});

const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));