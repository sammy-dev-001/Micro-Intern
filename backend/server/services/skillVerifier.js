/**
 * services/skillVerifier.js
 * 
 * Flips a talent's skill to 'verified' when >= 1 completed + paid task tagged with it exists.
 */

const TASK_TYPE_TO_SKILL = {
  data_cleaning: 'Data Cleaning',
  social_media: 'Social Media Content',
  data_entry: 'Data Entry',
  web_basic: 'Basic Web Work'
};

async function verifyTalentSkills(db, talentId) {
  // Find all completed and escrow-released projects for this talent
  const completedProjects = await db.all(`
    SELECT DISTINCT p.task_type
    FROM projects p
    JOIN escrows e ON p.id = e.project_id
    WHERE p.assigned_talent_id = ?
      AND p.status = 'completed'
      AND e.status = 'released'
  `, talentId);

  const completedTaskTypes = completedProjects.map(p => p.task_type);

  for (const taskType of completedTaskTypes) {
    const skillName = TASK_TYPE_TO_SKILL[taskType];
    if (!skillName) continue;

    // Ensure skill exists in skills table
    let skill = await db.get('SELECT id FROM skills WHERE name = ?', skillName);
    if (!skill) {
      const ins = await db.run('INSERT INTO skills (name) VALUES (?)', skillName);
      skill = { id: ins.lastID };
    }

    // Check existing talent_skills
    const existing = await db.get(
      'SELECT source, verified_at FROM talent_skills WHERE talent_id = ? AND skill_id = ?',
      [talentId, skill.id]
    );

    if (!existing) {
      await db.run(
        `INSERT INTO talent_skills (talent_id, skill_id, source, verified_at)
         VALUES (?, ?, 'verified', CURRENT_TIMESTAMP)`,
        [talentId, skill.id]
      );
    } else if (existing.source !== 'verified') {
      await db.run(
        `UPDATE talent_skills 
         SET source = 'verified', verified_at = CURRENT_TIMESTAMP 
         WHERE talent_id = ? AND skill_id = ?`,
        [talentId, skill.id]
      );
    }
  }
}

module.exports = {
  verifyTalentSkills,
  TASK_TYPE_TO_SKILL
};
