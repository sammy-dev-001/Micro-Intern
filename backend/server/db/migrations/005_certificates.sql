-- 005_certificates.sql: Certificates and certificate events log

CREATE TABLE IF NOT EXISTS certificates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  talent_id INTEGER NOT NULL,
  snapshot_json TEXT NOT NULL,
  snapshot_hash TEXT NOT NULL,
  issued_at DATETIME NOT NULL,
  superseded_by INTEGER,
  revoked_at DATETIME,
  pdf_path TEXT,
  pdf_generated_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (talent_id) REFERENCES users(id),
  FOREIGN KEY (superseded_by) REFERENCES certificates(id)
);

CREATE TABLE IF NOT EXISTS certificate_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  certificate_id INTEGER NOT NULL,
  event TEXT NOT NULL CHECK (event IN ('issued', 'pdf_generated', 'viewed', 'superseded', 'revoked')),
  actor_id INTEGER,
  metadata_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (certificate_id) REFERENCES certificates(id) ON DELETE CASCADE,
  FOREIGN KEY (actor_id) REFERENCES users(id)
);
