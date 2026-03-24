const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// PRD Section 25: Standardized error response helper
const createErrorResponse = (code, message, details = null) => {
  const error = {
    error: {
      code,
      message
    }
  };
  if (details) {
    error.error.details = details;
  }
  return error;
};

// Common error codes per PRD Section 25
const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
};

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'trailwatch',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

// Multer configuration for local file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// PRD Section 7.3: Rate limiting - 10 reports per hour per user
const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 reports per hour
  message: { 
    error: {
      code: 'RATE_LIMIT_ERROR',
      message: 'Too many reports submitted. Please try again later.',
      details: { limit: 10, window: '1 hour' }
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.userId || req.ip
});

// JWT middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json(createErrorResponse(ErrorCodes.AUTHENTICATION_ERROR, 'Access token required'));
  }
  
  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json(createErrorResponse(ErrorCodes.AUTHORIZATION_ERROR, 'Invalid or expired token'));
    }
    req.user = user;
    next();
  });
};

// Initialize database tables
const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        reputation_score INTEGER DEFAULT 0,
        reports_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS trails (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        location GEOGRAPHY(POINT, 4326),
        city VARCHAR(100),
        state VARCHAR(100),
        difficulty VARCHAR(50),
        length_miles DECIMAL(5,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS reports (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        trail_id INTEGER REFERENCES trails(id),
        hazard_type VARCHAR(50) NOT NULL,
        description VARCHAR(100),
        image_url VARCHAR(255),
        location GEOGRAPHY(POINT, 4326),
        upvotes INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'active',
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS votes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        report_id INTEGER REFERENCES reports(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, report_id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_reports_location ON reports USING GIST(location);
      CREATE INDEX IF NOT EXISTS idx_reports_expires ON reports(expires_at);
      CREATE INDEX IF NOT EXISTS idx_trails_location ON trails USING GIST(location);
    `);
    console.log('Database tables initialized');
  } catch (err) {
    console.error('Database initialization error:', err);
  }
};

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email',
      [email, hashedPassword]
    );
    
    const token = jwt.sign(
      { userId: result.rows[0].id, email: result.rows[0].email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    res.json({ token, user: result.rows[0] });
  } catch (err) {
    res.status(400).json(createErrorResponse(ErrorCodes.VALIDATION_ERROR, err.message, { field: 'email' }));
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json(createErrorResponse(ErrorCodes.AUTHENTICATION_ERROR, 'Invalid credentials'));
    }
    
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.status(401).json(createErrorResponse(ErrorCodes.AUTHENTICATION_ERROR, 'Invalid credentials'));
    }
    
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    res.json({ token, user: { id: user.id, email: user.email, reputation_score: user.reputation_score } });
  } catch (err) {
    res.status(500).json(createErrorResponse(ErrorCodes.INTERNAL_ERROR, 'Authentication failed'));
  }
});

// Get reports within radius
app.get('/api/reports', async (req, res) => {
  try {
    const { lat, lng, radius = 5000 } = req.query; // radius in meters, default 5km
    
    const result = await pool.query(`
      SELECT r.*, t.name as trail_name, u.email as reporter_email,
        ST_X(r.location::geometry) as longitude,
        ST_Y(r.location::geometry) as latitude
      FROM reports r
      LEFT JOIN trails t ON r.trail_id = t.id
      LEFT JOIN users u ON r.user_id = u.id
      WHERE ST_DWithin(
        r.location,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        $3
      )
      AND r.expires_at > NOW()
      AND r.status = 'active'
      ORDER BY r.created_at DESC
    `, [lng, lat, radius]);
    
    res.json(result.rows);
  } catch (err) {
    res.status(500).json(createErrorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to fetch reports'));
  }
});

// Create report - with rate limiting (PRD Section 7.3: 10 reports/hour per user)
app.post('/api/reports', authenticateToken, reportLimiter, upload.single('image'), async (req, res) => {
  try {
    const { trail_id, hazard_type, description, lat, lng } = req.body;
    const userId = req.user.userId;
    
    // PRD: All reports expire after 48 hours
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48);
    
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    
    const result = await pool.query(`
      INSERT INTO reports (user_id, trail_id, hazard_type, description, image_url, 
        location, expires_at)
      VALUES ($1, $2, $3, $4, $5, ST_SetSRID(ST_MakePoint($6, $7), 4326)::geography, $8)
      RETURNING *
    `, [userId, trail_id, hazard_type, description, imageUrl, lng, lat, expiresAt]);
    
    // Update user reports count
    await pool.query(
      'UPDATE users SET reports_count = reports_count + 1 WHERE id = $1',
      [userId]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json(createErrorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to create report'));
  }
});

// Upvote report (PRD: One vote per user per report)
app.post('/api/reports/:id/upvote', authenticateToken, async (req, res) => {
  try {
    const reportId = req.params.id;
    const userId = req.user.userId;
    
    // Check if user already voted
    const existingVote = await pool.query(
      'SELECT * FROM votes WHERE user_id = $1 AND report_id = $2',
      [userId, reportId]
    );
    
    if (existingVote.rows.length > 0) {
      return res.status(400).json(createErrorResponse(ErrorCodes.VALIDATION_ERROR, 'Already upvoted this report'));
    }
    
    // Create new vote
    await pool.query(
      'INSERT INTO votes (user_id, report_id) VALUES ($1, $2)',
      [userId, reportId]
    );
    
    // Update report upvotes count
    await pool.query(`
      UPDATE reports 
      SET upvotes = (SELECT COUNT(*) FROM votes WHERE report_id = $1)
      WHERE id = $1
    `, [reportId]);
    
    res.json({ message: 'Upvote recorded' });
  } catch (err) {
    res.status(500).json(createErrorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to record upvote'));
  }
});

// Get trails near location
app.get('/api/trails', async (req, res) => {
  try {
    const { lat, lng, radius = 10000 } = req.query;
    
    const result = await pool.query(`
      SELECT *, 
        ST_X(location::geometry) as longitude,
        ST_Y(location::geometry) as latitude,
        ST_Distance(location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) as distance
      FROM trails
      WHERE ST_DWithin(
        location,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        $3
      )
      ORDER BY distance
    `, [lng, lat, radius]);
    
    res.json(result.rows);
  } catch (err) {
    res.status(500).json(createErrorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to fetch trails'));
  }
});

// Get high-confidence alerts near user
app.get('/api/alerts', authenticateToken, async (req, res) => {
  try {
    const { lat, lng, radius = 8047 } = req.query; // 5 miles in meters
    
    const result = await pool.query(`
      SELECT r.*, t.name as trail_name,
        ST_X(r.location::geometry) as longitude,
        ST_Y(r.location::geometry) as latitude
      FROM reports r
      LEFT JOIN trails t ON r.trail_id = t.id
      WHERE ST_DWithin(
        r.location,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        $3
      )
      AND r.upvotes >= 3
      AND r.expires_at > NOW()
      AND r.status = 'active'
      AND r.hazard_type IN ('flooding', 'ice', 'closed_trail')
      ORDER BY r.upvotes DESC, r.created_at DESC
    `, [lng, lat, radius]);
    
    res.json(result.rows);
  } catch (err) {
    res.status(500).json(createErrorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to fetch alerts'));
  }
});

// Admin: Get all reports (including expired)
app.get('/api/admin/reports', authenticateToken, async (req, res) => {
  try {
    // Simple admin check - in production, check for admin role
    const result = await pool.query(`
      SELECT r.*, t.name as trail_name, u.email as reporter_email
      FROM reports r
      LEFT JOIN trails t ON r.trail_id = t.id
      LEFT JOIN users u ON r.user_id = u.id
      ORDER BY r.created_at DESC
    `);
    
    res.json(result.rows);
  } catch (err) {
    res.status(500).json(createErrorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to fetch admin reports'));
  }
});

// Admin: Delete report
app.delete('/api/admin/reports/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM reports WHERE id = $1', [req.params.id]);
    res.json({ message: 'Report deleted' });
  } catch (err) {
    res.status(500).json(createErrorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to delete report'));
  }
});

// PRD: Token refresh endpoint
app.post('/api/auth/refresh', authenticateToken, async (req, res) => {
  try {
    const token = jwt.sign(
      { userId: req.user.userId, email: req.user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    res.json({ token, expires_in: 86400 });
  } catch (err) {
    res.status(500).json(createErrorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to refresh token'));
  }
});

// PRD: Get user profile
app.get('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, reputation_score, reports_count, created_at FROM users WHERE id = $1',
      [req.user.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json(createErrorResponse(ErrorCodes.NOT_FOUND, 'User not found'));
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json(createErrorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to fetch user profile'));
  }
});

// PRD: Update user profile
app.put('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const { email } = req.body;
    const result = await pool.query(
      'UPDATE users SET email = $1 WHERE id = $2 RETURNING id, email, reputation_score, reports_count, created_at',
      [email, req.user.userId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json(createErrorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to update profile'));
  }
});

// PRD: Get current user's reports
app.get('/api/users/reports', authenticateToken, async (req, res) => {
  try {
    const { status, limit = 20 } = req.query;
    let query = `
      SELECT r.*, t.name as trail_name,
        ST_X(r.location::geometry) as longitude,
        ST_Y(r.location::geometry) as latitude
      FROM reports r
      LEFT JOIN trails t ON r.trail_id = t.id
      WHERE r.user_id = $1
    `;
    const params = [req.user.userId];
    
    if (status) {
      query += ` AND r.status = $${params.length + 1}`;
      params.push(status);
    }
    
    query += ` ORDER BY r.created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);
    
    const result = await pool.query(query, params);
    res.json({ reports: result.rows });
  } catch (err) {
    res.status(500).json(createErrorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to fetch user reports'));
  }
});

// PRD: Admin flag report
app.put('/api/admin/reports/:id/flag', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "UPDATE reports SET status = 'flagged' WHERE id = $1 RETURNING *",
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json(createErrorResponse(ErrorCodes.NOT_FOUND, 'Report not found'));
    }
    res.json({ message: 'Report flagged', report: result.rows[0] });
  } catch (err) {
    res.status(500).json(createErrorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to flag report'));
  }
});

// PRD: Admin ban user
app.post('/api/admin/users/:id/ban', authenticateToken, async (req, res) => {
  try {
    // Set all user's reports to removed status
    await pool.query(
      "UPDATE reports SET status = 'removed' WHERE user_id = $1",
      [req.params.id]
    );
    // Note: In production, also deactivate user account
    res.json({ message: 'User banned and reports removed' });
  } catch (err) {
    res.status(500).json(createErrorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to ban user'));
  }
});

// Seed Chicago trails data
app.post('/api/seed/trails', async (req, res) => {
  try {
    const chicagoTrails = [
      { name: 'Busse Woods Trail', lat: 42.0285, lng: -87.9906, city: 'Elk Grove', state: 'IL', difficulty: 'Easy', length: 7.2, description: 'Loop trail around Busse Reservoir' },
      { name: 'Waterfall Glen', lat: 41.7802, lng: -87.9506, city: 'Darien', state: 'IL', difficulty: 'Moderate', length: 9.5, description: 'Scenic loop with waterfall' },
      { name: 'Des Plaines River Trail', lat: 42.1827, lng: -87.9211, city: 'Libertyville', state: 'IL', difficulty: 'Moderate', length: 31.0, description: 'Linear trail along Des Plaines River' },
      { name: 'Millennium Trail', lat: 42.2523, lng: -88.1535, city: 'Fox Lake', state: 'IL', difficulty: 'Easy', length: 10.0, description: 'Multi-use paved trail' },
      { name: 'Chicago Lakefront Trail', lat: 41.8781, lng: -87.6298, city: 'Chicago', state: 'IL', difficulty: 'Easy', length: 18.0, description: 'Scenic lakefront path' },
      { name: 'North Branch Trail', lat: 42.0531, lng: -87.7498, city: 'Chicago', state: 'IL', difficulty: 'Easy', length: 20.0, description: 'Forested trail along river' },
      { name: 'Poplar Creek Trail', lat: 42.0586, lng: -88.1867, city: 'Hoffman Estates', state: 'IL', difficulty: 'Easy', length: 8.0, description: 'Paved loop through forest preserve' },
      { name: 'Sag Valley Trail', lat: 41.6555, lng: -87.9045, city: 'Palos Park', state: 'IL', difficulty: 'Moderate', length: 15.0, description: 'Rolling terrain through woods' },
      { name: 'Tinley Creek Trail', lat: 41.5634, lng: -87.7934, city: 'Tinley Park', state: 'IL', difficulty: 'Easy', length: 12.0, description: 'Paved multi-use trail' },
      { name: 'Skokie Lagoons', lat: 42.1197, lng: -87.7636, city: 'Winnetka', state: 'IL', difficulty: 'Easy', length: 6.0, description: 'Waterfront trail system' }
    ];
    
    for (const trail of chicagoTrails) {
      await pool.query(`
        INSERT INTO trails (name, description, location, city, state, difficulty, length_miles)
        VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography, $5, $6, $7, $8)
        ON CONFLICT DO NOTHING
      `, [trail.name, trail.description, trail.lng, trail.lat, trail.city, trail.state, trail.difficulty, trail.length]);
    }
    
    res.json({ message: 'Chicago trails seeded successfully' });
  } catch (err) {
    res.status(500).json(createErrorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to seed trails'));
  }
});

// Start server
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`TrailWatch server running on port ${PORT}`);
  });
});
