/**
 * scripts/migrate_prototype.js
 * 
 * Migration script matching Section 8.3 of the backend rebuild spec:
 * - Reads old SQLite database
 * - Runs new schema migrations
 * - Maps student -> talent (student_id -> talent_id)
 * - Converts budget in Naira to budget_kobo (budget * 100)
 * - Drops old plaintext passwords (everyone must re-register or set a new password)
 * - Carries users + projects only
 * - Marks all carried projects as 'cancelled' (since none had escrow)
 * - Normalizes existing student skills into talent_skills (self_declared)
 */

const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const { runMigrations, DB_PATH } = require('../server/db');

async function migrate() {
  console.log('--- Starting Prototype Data Migration ---');

  if (!fs.existsSync(DB_PATH)) {
    console.log(`Database file at ${DB_PATH} not found. Running fresh migrations.`);
    const db = await open({ filename: DB_PATH, driver: sqlite3.Database });
    await runMigrations(db);
    console.log('Fresh migrations completed.');
    return;
  }

  // Backup current db first
  const backupPath = `${DB_PATH}.prototype-backup-${Date.now()}`;
  fs.copyFileSync(DB_PATH, backupPath);
  console.log(`Backed up existing database to: ${backupPath}`);

  // Connect to existing db
  const db = await open({ filename: DB_PATH, driver: sqlite3.Database });

  // Check if old tables exist
  const tableCheck = await db.all("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('users', 'projects')");
  const existingTableNames = tableCheck.map(t => t.name);

  let oldUsers = [];
  let oldProjects = [];

  if (existingTableNames.includes('users')) {
    // Check if users has the old plaintext 'password' column
    const cols = await db.all("PRAGMA table_info(users)");
    const colNames = cols.map(c => c.name);
    if (colNames.includes('password') && !colNames.includes('password_hash')) {
      console.log('Detected prototype schema in users table. Reading legacy data...');
      oldUsers = await db.all('SELECT * FROM users');
    }
  }

  if (existingTableNames.includes('projects')) {
    const cols = await db.all("PRAGMA table_info(projects)");
    const colNames = cols.map(c => c.name);
    if (colNames.includes('budget') && !colNames.includes('budget_kobo')) {
      console.log('Detected prototype schema in projects table. Reading legacy data...');
      oldProjects = await db.all('SELECT * FROM projects');
    }
  }

  if (oldUsers.length === 0 && oldProjects.length === 0) {
    console.log('No legacy prototype data to migrate, or database is already on new schema. Applying migrations...');
    await runMigrations(db);
    console.log('Migrations up to date.');
    return;
  }

  // If we had old tables that need schema replacement:
  console.log(`Carrying forward ${oldUsers.length} users and ${oldProjects.length} projects...`);

  // Drop old prototype tables to let new migrations run cleanly
  await db.exec('PRAGMA foreign_keys = OFF;');
  await db.exec(`
    DROP TABLE IF EXISTS deliverables;
    DROP TABLE IF EXISTS applications;
    DROP TABLE IF EXISTS projects;
    DROP TABLE IF EXISTS users;
  `);

  // Run new migrations
  await runMigrations(db);

  // Re-insert users with new structure
  for (const u of oldUsers) {
    const userType = u.type === 'student' ? 'talent' : 'business';
    // Set invalid unusable password hash so old plaintext password is dropped
    const unusableHash = '!RE_REGISTRATION_REQUIRED_' + Math.random().toString(36).substring(2);

    const res = await db.run(
      `INSERT INTO users (id, name, email, password_hash, type, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP)`,
      [u.id, u.name, u.email, unusableHash, userType, u.created_at]
    );

    if (userType === 'talent') {
      const yearInt = u.year_of_study ? parseInt(u.year_of_study, 10) || null : null;
      await db.run(
        `INSERT INTO talent_profiles (user_id, university, course, year_of_study, bio, kyc_status, created_at)
         VALUES (?, ?, ?, ?, ?, 'none', COALESCE(?, CURRENT_TIMESTAMP))`,
        [u.id, u.university || null, u.course || null, yearInt, u.bio || null, u.created_at]
      );

      // Carry and normalize skills if present
      if (u.skills && typeof u.skills === 'string') {
        const rawSkills = u.skills.split(',').map(s => s.trim()).filter(Boolean);
        for (const skillName of rawSkills) {
          // Find or insert skill
          let skillRow = await db.get('SELECT id FROM skills WHERE LOWER(name) = LOWER(?)', skillName);
          if (!skillRow) {
            const skillIns = await db.run('INSERT INTO skills (name) VALUES (?)', skillName);
            skillRow = { id: skillIns.lastID };
          }
          await db.run(
            `INSERT OR IGNORE INTO talent_skills (talent_id, skill_id, source) VALUES (?, ?, 'self_declared')`,
            [u.id, skillRow.id]
          );
        }
      }
    } else {
      await db.run(
        `INSERT INTO business_profiles (user_id, company_name, industry, company_size, website, created_at)
         VALUES (?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))`,
        [u.id, u.company_name || u.name, u.industry || null, u.company_size || null, u.website || null, u.created_at]
      );
    }
  }

  // Carry projects with budget converted to kobo and status marked 'cancelled'
  for (const p of oldProjects) {
    const budgetKobo = Math.round((p.budget || 0) * 100);
    
    // Infer task_type
    let taskType = 'data_entry';
    const text = ((p.title || '') + ' ' + (p.description || '')).toLowerCase();
    if (text.includes('clean') || text.includes('csv') || text.includes('deduplicat')) {
      taskType = 'data_cleaning';
    } else if (text.includes('social') || text.includes('media') || text.includes('content')) {
      taskType = 'social_media';
    } else if (text.includes('web') || text.includes('frontend') || text.includes('html')) {
      taskType = 'web_basic';
    }
    const verificationMethod = taskType === 'data_cleaning' ? 'automated_diff' : 'manual';

    await db.run(
      `INSERT INTO projects (id, business_id, title, description, task_type, verification_method, budget_kobo, duration_days, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'cancelled', COALESCE(?, CURRENT_TIMESTAMP))`,
      [p.id, p.business_id, p.title, p.description || null, taskType, verificationMethod, budgetKobo, p.duration_days || 3, p.created_at]
    );
  }

  await db.exec('PRAGMA foreign_keys = ON;');
  console.log('✅ Legacy migration completed successfully.');
}

if (require.main === module) {
  migrate().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
}

module.exports = { migrate };
