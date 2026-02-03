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
const { analyzeComplaint } = require('./ai_service'); // Modified: Removed detectPattern
const { askOfficerAssistant } = require('./gemini_service');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Security Check: Fail if JWT_SECRET is missing in production
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
    throw new Error("FATAL: JWT_SECRET is missing in environment variables. Server cannot start securely.");
}
const JWT_SECRET_KEY = process.env.JWT_SECRET || 'dev_secret_key_do_not_use_in_production';

// Middleware
app.use(cors({
    origin: [process.env.CLIENT_URL || 'http://localhost:5173', 'https://localhost:5173'],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads directory exists
if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
    fs.mkdirSync(path.join(__dirname, 'uploads'));
}

app.get('/', (req, res) => {
    res.send('Server is running');
});

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
        const verified = jwt.verify(token, JWT_SECRET_KEY);
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
                area TEXT,
                ward TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                resolved_at TIMESTAMP,
                resolution_remarks TEXT,
                resolution_images JSONB DEFAULT '[]',
                hash TEXT,
                previous_hash TEXT,
                ai_urgency TEXT,
                nonce INTEGER DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS otp_verifications (
                id SERIAL PRIMARY KEY,
                email TEXT NOT NULL,
                otp TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                complaint_id INTEGER REFERENCES complaints(id),
                type TEXT NOT NULL,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

        `);

        // Check and add new columns if they don't exist
        await pool.query(`
            ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS user_ward TEXT;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS user_area TEXT;
        `);

        console.log('Database initialized and schema updated.');
    } catch (err) {
        console.error('Error initializing database:', err);
    }
};

// Call initDb on start
initDb();


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

        // Cleanup: Remove OTPs older than 15 minutes to keep DB clean
        await pool.query("DELETE FROM otp_verifications WHERE created_at < NOW() - INTERVAL '15 minutes'");

        // Save to DB
        await pool.query('INSERT INTO otp_verifications (email, otp) VALUES ($1, $2)', [email, otp]);

        // Send Email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your Verification Code - UIIS (Urban Water Intelligence System)',
            text: `Your verification code is: ${otp}. It is valid for 10 minutes.`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #2563eb;">UIIS - Urban Water Intelligence System</h2>
                    <p>Your One-Time Password (OTP) for registration is:</p>
                    <h1 style="background: #f3f4f6; padding: 10px 20px; display: inline-block; border-radius: 8px; letter-spacing: 5px;">${otp}</h1>
                    <p>Please enter this code to complete your registration.</p>
                    <p style="font-size: 12px; color: #666; margin-top: 20px;">If you didn't request this code, please ignore this email.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`[EMAIL SERVICE] OTP successfully sent to ${email}`);

        res.json({ message: 'OTP sent successfully to your email' });
    } catch (err) {
        console.error('[EMAIL SERVICE ERROR]:', {
            message: err.message,
            stack: err.stack,
            code: err.code,
            command: err.command
        });
        res.status(500).json({
            error: 'Failed to send OTP email.',
            details: err.message,
            suggestion: 'Please check if the email service provider is blocking the request or if credentials expired.'
        });
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

        // OTP Expiry Check (10 minutes)
        const otpTime = new Date(result.rows[0].created_at).getTime();
        const currentTime = Date.now();
        const timeDiff = (currentTime - otpTime) / 1000 / 60; // in minutes

        if (timeDiff > 10) {
            return res.status(400).json({ error: 'OTP Expired. Please request a new one.' });
        }

        res.json({ message: 'OTP verified successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Verification failed' });
    }
});

// AUTH ROUTES
app.post('/api/auth/register', async (req, res) => {
    try {
        // Now accepting fullName and phone
        const { username, fullName, email, password, phone, role } = req.body;

        // Basic Check
        if (!username || !fullName || !password || !phone) {
            return res.status(400).json({ error: 'Username, Full Name, Password, and Phone Number are required.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert with full_name and phone
        const result = await pool.query(
            'INSERT INTO users (username, full_name, email, password, phone, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username, full_name, email, phone, role',
            [username, fullName, email, hashedPassword, phone, role || 'citizen']
        );

        const user = result.rows[0];
        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET_KEY, { expiresIn: '1d' });

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

        if (user.is_blocked) {
            return res.status(403).json({ error: 'Your account has been suspended. Please contact the administrator.' });
        }

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET_KEY, { expiresIn: '1d' });

        res.cookie('token', token, { httpOnly: true });
        res.json({ id: user.id, username: user.username, full_name: user.full_name, email: user.email, role: user.role });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get Current User (Session persistence)
app.get('/api/auth/me', verifyToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, username, full_name, email, role, phone, user_ward, user_area FROM users WHERE id = $1', [req.user.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Update User Profile
app.put('/api/profile', verifyToken, async (req, res) => {
    try {
        const { fullName, phone, user_ward, user_area } = req.body;

        const result = await pool.query(
            `UPDATE users 
             SET full_name = $1, phone = $2, user_ward = $3, user_area = $4 
             WHERE id = $5 
             RETURNING id, username, full_name, email, role, phone, user_ward, user_area`,
            [fullName, phone, user_ward, user_area, req.user.id]
        );

        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Profile update error:', err);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Logout Route
app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
});

// Complaint Routes
app.post('/api/complaints', verifyToken, checkRole(['citizen']), upload.array('images'), async (req, res) => {
    const client = await pool.connect(); // Use a client for Transaction
    try {
        const { location, description, area, ward } = req.body;

        // AI: Intelligent Analysis
        let aiAnalysis;
        try {
            aiAnalysis = await analyzeComplaint(description);
        } catch (error) {
            console.error("AI Analysis Failed:", error);
            aiAnalysis = { category: predictCategory(description), is_spam: false, urgency: 'Medium' };
        }

        // Fallback to heuristic if AI fails or key is missing
        const category = aiAnalysis?.category || predictCategory(description);

        if (aiAnalysis?.is_spam) {
            return res.status(400).json({ error: `Submission Rejected: The system detected this as invalid or spam (${aiAnalysis.spam_reason || "Nonsense detected"}). Please provide a valid description.` });
        }

        if (category === 'Non-Water Related') {
            return res.status(400).json({ error: 'This system only supports water-related issues. Please report other municipal problems (roads, electricity, etc.) to the appropriate department.' });
        }

        const ai_urgency = aiAnalysis?.urgency || 'Medium';

        const imagePaths = req.files.map(file => file.filename);

        // --- BLOCKCHAIN TRANSACTION START ---
        await client.query('BEGIN');
        // Lock the table (IN EXCLUSIVE MODE to prevent concurrent writes causing forks)
        await client.query('LOCK TABLE complaints IN EXCLUSIVE MODE');

        // Blockchain: Get last hash
        const lastComplaintResult = await client.query('SELECT hash FROM complaints ORDER BY id DESC LIMIT 1');
        const previousHash = lastComplaintResult.rows.length > 0 ? lastComplaintResult.rows[0].hash : '0000000000000000000000000000000000000000000000000000000000000000';

        // --- PROOF OF WORK (MINING) ---
        // Difficulty Reduced to avoid freezing server (User Req). 1 Zero.
        let nonce = 0;
        let hash = '';
        const difficulty = '0'; // Reduced from '000' for performance/main-thread safety
        const MAX_NONCE = 100000; // Safety break

        console.log(`[BLOCKCHAIN] Mining new complaint record...`);
        const startTime = Date.now();

        // Removed while(true) - Using loop with limit
        while (nonce < MAX_NONCE) {
            const dataToHash = `${req.user.id}${category}${location}${description}${area}${ward}${previousHash}${ai_urgency}${nonce}`;
            hash = crypto.createHash('sha256').update(dataToHash).digest('hex');

            if (hash.startsWith(difficulty)) {
                break;
            }
            nonce++;
        }

        const timeTaken = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`[BLOCKCHAIN] Block Mined! Nonce: ${nonce}, Time: ${timeTaken}s, Hash: ${hash}`);

        const result = await client.query(
            'INSERT INTO complaints (user_id, category, location, description, images, area, ward, previous_hash, hash, ai_urgency, nonce) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
            [req.user.id, category, location, description, JSON.stringify(imagePaths), area, ward, previousHash, hash, ai_urgency, nonce]
        );

        await client.query('COMMIT');
        // --- BLOCKCHAIN TRANSACTION END ---

        res.status(201).json(result.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error saving complaint:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        client.release();
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

        // --- Create Notification for the Citizen ---
        const complaint = result.rows[0];
        const notificationMessage = `Complaint #${complaint.id} (${complaint.category}) has been resolved. Remarks: ${remarks || 'No remarks provided.'}`;

        await pool.query(
            'INSERT INTO notifications (user_id, complaint_id, type, title, message) VALUES ($1, $2, $3, $4, $5)',
            [complaint.user_id, complaint.id, 'complaint_resolved', 'Issue Resolved', notificationMessage]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error resolving complaint' });
    }
});

// Officer AI Assistance
app.post('/api/officer/ask-ai', verifyToken, checkRole(['officer', 'admin']), async (req, res) => {
    try {
        const { complaintId, query } = req.body;

        // Fetch complaint details
        const result = await pool.query('SELECT * FROM complaints WHERE id = $1', [complaintId]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Complaint not found' });

        const complaint = result.rows[0];
        const aiResponse = await askOfficerAssistant(complaint, query);

        res.json(aiResponse);
    } catch (err) {
        console.error("AI Assistance Error:", err);
        res.status(500).json({ error: 'Failed to get AI response' });
    }
});

// --- ADMIN ROUTES ---

// 1. Get all users
app.get('/api/admin/users', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const result = await pool.query('SELECT id, username, full_name, email, role, is_blocked, created_at FROM users ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// 2. Appoint Officer
app.post('/api/admin/officers', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const { username, fullName, email, password } = req.body;

        const userCheck = await pool.query('SELECT * FROM users WHERE email = $1 OR username = $2', [email, username]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ error: 'Username or Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const role = 'officer';

        const result = await pool.query(
            'INSERT INTO users (username, full_name, email, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, full_name, email, role',
            [username, fullName || username, email, hashedPassword, role]
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

// 4. Block/Unblock User
app.put('/api/admin/users/:id/block', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { blocked } = req.body; // true or false

        // Prevent blocking admins
        const userCheck = await pool.query('SELECT role FROM users WHERE id = $1', [id]);
        if (userCheck.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        if (userCheck.rows[0].role === 'admin') return res.status(403).json({ error: 'Cannot block admins' });

        const result = await pool.query(
            'UPDATE users SET is_blocked = $1 WHERE id = $2 RETURNING id, username, is_blocked',
            [blocked, id]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update user status' });
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
        const difficulty = '0';

        for (const complaint of complaints) {
            const dataToHash = `${complaint.user_id}${complaint.category}${complaint.location}${complaint.description}${complaint.area || ''}${complaint.ward || ''}${complaint.previous_hash}${complaint.ai_urgency}${complaint.nonce}`;
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

        // Patterns verification removed


        res.json({
            isValid,
            totalRecords: complaints.length,

            lastVerifiedAt: new Date(),
            details: chainStatus
        });
    } catch (err) {
        console.error('Blockchain verification error:', err);
        res.status(500).json({ error: 'Failed to verify blockchain integrity' });
    }
});



// --- NOTIFICATION ROUTES ---

app.get('/api/notifications', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching notifications:', err);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

app.put('/api/notifications/:id/read', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING *',
            [id, req.user.id] // Ensure user owns the notification
        );

        if (result.rows.length === 0) return res.status(404).json({ error: 'Notification not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error marking notification as read:', err);
        res.status(500).json({ error: 'Failed to update notification' });
    }
});

app.post('/api/subscribe', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required' });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Welcome to UIIS - Urban Water Intelligence System',
            text: `You have successfully subscribed to the Urban Water Intelligence System impact reports. We will keep you updated on the latest urban resilience insights.`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #00D2FF;">Welcome to UIIS - Urban Water Intelligence System</h2>
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

// ============================================================================
// DATA & ANALYSIS ROUTES (Moved from Frontend)
// ============================================================================

const pipelineData = require('./data/pcmcPipelineData');
const contaminationAnalyzer = require('./utils/contaminationAnalyzer');
const dijkstraUtils = require('./utils/dijkstra');

// 1. Get Pipeline Network Data (Nodes, Edges, Areas)
app.get('/api/data/pipeline', (req, res) => {
    res.json({
        nodes: pipelineData.PIPELINE_NODES,
        edges: pipelineData.PIPELINE_EDGES,
        areas: pipelineData.PCMC_AREAS,
        nodeTypes: pipelineData.NODE_TYPES
    });
});

// 1.1 Identify Area/Ward (Offline GIS)
app.get('/api/gis/identify-area', (req, res) => {
    try {
        const { lat, lng } = req.query;
        if (!lat || !lng) return res.status(400).json({ error: 'Lat/Lng required' });

        const result = pipelineData.findNearestArea(parseFloat(lat), parseFloat(lng));
        res.json(result);
    } catch (err) {
        console.error('GIS Error:', err);
        res.status(500).json({ error: 'GIS Lookup Failed' });
    }
});

// 2. Correlate Complaints (Clustering)
app.post('/api/analysis/correlate', verifyToken, async (req, res) => {
    try {
        // Since we have the complaints in DB, we could fetch them here or accept them in body
        // For flexibility, let's look up complaints if IDs are passed, or use all active ones

        const result = await pool.query("SELECT * FROM complaints WHERE status != 'resolved'");
        const allComplaints = result.rows;

        const clusters = contaminationAnalyzer.correlateComplaints(allComplaints);
        res.json(clusters);
    } catch (err) {
        console.error('Correlation error:', err);
        res.status(500).json({ error: 'Analysis failed' });
    }
});

// 3. Optimal Route Planning (Dijkstra)
app.post('/api/analysis/route', verifyToken, (req, res) => {
    try {
        const { lat, lng } = req.body;
        if (!lat || !lng) return res.status(400).json({ error: 'Coordinates required' });

        const result = dijkstraUtils.findOptimalConnectionRoute(lat, lng);
        res.json(result);
    } catch (err) {
        console.error('Routing error:', err);
        res.status(500).json({ error: 'Route calculation failed' });
    }
});

// 4. Downstream Impact Analysis
app.post('/api/analysis/impact', verifyToken, async (req, res) => {
    try {
        const { complaintId } = req.body;

        // Fetch specific complaint details since the util expects full object
        const complaintResult = await pool.query('SELECT * FROM complaints WHERE id = $1', [complaintId]);
        if (complaintResult.rows.length === 0) return res.status(404).json({ error: 'Complaint not found' });

        const complaint = complaintResult.rows[0];
        const result = contaminationAnalyzer.findAffectedDownstream(complaint);
        res.json(result || { success: false, message: 'No downstream impact found' });
    } catch (err) {
        console.error('Impact analysis error:', err);
        res.status(500).json({ error: 'Impact analysis failed' });
    }
});

// 5. Generate Recommendations
app.post('/api/analysis/recommendations', verifyToken, async (req, res) => {
    try {
        const { complaintId } = req.body;

        const complaintResult = await pool.query('SELECT * FROM complaints WHERE id = $1', [complaintId]);
        if (complaintResult.rows.length === 0) return res.status(404).json({ error: 'Complaint not found' });

        const complaint = complaintResult.rows[0];

        // Fetch other active complaints for correlation context
        const allComplaintsResult = await pool.query("SELECT * FROM complaints WHERE status != 'resolved'");
        const allComplaints = allComplaintsResult.rows;

        // Run deep analysis
        const sourceAnalysis = contaminationAnalyzer.analyzeContaminationSource(complaint, allComplaints);

        // Generate base recommendations
        const recommendations = contaminationAnalyzer.generateRecommendations(complaint, []);

        // If specific sources found, add high-priority recommendation
        if (sourceAnalysis && sourceAnalysis.potentialSources.length > 0) {
            const topSource = sourceAnalysis.potentialSources[0];
            recommendations.unshift({
                action: 'INSPECT',
                title: 'Potential Source Identified',
                description: `Possible cause: ${topSource.description} (${Math.round(topSource.distance * 1000)}m away).`,
                priority: 'CRITICAL',
                estimatedTime: '1 hour',
                sourceId: topSource.id,
                sourceCoordinates: topSource.coordinates
            });
        }

        res.json({
            recommendations,
            analysis: sourceAnalysis
        });
    } catch (err) {
        console.error('Recommendation error:', err);
        res.status(500).json({ error: 'Failed to generate recommendations' });
    }
});

// 6. Prioritize Complaints
app.post('/api/analysis/prioritize', verifyToken, async (req, res) => {
    try {
        // Fetch all active complaints
        const result = await pool.query("SELECT * FROM complaints WHERE status != 'resolved'");
        const allComplaints = result.rows;

        const prioritized = contaminationAnalyzer.prioritizeComplaints(allComplaints);
        res.json(prioritized);
    } catch (err) {
        console.error('Prioritization error:', err);
        res.status(500).json({ error: 'Prioritization failed' });
    }
});

// ============================================================================
// GUEST PUBLIC ROUTES (No Auth Required)
// ============================================================================

// Guest: Get Officer Email by Area (for letter generation)
app.get('/api/guest/get-officer-email', async (req, res) => {
    try {
        const { area } = req.query;

        if (!area) {
            return res.status(400).json({ error: 'Area is required' });
        }

        // Look up officers assigned to this area
        const result = await pool.query(
            `SELECT email, full_name, user_area FROM users 
             WHERE role = 'officer' AND LOWER(user_area) = LOWER($1) 
             LIMIT 1`,
            [area]
        );

        if (result.rows.length > 0) {
            const officer = result.rows[0];
            res.json({
                found: true,
                officerName: officer.full_name,
                officerEmail: officer.email,
                area: officer.user_area
            });
        } else {
            // Fallback: Return generic contact (Government Sourced)
            res.json({
                found: false,
                officerName: pipelineData.DEPARTMENT_CONTACT.name,
                officerEmail: pipelineData.DEPARTMENT_CONTACT.email,
                officerPhone: pipelineData.DEPARTMENT_CONTACT.phone,
                area: area,
                message: 'No specific officer assigned to this area. Using official department contact.'
            });
        }
    } catch (err) {
        console.error('Guest officer lookup error:', err);
        res.status(500).json({ error: 'Failed to lookup officer' });
    }
});

// Guest: Generate Letter with AI
app.post('/api/guest/generate-letter', async (req, res) => {
    try {
        const { issue, location, area, officerName, ward } = req.body;

        if (!issue || issue.length < 5) {
            return res.status(400).json({ error: 'Please provide a valid issue description.' });
        }

        const { generateCitizenLetter } = require('./gemini_service');
        const letter = await generateCitizenLetter({ issue, location, area, officerName, ward });

        res.json({ letter });
    } catch (err) {
        console.error('Letter generation error:', err);
        res.status(500).json({ error: 'Failed to generate letter' });
    }
});

const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));