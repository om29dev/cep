const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-it';

// Configure storage in User Home/cep/images
const uploadDir = path.join(os.homedir(), 'cep', 'images');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`Created directory: ${uploadDir}`);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

app.use(cors({
    origin: 'http://localhost:5173', // Vite default port
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(uploadDir));
app.use(cookieParser());
// Serve static files from the images directory
app.use('/images', express.static(uploadDir));

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Initialize database
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
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Migration for existing tables
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='complaints' AND column_name='user_id') THEN
                    ALTER TABLE complaints ADD COLUMN user_id INTEGER REFERENCES users(id);
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='aadhar_no') THEN
                    ALTER TABLE users ADD COLUMN aadhar_no TEXT;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='aadhar_photo') THEN
                    ALTER TABLE users ADD COLUMN aadhar_photo TEXT;
                END IF;
            END $$;

            CREATE TABLE IF NOT EXISTS otp_verifications (
                id SERIAL PRIMARY KEY,
                email TEXT NOT NULL,
                otp TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

        `);
        console.log('Database initialized');
    } catch (err) {
        console.error('Error initializing database:', err);
    }
};

initDb();

// Middlewares
const verifyToken = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Access denied' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

const checkRole = (roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Permission denied' });
    }
    next();
};

// Email Transporter
const transporter = nodemailer.createTransport({
    service: 'gmail', // or configured via env variables for flexibility
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Auth Routes
app.post('/api/auth/send-otp', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required' });

        // Generate 6 digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Store in DB (Clean up old OTPhs for this email first)
        await pool.query('DELETE FROM otp_verifications WHERE email = $1', [email]);
        await pool.query('INSERT INTO otp_verifications (email, otp) VALUES ($1, $2)', [email, otp]);

        // Send Email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your Registration OTP',
            text: `Your OTP for registration is: ${otp}. It is valid for 10 minutes.`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Email send error:', error);
                // For development fallback if email fails (remove in production!)
                // return res.status(200).json({ message: 'OTP Generated (Email Failed)', devOtp: otp });
                return res.status(500).json({ error: 'Failed to send email' });
            } else {
                res.json({ message: 'OTP sent successfully' });
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error processing OTP request' });
    }
});

app.post('/api/auth/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        const result = await pool.query(
            'SELECT * FROM otp_verifications WHERE email = $1 AND otp = $2 AND created_at > NOW() - INTERVAL \'10 minutes\'',
            [email, otp]
        );

        if (result.rows.length > 0) {
            // OTP Valid
            await pool.query('DELETE FROM otp_verifications WHERE email = $1', [email]); // Consume OTP
            res.json({ message: 'OTP Verified' });
        } else {
            res.status(400).json({ error: 'Invalid or expired OTP' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error verifying OTP' });
    }
});

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const role = 'citizen';

        const result = await pool.query(
            'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
            [username, email, hashedPassword, role]
        );

        const user = result.rows[0];
        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 86400000 // 24 hours
        });

        res.status(201).json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'User registration failed' });
    }
});


app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 86400000
        });

        res.json({ id: user.id, username: user.username, email: user.email, role: user.role });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Login failed' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out' });
});

app.get('/api/auth/me', verifyToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, username, email, role FROM users WHERE id = $1', [req.user.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching user' });
    }
});

// Complaint Routes
app.post('/api/complaints', verifyToken, checkRole(['citizen']), upload.array('images'), async (req, res) => {
    try {
        const { category, location, description } = req.body;
        const imagePaths = req.files.map(file => file.filename);

        const result = await pool.query(
            'INSERT INTO complaints (user_id, category, location, description, images) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [req.user.id, category, location, description, JSON.stringify(imagePaths)]
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
        if (req.user.role === 'officer') {
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

app.patch('/api/complaints/:id/status', verifyToken, checkRole(['officer']), async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const result = await pool.query(
            'UPDATE complaints SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Complaint not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error updating status' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

