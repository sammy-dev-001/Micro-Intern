const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

async function check() {
  const db = await open({ filename: './microintern.db', driver: sqlite3.Database });
  const cols = await db.all("PRAGMA table_info(users)");
  console.log("users columns:", cols.map(c => c.name));
}

check().catch(console.error);
