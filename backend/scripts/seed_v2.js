const bcrypt = require('bcryptjs');
const { getDBConnection, runMigrations } = require('../server/db');

async function seedV2() {
  console.log('Seeding MicroIntern v2.1 development database...');
  const db = await getDBConnection();
  await runMigrations(db);

  // Clear existing records
  await db.exec('PRAGMA foreign_keys = OFF;');
  await db.exec(`
    DELETE FROM certificate_events;
    DELETE FROM certificates;
    DELETE FROM notifications;
    DELETE FROM reviews;
    DELETE FROM deliverables;
    DELETE FROM applications;
    DELETE FROM payouts;
    DELETE FROM escrows;
    DELETE FROM project_files;
    DELETE FROM projects;
    DELETE FROM mentorships;
    DELETE FROM talent_skills;
    DELETE FROM business_profiles;
    DELETE FROM talent_profiles;
    DELETE FROM users;
    DELETE FROM sqlite_sequence;
  `);
  await db.exec('PRAGMA foreign_keys = ON;');

  const passwordHash = await bcrypt.hash('password123', 12);

  // 1. Users
  console.log('Creating users...');
  const talent1 = await db.run(`
    INSERT INTO users (name, email, password_hash, type)
    VALUES ('Chioma Okonkwo', 'chioma@unilag.edu.ng', ?, 'talent')
  `, passwordHash);
  const talent1Id = talent1.lastID;

  await db.run(`
    INSERT INTO talent_profiles (user_id, university, course, year_of_study, bio, kyc_status, pandascrow_account_id)
    VALUES (?, 'University of Lagos', 'Computer Science', 3, 'Data cleaning & Python enthusiast with an eye for detail.', 'verified', 'pse_acc_chioma_001')
  `, talent1Id);

  const talent2 = await db.run(`
    INSERT INTO users (name, email, password_hash, type)
    VALUES ('Tobi Adebayo', 'tobi@unilag.edu.ng', ?, 'talent')
  `, passwordHash);
  const talent2Id = talent2.lastID;

  await db.run(`
    INSERT INTO talent_profiles (user_id, university, course, year_of_study, bio, kyc_status)
    VALUES (?, 'University of Lagos', 'Economics', 2, 'Excel wizard and spreadsheet enthusiast.', 'pending')
  `, talent2Id);

  const biz1 = await db.run(`
    INSERT INTO users (name, email, password_hash, type)
    VALUES ('Nexus Retail Ltd', 'contact@nexus.com', ?, 'business')
  `, passwordHash);
  const biz1Id = biz1.lastID;

  await db.run(`
    INSERT INTO business_profiles (user_id, company_name, industry, company_size, website, pandascrow_account_id)
    VALUES (?, 'Nexus Retail Ltd', 'E-Commerce & Retail', '11-50 employees', 'https://nexusretail.ng', 'pse_biz_nexus_001')
  `, biz1Id);

  const mentor1 = await db.run(`
    INSERT INTO users (name, email, password_hash, type)
    VALUES ('Emeka Okafor', 'emeka@mentor.ng', ?, 'business')
  `, passwordHash);
  const mentor1Id = mentor1.lastID;

  await db.run(`
    INSERT INTO business_profiles (user_id, company_name, industry, company_size)
    VALUES (?, 'Okafor Advisory & Mentorship', 'Professional Services', '1-10 employees')
  `, mentor1Id);

  // 2. Mentorship
  console.log('Creating mentorship...');
  await db.run(`
    INSERT INTO mentorships (mentor_id, talent_id, status)
    VALUES (?, ?, 'active')
  `, [mentor1Id, talent1Id]);

  // 3. Completed Project (with released escrow & verified skill)
  console.log('Creating completed project...');
  const proj1 = await db.run(`
    INSERT INTO projects (
      business_id, title, description, task_type, verification_method,
      budget_kobo, duration_days, status, assigned_talent_id, assigned_mentor_id, requires_mentor
    ) VALUES (
      ?, 'Cleanse 1,000 Customer CSV Records',
      'Remove duplicate phone numbers, sanitize emails, and validate names.',
      'data_cleaning', 'automated_diff', 2500000, 2, 'completed', ?, ?, 1
    )
  `, [biz1Id, talent1Id, mentor1Id]);
  const proj1Id = proj1.lastID;

  const escrow1 = await db.run(`
    INSERT INTO escrows (
      project_id, business_id, amount_kobo, pandascrow_escrow_id, status, funded_at, released_at, payout_ref
    ) VALUES (
      ?, ?, 2500000, 'pse_escrow_seed_001', 'released',
      datetime('now', '-5 days'), datetime('now', '-2 days'), 'pst_rel_seed_001'
    )
  `, [proj1Id, biz1Id]);

  await db.run(`
    INSERT INTO payouts (
      escrow_id, talent_id, amount_kobo, pandascrow_transaction_ref, status, completed_at
    ) VALUES (
      ?, ?, 2500000, 'pst_rel_seed_001', 'success', datetime('now', '-2 days')
    )
  `, [escrow1.lastID, talent1Id]);

  await db.run(`
    INSERT INTO deliverables (
      project_id, talent_id, round, link, notes, automated_check_status, automated_check_report
    ) VALUES (
      ?, ?, 1, 'https://storage.microintern.ng/output/cleaned_customers_v1.csv',
      'All duplicates removed and emails normalized.', 'passed',
      '{"summary":"Automated check passed","duplicates_removed":42,"remaining_duplicates":0}'
    )
  `, [proj1Id, talent1Id]);

  await db.run(`
    INSERT INTO reviews (project_id, reviewer_id, reviewee_id, rating, comment)
    VALUES (?, ?, ?, 5, 'Superb attention to detail and delivered ahead of schedule!')
  `, [proj1Id, biz1Id, talent1Id]);

  // Verified Skill
  const cleanSkill = await db.get("SELECT id FROM skills WHERE name = 'Data Cleaning'");
  if (cleanSkill) {
    await db.run(`
      INSERT INTO talent_skills (talent_id, skill_id, source, verified_at)
      VALUES (?, ?, 'verified', datetime('now', '-2 days'))
    `, [talent1Id, cleanSkill.id]);
  }

  // 4. Open Project with Funded Escrow
  console.log('Creating open marketplace projects...');
  const proj2 = await db.run(`
    INSERT INTO projects (
      business_id, title, description, task_type, verification_method,
      budget_kobo, duration_days, status, requires_mentor
    ) VALUES (
      ?, 'E-Commerce Product SKU Standardization',
      'Standardize 350 product SKUs, tags, and category taxonomies across our shop catalog.',
      'data_entry', 'manual', 2000000, 3, 'open', 0
    )
  `, [biz1Id]);

  await db.run(`
    INSERT INTO escrows (
      project_id, business_id, amount_kobo, pandascrow_escrow_id, status, funded_at
    ) VALUES (
      ?, ?, 2000000, 'pse_escrow_seed_002', 'funded', datetime('now', '-1 day')
    )
  `, [proj2.lastID, biz1Id]);

  console.log('\n✅ Database seeded successfully with v2.1 data!');
  console.log('\n🔑 Test Accounts (Password for all: password123)');
  console.log('  Talent (Verified + Mentored): chioma@unilag.edu.ng');
  console.log('  Talent (Solo / KYC Pending):  tobi@unilag.edu.ng');
  console.log('  Business:                     contact@nexus.com');
  console.log('  Mentor:                       emeka@mentor.ng\n');
}

if (require.main === module) {
  seedV2().then(() => process.exit(0)).catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
}

module.exports = { seedV2 };
