-- 004_verification.sql: Deliverables with revision rounds and automated check reports

CREATE TABLE IF NOT EXISTS deliverables (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  talent_id INTEGER NOT NULL,
  round INTEGER NOT NULL CHECK (round IN (1, 2, 3)),
  link TEXT,
  notes TEXT,
  automated_check_status TEXT CHECK (automated_check_status IN ('passed', 'failed', 'not_applicable')),
  automated_check_report TEXT,
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (talent_id) REFERENCES users(id),
  UNIQUE (project_id, round)
);
