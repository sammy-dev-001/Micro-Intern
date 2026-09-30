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

// --- USER ROUTES ---
app.post('/api/users', async (req, res) => {
  try {
    const { name, email, type } = req.body;
    const db = await getDBConnection();
    const result = await db.run(
      'INSERT INTO users (name, email, type) VALUES (?, ?, ?)',
      [name, email, type]
    );
    res.status(201).json({ id: result.lastID, name, email, type });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const db = await getDBConnection();
    const user = await db.get('SELECT * FROM users WHERE id = ?', req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- PROJECT ROUTES ---
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
    // Get all projects with business details
    const projects = await db.all(`
      SELECT p.*, u.name as business_name 
      FROM projects p 
      JOIN users u ON p.business_id = u.id
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
    const project = await db.get('SELECT * FROM projects WHERE id = ?', req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- APPLICATION ROUTES ---
app.post('/api/applications', async (req, res) => {
  try {
    const { project_id, student_id, pitch } = req.body;
    const db = await getDBConnection();
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
      SELECT a.*, u.name as student_name 
      FROM applications a 
      JOIN users u ON a.student_id = u.id 
      WHERE a.project_id = ?
    `, req.params.id);
    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- WORKSPACE & DELIVERABLES ROUTES ---
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
