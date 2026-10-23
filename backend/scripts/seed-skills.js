const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const DB_PATH =
  process.env.DATABASE_PATH ||
  path.resolve(__dirname, '../microintern.db');

/**
 * Canonical skills list. Safe to re-run: uses INSERT OR IGNORE, so existing
 * rows are kept and only new names are added.
 */
const SKILLS = [
  // Tech
  'Web Development',
  'Frontend Development',
  'Backend Development',
  'App Development',
  'Data Analysis',
  'Data Cleaning',
  'Data Entry',
  'Data Visualization',
  'SQL',
  'Python',
  'Python Basics',
  'JavaScript',
  'React',
  'Node.js',
  'E-commerce Development',
  'DevOps',
  'Cloud Infrastructure',
  'QA Testing',
  'Game Development',
  'Basic Web Work',

  // Design
  'Logo Design',
  'Brand Identity',
  'UI Design',
  'UX Design',
  'Graphic Design',
  'Banner Design',
  'Social Media Design',
  'Illustration',
  '3D Modelling',
  'Motion Graphics',
  'Video Editing',

  // Writing
  'Copywriting',
  'Content Writing',
  'Technical Writing',
  'Academic Writing',
  'Editing',
  'Proofreading',
  'Scriptwriting',
  'Translation',

  // Marketing
  'SEO',
  'SEM',
  'Email Marketing',
  'Social Media Marketing',
  'Social Media Content',
  'Paid Advertising',
  'Affiliate Marketing',
  'Market Research',
  'Product Marketing',
  'Lead Generation',
  'Sales Outreach',
  'Content Strategy',

  // Business
  'Bookkeeping',
  'Financial Modelling',
  'Business Plans',
  'Excel',
  'Google Sheets',
  'Project Management',
  'Virtual Assistance',
  'Customer Support',
  'Scheduling',
  'Life Coaching',
  'Wellness Coaching',

  // Media
  'Portrait Photography',
  'Event Photography',
  'Product Photography',
  'Editorial Photography',
  'Podcast Editing',
  'Voiceover',
  'Audio Editing',
];

async function main() {
  const db = await open({ filename: DB_PATH, driver: sqlite3.Database });
  let inserted = 0;
  let skipped = 0;

  for (const name of SKILLS) {
    const existing = await db.get(
      'SELECT id FROM skills WHERE LOWER(name) = LOWER(?)',
      name
    );
    if (existing) {
      skipped++;
      continue;
    }
    await db.run('INSERT INTO skills (name) VALUES (?)', name);
    inserted++;
  }

  console.log(`Skills seed complete: ${inserted} inserted, ${skipped} already existed.`);
  const total = await db.get('SELECT COUNT(*) as c FROM skills');
  console.log(`Total skills in DB: ${total.c}`);
  await db.close();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});