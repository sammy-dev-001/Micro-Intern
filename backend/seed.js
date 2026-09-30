const { setupDatabase } = require('./database');

async function seed() {
  const db = await setupDatabase();
  
  // Clear existing data (optional, but good for resetting)
  await db.exec(`
    DELETE FROM deliverables;
    DELETE FROM applications;
    DELETE FROM projects;
    DELETE FROM users;
  `);

  // Reset sqlite sequences
  await db.exec(`
    DELETE FROM sqlite_sequence WHERE name IN ('users', 'projects', 'applications', 'deliverables');
  `);

  console.log("Adding mock users...");
  await db.run(`INSERT INTO users (name, email, type) VALUES ('Tobi Adebayo', 'tobi@university.edu.ng', 'student')`);
  await db.run(`INSERT INTO users (name, email, type) VALUES ('Nexus Retail Ltd', 'contact@nexus.com', 'business')`);
  await db.run(`INSERT INTO users (name, email, type) VALUES ('Lagos Logistics Hub', 'ops@lagoslogistics.com', 'business')`);

  console.log("Adding mock projects...");
  await db.run(`
    INSERT INTO projects (business_id, title, description, budget, duration_days, status) 
    VALUES (2, 'Organise 500 customer records', 'Clean up excel file', 15000, 2, 'completed')
  `);
  
  await db.run(`
    INSERT INTO projects (business_id, title, description, budget, duration_days, status) 
    VALUES (3, 'Inventory SKU Standardization', 'Format SKUs', 20000, 3, 'completed')
  `);
  
  await db.run(`
    INSERT INTO projects (business_id, title, description, budget, duration_days, status) 
    VALUES (2, 'Market Research Data Entry', 'Find competitors', 10000, 1, 'completed')
  `);

  console.log("Adding mock applications & deliverables...");
  // Project 1
  await db.run(`INSERT INTO applications (project_id, student_id, pitch, status) VALUES (1, 1, 'I can do this!', 'accepted')`);
  await db.run(`INSERT INTO deliverables (project_id, student_id, link, notes) VALUES (1, 1, 'cleaned_records_final.xlsx', 'All done.')`);
  
  // Project 2
  await db.run(`INSERT INTO applications (project_id, student_id, pitch, status) VALUES (2, 1, 'Expert here.', 'accepted')`);
  await db.run(`INSERT INTO deliverables (project_id, student_id, link, notes) VALUES (2, 1, 'sku_catalog_v2.csv', 'Completed.')`);

  // Project 3
  await db.run(`INSERT INTO applications (project_id, student_id, pitch, status) VALUES (3, 1, 'Fast typist.', 'accepted')`);
  await db.run(`INSERT INTO deliverables (project_id, student_id, link, notes) VALUES (3, 1, 'market_research.pdf', 'Done.')`);

  console.log("Seed completed!");
}

seed().catch(err => {
  console.error("Seed failed", err);
});
