require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Database Setup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function initDB() {
  try {
    // Photos table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS photos (
        id SERIAL PRIMARY KEY,
        filename TEXT NOT NULL,
        supabase_path TEXT NOT NULL,
        public_url TEXT NOT NULL,
        caption TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Tools table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tools (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Philosophy table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS philosophy (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,        content TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Misc/Experiments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS misc (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT,
        url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Sessions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        session_token TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMPTZ NOT NULL
      )
    `);

    console.log('✓ Database initialized with all tables');
  } catch (err) {
    console.error('✗ Database init failed:', err.message);
  }
}
initDB();

// Supabase Setup
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Middleware
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// Auth Middlewarefunction requireAuth(req, res, next) {
  if (req.session.authenticated) {
    return next();
  }
  res.redirect('/login');
}

// Routes - Main Pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/art', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'art.html'));
});

app.get('/philosophy', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'philosophy.html'));
});

app.get('/tools', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'tools.html'));
});

app.get('/misc', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'misc.html'));
});

// Admin Login
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/login', async (req, res) => {
  const { password } = req.body;
  const match = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);
  
  if (match) {
    req.session.authenticated = true;
    res.redirect('/admin');
  } else {
    res.send('<script>alert("Wrong password"); window.location="/login"</script>');
  }
});

// Admin Dashboard
app.get('/admin', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// API - Photos
app.get('/api/photos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM photos ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/upload', requireAuth, multer().single('photo'), async (req, res) => {
  try {
    const { caption } = req.body;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileName = Date.now() + '-' + file.originalname;
    const { data, error } = await supabase.storage
      .from('portfolio-photos')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype
      });

    if (error) {
      throw error;
    }

    const {  urlData } = supabase.storage
      .from('portfolio-photos')
      .getPublicUrl(fileName);

    await pool.query(
      'INSERT INTO photos (filename, supabase_path, public_url, caption) VALUES ($1, $2, $3, $4)',
      [file.originalname, fileName, urlData.publicUrl, caption || '']
    );

    res.json({ success: true, url: urlData.publicUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
app.delete('/api/photos/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM photos WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API - Tools
app.get('/api/tools', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tools ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tools', requireAuth, async (req, res) => {
  try {
    const { name, url, description } = req.body;
    
    if (!name || !url) {
      return res.status(400).json({ error: 'Name and URL are required' });
    }

    await pool.query(
      'INSERT INTO tools (name, url, description) VALUES ($1, $2, $3)',
      [name, url, description || '']
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/tools/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM tools WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// API - Philosophy
app.get('/api/philosophy', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM philosophy ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/philosophy', requireAuth, async (req, res) => {
  try {
    const { title, content } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    await pool.query(
      'INSERT INTO philosophy (title, content) VALUES ($1, $2)',
      [title, content]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/philosophy/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM philosophy WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API - Misc
app.get('/api/misc', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM misc ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/misc', requireAuth, async (req, res) => {
  try {
    const { title, content, url } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    await pool.query(
      'INSERT INTO misc (title, content, url) VALUES ($1, $2, $3)',
      [title, content || '', url || '']
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/misc/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM misc WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ Visit http://localhost:${PORT}`);
});