-- 001_init.sql: Core users, profiles, normalized skills, and files

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('talent', 'business')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS talent_profiles (
  user_id INTEGER PRIMARY KEY,
  university TEXT,
  course TEXT,
  year_of_study INTEGER,
  bio TEXT,
  kyc_status TEXT NOT NULL DEFAULT 'none' CHECK (kyc_status IN ('none', 'pending', 'verified')),
  pandascrow_account_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS business_profiles (
  user_id INTEGER PRIMARY KEY,
  company_name TEXT,
  industry TEXT,
  company_size TEXT,
  website TEXT,
  pandascrow_account_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS skills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL
);

INSERT OR IGNORE INTO skills (name) VALUES 
  ('Data Cleaning'),
  ('Social Media Content'),
  ('Data Entry'),
  ('Basic Web Work');

CREATE TABLE IF NOT EXISTS talent_skills (
  talent_id INTEGER NOT NULL,
  skill_id INTEGER NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('self_declared', 'verified')),
  verified_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (talent_id, skill_id),
  FOREIGN KEY (talent_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS project_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER,
  role TEXT NOT NULL CHECK (role IN ('input', 'output', 'deliverable')),
  storage_path TEXT NOT NULL,
  original_name TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  uploaded_by INTEGER NOT NULL,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
);
