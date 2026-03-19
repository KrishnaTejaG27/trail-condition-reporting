const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

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

// JWT middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
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
        downvotes INTEGER DEFAULT 0,
        trust_score INTEGER DEFAULT 0,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE
      );
      
      CREATE TABLE IF NOT EXISTS votes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        report_id INTEGER REFERENCES reports(id),
        vote_type VARCHAR(10) NOT NULL,
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
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    res.json({ token, user: { id: user.id, email: user.email, reputation_score: user.reputation_score } });
  } catch (err) {
    res.status(400).json({ error: err.message });
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
      AND r.is_active = TRUE
      ORDER BY r.created_at DESC
    `, [lng, lat, radius]);
    
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create report
app.post('/api/reports', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { trail_id, hazard_type, description, lat, lng } = req.body;
    const userId = req.user.userId;
    
    // Calculate expiration based on hazard type
    const expirationHours = {
      'Mud': 24,
      'Flooding': 12,
      'Ice/Snow': 48,
      'Obstruction': 72,
      'Closed': 168, // 7 days for closures
      'Other': 24
    };
    
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + (expirationHours[hazard_type] || 24));
    
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const photoBonus = req.file ? 2 : 0;
    
    const result = await pool.query(`
      INSERT INTO reports (user_id, trail_id, hazard_type, description, image_url, 
        location, expires_at, trust_score)
      VALUES ($1, $2, $3, $4, $5, ST_SetSRID(ST_MakePoint($6, $7), 4326)::geography, $8, $9)
      RETURNING *
    `, [userId, trail_id, hazard_type, description, imageUrl, lng, lat, expiresAt, photoBonus]);
    
    // Update user reports count
    await pool.query(
      'UPDATE users SET reports_count = reports_count + 1 WHERE id = $1',
      [userId]
    );
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Vote on report
app.post('/api/reports/:id/vote', authenticateToken, async (req, res) => {
  try {
    const reportId = req.params.id;
    const { vote_type } = req.body; // 'up' or 'down'
    const userId = req.user.userId;
    
    // Check if user already voted
    const existingVote = await pool.query(
      'SELECT * FROM votes WHERE user_id = $1 AND report_id = $2',
      [userId, reportId]
    );
    
    if (existingVote.rows.length > 0) {
      // Update existing vote
      await pool.query(
        'UPDATE votes SET vote_type = $1 WHERE user_id = $2 AND report_id = $3',
        [vote_type, userId, reportId]
      );
    } else {
      // Create new vote
      await pool.query(
        'INSERT INTO votes (user_id, report_id, vote_type) VALUES ($1, $2, $3)',
        [userId, reportId, vote_type]
      );
    }
    
    // Update report vote counts and trust score
    await pool.query(`
      UPDATE reports 
      SET upvotes = (SELECT COUNT(*) FROM votes WHERE report_id = $1 AND vote_type = 'up'),
          downvotes = (SELECT COUNT(*) FROM votes WHERE report_id = $1 AND vote_type = 'down'),
          trust_score = ((SELECT COUNT(*) FROM votes WHERE report_id = $1 AND vote_type = 'up') - 
                        (SELECT COUNT(*) FROM votes WHERE report_id = $1 AND vote_type = 'down')) + 
                        CASE WHEN image_url IS NOT NULL THEN 2 ELSE 0 END
      WHERE id = $1
    `, [reportId]);
    
    res.json({ message: 'Vote recorded' });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
    res.status(500).json({ error: err.message });
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
      AND r.trust_score >= 5
      AND r.expires_at > NOW()
      AND r.is_active = TRUE
      AND r.hazard_type IN ('Flooding', 'Ice/Snow', 'Closed')
      ORDER BY r.trust_score DESC, r.created_at DESC
    `, [lng, lat, radius]);
    
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
    res.status(500).json({ error: err.message });
  }
});

// Admin: Delete report
app.delete('/api/admin/reports/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM reports WHERE id = $1', [req.params.id]);
    res.json({ message: 'Report deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
    res.status(500).json({ error: err.message });
  }
});

// Start server
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`TrailWatch server running on port ${PORT}`);
  });
});
