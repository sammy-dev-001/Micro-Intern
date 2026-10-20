-- 002_escrow.sql: Projects, Escrows, and Payouts

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL CHECK (task_type IN ('data_cleaning', 'social_media', 'data_entry', 'web_basic')),
  verification_method TEXT NOT NULL CHECK (verification_method IN ('automated_diff', 'manual')),
  budget_kobo INTEGER NOT NULL,
  duration_days INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'open', 'assigned', 'in_progress', 'submitted',
    'in_review', 'changes_requested', 'approved', 'completed', 'cancelled'
  )),
  assigned_talent_id INTEGER,
  assigned_mentor_id INTEGER,
  requires_mentor INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES users(id),
  FOREIGN KEY (assigned_talent_id) REFERENCES users(id),
  FOREIGN KEY (assigned_mentor_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS escrows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL UNIQUE,
  business_id INTEGER NOT NULL,
  amount_kobo INTEGER NOT NULL,
  pandascrow_escrow_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending_funding' CHECK (status IN (
    'pending_funding', 'funded', 'release_pending', 'released', 'refunded', 'disputed'
  )),
  funded_at DATETIME,
  released_at DATETIME,
  payout_ref TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (business_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS payouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  escrow_id INTEGER NOT NULL,
  talent_id INTEGER NOT NULL,
  amount_kobo INTEGER NOT NULL,
  pandascrow_transaction_ref TEXT UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (escrow_id) REFERENCES escrows(id),
  FOREIGN KEY (talent_id) REFERENCES users(id)
);
