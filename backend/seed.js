const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

async function seed() {
  const db = await open({ filename: './microintern.db', driver: sqlite3.Database });
  
  // Drop and recreate all tables to apply new schema
  await db.exec(`DROP TABLE IF EXISTS deliverables;`);
  await db.exec(`DROP TABLE IF EXISTS applications;`);
  await db.exec(`DROP TABLE IF EXISTS projects;`);
  await db.exec(`DROP TABLE IF EXISTS users;`);
  
  await db.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      type TEXT NOT NULL,
      university TEXT, course TEXT, year_of_study TEXT, bio TEXT,
      company_name TEXT, industry TEXT, company_size TEXT, website TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER, title TEXT NOT NULL, description TEXT,
      budget INTEGER, duration_days INTEGER,
      status TEXT DEFAULT 'open',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES users (id)
    );
    CREATE TABLE applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER, student_id INTEGER, pitch TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id),
      FOREIGN KEY (student_id) REFERENCES users (id)
    );
    CREATE TABLE deliverables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER, student_id INTEGER, link TEXT, notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id),
      FOREIGN KEY (student_id) REFERENCES users (id)
    );
  `);
  
  // Clear existing data
  await db.exec(`
    DELETE FROM deliverables;
    DELETE FROM applications;
    DELETE FROM projects;
    DELETE FROM users;
    DELETE FROM sqlite_sequence WHERE name IN ('users', 'projects', 'applications', 'deliverables');
  `);

  console.log("Adding mock users...");
  // student
  await db.run(`INSERT INTO users (name, email, password, type, university, course, year_of_study, bio) 
    VALUES ('Tobi Adebayo', 'tobi@university.edu.ng', 'password123', 'student', 
            'University of Lagos', 'Computer Science', '300 Level', 
            'Data enthusiast. Excel wizard. Ready to get things done.')`);
  
  // businesses
  await db.run(`INSERT INTO users (name, email, password, type, company_name, industry, company_size) 
    VALUES ('Nexus Retail Ltd', 'contact@nexus.com', 'password123', 'business', 
            'Nexus Retail Ltd', 'E-commerce & Retail', '11–50 employees')`);
  
  await db.run(`INSERT INTO users (name, email, password, type, company_name, industry, company_size) 
    VALUES ('Lagos Logistics Hub', 'ops@lagoslogistics.com', 'password123', 'business', 
            'Lagos Logistics Hub', 'Logistics & Supply Chain', '51–200 employees')`);

  console.log("Adding mock projects...");
  await db.run(`INSERT INTO projects (business_id, title, description, budget, duration_days, status) 
    VALUES (2, 'Organise 500 customer records', 'Cleanse CSV records, remove duplicates, format contacts.', 15000, 2, 'completed')`);
  await db.run(`INSERT INTO projects (business_id, title, description, budget, duration_days, status) 
    VALUES (3, 'Inventory SKU Standardization', 'Format SKUs across product catalog.', 20000, 3, 'completed')`);
  await db.run(`INSERT INTO projects (business_id, title, description, budget, duration_days, status) 
    VALUES (2, 'Market Research Data Entry', 'Find competitor prices and enter into Google Sheets.', 10000, 1, 'open')`);
  await db.run(`INSERT INTO projects (business_id, title, description, budget, duration_days, status) 
    VALUES (3, 'Product Catalog Tagging', 'Audit 320 SKU entries and add tags.', 18000, 4, 'open')`);

  console.log("Adding mock applications & deliverables...");
  await db.run(`INSERT INTO applications (project_id, student_id, pitch, status) VALUES (1, 1, 'I can do this!', 'accepted')`);
  await db.run(`INSERT INTO deliverables (project_id, student_id, link, notes) VALUES (1, 1, 'cleaned_records_final.xlsx', 'All 500 rows deduplicated.')`);
  
  await db.run(`INSERT INTO applications (project_id, student_id, pitch, status) VALUES (2, 1, 'Expert here.', 'accepted')`);
  await db.run(`INSERT INTO deliverables (project_id, student_id, link, notes) VALUES (2, 1, 'sku_catalog_v2.csv', 'Completed and formatted.')`);

  console.log("\n✅ Seed completed!");
  console.log("\n🔑 Test Credentials:");
  console.log("  Student  → tobi@university.edu.ng / password123");
  console.log("  Business → contact@nexus.com / password123");
  console.log("  Business → ops@lagoslogistics.com / password123");
}

seed().catch(err => {
  console.error("Seed failed:", err);
});
