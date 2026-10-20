const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const DB_PATH = process.env.DATABASE_PATH || path.resolve(__dirname, '../../microintern.db');

let _dbInstance = null;

async function getDBConnection() {
  if (_dbInstance) {
    return _dbInstance;
  }

  const db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database
  });

  // Enable WAL mode for better concurrency and foreign keys for integrity
  await db.exec('PRAGMA foreign_keys = ON;');
  await db.exec('PRAGMA journal_mode = WAL;');

  _dbInstance = db;
  return db;
}

async function runMigrations(db = null) {
  const connection = db || (await getDBConnection());

  // Create migrations tracker table
  await connection.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT UNIQUE NOT NULL,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const migrationsDir = path.resolve(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const existing = await connection.get(
      'SELECT id FROM schema_migrations WHERE filename = ?',
      file
    );

    if (!existing) {
      console.log(`Applying migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await connection.exec(sql);
      await connection.run(
        'INSERT INTO schema_migrations (filename) VALUES (?)',
        file
      );
      console.log(`Applied migration: ${file}`);
    }
  }

  return connection;
}

module.exports = {
  getDBConnection,
  runMigrations,
  DB_PATH
};
