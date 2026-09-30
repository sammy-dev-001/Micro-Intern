const express = require('express');
const cors = require('cors');
const { setupDatabase, getDBConnection } = require('./database');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// Initialize Database
setupDatabase().then(() => {
  console.log('SQLite Database Initialized.');
}).catch(err => {
  console.error('Database setup failed:', err);
});

// ============================================================
// --- AUTH ROUTES ---
// ============================================================

// Register a new user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, type,
            // Student fields
            university, course, year_of_study, bio,
            // Business fields
            company_name, industry, company_size, website } = req.body;

    if (!name || !email || !password || !type) {
      return res.status(400).json({ error: 'Name, email, password, and type are required.' });
    }

    const db = await getDBConnection();

    // Check if email already exists
    const existing = await db.get('SELECT id FROM users WHERE email = ?', email);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const result = await db.run(
      `INSERT INTO users (name, email, password, type, university, course, year_of_study, bio, company_name, industry, company_size, website) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, email, password, type, university || null, course || null, year_of_study || null, bio || null,
       company_name || null, industry || null, company_size || null, website || null]
    );
    
    const user = await db.get('SELECT id, name, email, type, university, course, company_name, industry FROM users WHERE id = ?', result.lastID);
    res.status(201).json({ user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const db = await getDBConnection();
    const user = await db.get(
      'SELECT id, name, email, type, university, course, company_name, industry FROM users WHERE email = ? AND password = ?',
      [email, password]
    );
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// --- USER ROUTES ---
// ============================================================

app.get('/api/users/:id', async (req, res) => {
  try {
    const db = await getDBConnection();
    const user = await db.get(
      'SELECT id, name, email, type, university, course, year_of_study, bio, company_name, industry, created_at FROM users WHERE id = ?',
      req.params.id
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/:id/dashboard', async (req, res) => {
  try {
    const studentId = req.params.id;
    const db = await getDBConnection();
    
    const user = await db.get(
      `SELECT name, university, course, year_of_study, bio FROM users WHERE id = ?`,
      studentId
    );
    
    const stats = await db.get(`
      SELECT 
        COUNT(p.id) as projects_completed,
        SUM(p.budget) as total_earnings
      FROM projects p
      JOIN applications a ON p.id = a.project_id
      WHERE a.student_id = ? AND a.status = 'accepted' AND p.status = 'completed'
    `, studentId);

    const history = await db.all(`
      SELECT 
        p.title, p.budget, p.business_id, u.name as business_name, 
        d.link as deliverable_link, d.created_at as completed_at
      FROM projects p
      JOIN applications a ON p.id = a.project_id
      JOIN users u ON p.business_id = u.id
      LEFT JOIN deliverables d ON p.id = d.project_id AND d.student_id = a.student_id
      WHERE a.student_id = ? AND a.status = 'accepted' AND p.status = 'completed'
      ORDER BY p.id DESC
    `, studentId);

    res.json({
      user: {
        name: user ? user.name : 'Unknown User',
        university: user ? user.university : null,
        course: user ? user.course : null,
        bio: user ? user.bio : null,
      },
      stats: {
        earnings: stats.total_earnings || 0,
        projects: stats.projects_completed || 0,
        rating: 5.0,
        onTime: 100
      },
      history
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Business dashboard - get all projects for a business
app.get('/api/users/:id/projects', async (req, res) => {
  try {
    const businessId = req.params.id;
    const db = await getDBConnection();
    const projects = await db.all(`
      SELECT p.*, 
        (SELECT COUNT(*) FROM applications a WHERE a.project_id = p.id) as applicant_count
      FROM projects p
      WHERE p.business_id = ?
      ORDER BY p.created_at DESC
    `, businessId);
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// --- PROJECT ROUTES ---
// ============================================================

app.post('/api/projects', async (req, res) => {
  try {
    const { business_id, title, description, budget, duration_days } = req.body;
    const db = await getDBConnection();
    const result = await db.run(
      'INSERT INTO projects (business_id, title, description, budget, duration_days) VALUES (?, ?, ?, ?, ?)',
      [business_id, title, description, budget, duration_days]
    );
    res.status(201).json({ id: result.lastID, title, status: 'open' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/projects', async (req, res) => {
  try {
    const db = await getDBConnection();
    const projects = await db.all(`
      SELECT p.*, u.name as business_name,
        (SELECT COUNT(*) FROM applications a WHERE a.project_id = p.id) as applicant_count
      FROM projects p 
      JOIN users u ON p.business_id = u.id
      WHERE p.status = 'open'
      ORDER BY p.created_at DESC
    `);
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/projects/:id', async (req, res) => {
  try {
    const db = await getDBConnection();
    const project = await db.get(`
      SELECT p.*, u.name as business_name 
      FROM projects p 
      JOIN users u ON p.business_id = u.id
      WHERE p.id = ?
    `, req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// --- APPLICATION ROUTES ---
// ============================================================

app.post('/api/applications', async (req, res) => {
  try {
    const { project_id, student_id, pitch } = req.body;
    const db = await getDBConnection();

    // Prevent duplicate applications
    const existing = await db.get('SELECT id FROM applications WHERE project_id = ? AND student_id = ?', [project_id, student_id]);
    if (existing) {
      return res.status(409).json({ error: 'You have already applied to this project.' });
    }

    const result = await db.run(
      'INSERT INTO applications (project_id, student_id, pitch) VALUES (?, ?, ?)',
      [project_id, student_id, pitch]
    );
    res.status(201).json({ id: result.lastID, status: 'pending' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/projects/:id/applications', async (req, res) => {
  try {
    const db = await getDBConnection();
    const applications = await db.all(`
      SELECT a.*, u.name as student_name, u.university, u.course
      FROM applications a 
      JOIN users u ON a.student_id = u.id 
      WHERE a.project_id = ?
    `, req.params.id);
    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// --- WORKSPACE & DELIVERABLES ROUTES ---
// ============================================================

app.post('/api/projects/:id/select-applicant', async (req, res) => {
  try {
    const { application_id } = req.body;
    const db = await getDBConnection();
    await db.run('UPDATE applications SET status = ? WHERE id = ?', ['accepted', application_id]);
    await db.run('UPDATE projects SET status = ? WHERE id = ?', ['in_progress', req.params.id]);
    res.json({ success: true, project_id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/projects/:id/deliverables', async (req, res) => {
  try {
    const { student_id, link, notes } = req.body;
    const db = await getDBConnection();
    await db.run(
      'INSERT INTO deliverables (project_id, student_id, link, notes) VALUES (?, ?, ?, ?)',
      [req.params.id, student_id, link, notes]
    );
    await db.run('UPDATE projects SET status = ? WHERE id = ?', ['review', req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/projects/:id/deliverable', async (req, res) => {
  try {
    const db = await getDBConnection();
    const deliverable = await db.get(`
      SELECT d.*, u.name as student_name 
      FROM deliverables d
      JOIN users u ON d.student_id = u.id
      WHERE d.project_id = ?
      ORDER BY d.created_at DESC LIMIT 1
    `, req.params.id);
    if (!deliverable) return res.status(404).json({ error: 'Deliverable not found' });
    res.json(deliverable);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/projects/:id/approve', async (req, res) => {
  try {
    const db = await getDBConnection();
    await db.run('UPDATE projects SET status = ? WHERE id = ?', ['completed', req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running at http://localhost:${PORT}`);
});
