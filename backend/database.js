const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

async function getDBConnection() {
  return open({
    filename: './microintern.db',
    driver: sqlite3.Database
  });
}

async function setupDatabase() {
  const db = await getDBConnection();
  
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      type TEXT NOT NULL, -- 'student' or 'business'
      -- Student fields
      university TEXT,
      course TEXT,
      year_of_study TEXT,
      bio TEXT,
      skills TEXT,
      -- Business fields
      company_name TEXT,
      industry TEXT,
      company_size TEXT,
      website TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      budget INTEGER,
      duration_days INTEGER,
      status TEXT DEFAULT 'open', -- 'open', 'in_progress', 'review', 'completed'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      student_id INTEGER,
      pitch TEXT,
      status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id),
      FOREIGN KEY (student_id) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS deliverables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      student_id INTEGER,
      link TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id),
      FOREIGN KEY (student_id) REFERENCES users (id)
    );
  `);
  
  return db;
}

module.exports = { getDBConnection, setupDatabase };
