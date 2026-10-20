const { TASK_TYPE_TO_SKILL } = require('./skillVerifier');

/**
 * Builds the canonical Verified Skill Profile according to Section 3.
 */
async function getVerifiedTalentProfile(db, userId) {
  // 1. Fetch user + talent profile
  const user = await db.get(`
    SELECT u.id, u.name, u.type, u.created_at,
           tp.university, tp.course, tp.year_of_study, tp.bio
    FROM users u
    LEFT JOIN talent_profiles tp ON u.id = tp.user_id
    WHERE u.id = ?
  `, userId);

  if (!user) {
    return null;
  }

  // 2. Fetch completed + escrow-released tasks
  // Unreleased work is not proof.
  const completedTasksRows = await db.all(`
    SELECT 
      p.id as project_id,
      p.title,
      p.task_type,
      p.verification_method,
      p.budget_kobo as amount_kobo,
      p.requires_mentor,
      p.assigned_mentor_id,
      b.name as business_name,
      bp.company_name,
      m.name as mentor_name,
      e.released_at,
      p.updated_at,
      d.automated_check_status
    FROM projects p
    JOIN users b ON p.business_id = b.id
    LEFT JOIN business_profiles bp ON b.id = bp.user_id
    JOIN escrows e ON p.id = e.project_id
    LEFT JOIN users m ON p.assigned_mentor_id = m.id
    LEFT JOIN deliverables d ON d.project_id = p.id AND d.round = (
      SELECT MAX(d2.round) FROM deliverables d2 WHERE d2.project_id = p.id
    )
    WHERE p.assigned_talent_id = ?
      AND p.status = 'completed'
      AND e.status = 'released'
    ORDER BY COALESCE(e.released_at, p.updated_at) DESC
  `, userId);

  const completed_tasks = completedTasksRows.map(row => {
    let verificationPassed = null;
    if (row.verification_method === 'automated_diff') {
      verificationPassed = row.automated_check_status === 'passed';
    } else {
      // Manual business approval
      verificationPassed = true;
    }

    return {
      project_id: row.project_id,
      title: row.title,
      task_type: row.task_type,
      business_name: row.company_name || row.business_name,
      mentor_name: row.assigned_mentor_id ? row.mentor_name : null,
      amount_kobo: row.amount_kobo,
      completed_at: row.released_at || row.updated_at,
      verification_method: row.verification_method,
      verification_passed: verificationPassed
    };
  });

  // 3. Count completed tasks per task_type
  const taskCountByType = {};
  for (const t of completed_tasks) {
    taskCountByType[t.task_type] = (taskCountByType[t.task_type] || 0) + 1;
  }

  // 4. Fetch all skills associated with talent
  const rawSkills = await db.all(`
    SELECT s.name, ts.source, ts.verified_at
    FROM talent_skills ts
    JOIN skills s ON ts.skill_id = s.id
    WHERE ts.talent_id = ?
    ORDER BY ts.source DESC, s.name ASC
  `, userId);

  // Map task counts to skills
  const skills = rawSkills.map(s => {
    // Find task_type corresponding to this skill name
    let taskTypeMatch = null;
    for (const [k, v] of Object.entries(TASK_TYPE_TO_SKILL)) {
      if (v.toLowerCase() === s.name.toLowerCase()) {
        taskTypeMatch = k;
        break;
      }
    }
    const count = taskTypeMatch ? (taskCountByType[taskTypeMatch] || 0) : 0;
    const isVerified = s.source === 'verified' || count > 0;

    const resObj = {
      name: s.name,
      source: isVerified ? 'verified' : 'self_declared'
    };
    if (isVerified) {
      resObj.verified_at = s.verified_at || (completed_tasks[0] ? completed_tasks[0].completed_at : null);
      resObj.task_count = count;
    }
    return resObj;
  });

  // 5. Compute stats and real ratings
  const reviewStats = await db.get(`
    SELECT 
      AVG(rating) as avg_rating,
      COUNT(id) as review_count
    FROM reviews
    WHERE reviewee_id = ?
  `, userId);

  const totalEarnedKobo = completed_tasks.reduce((sum, t) => sum + (t.amount_kobo || 0), 0);
  const avgRating = reviewStats && reviewStats.review_count > 0 
    ? Math.round(reviewStats.avg_rating * 10) / 10 
    : null;

  return {
    user: {
      id: user.id,
      name: user.name,
      university: user.university || null,
      course: user.course || null,
      year_of_study: user.year_of_study || null,
      bio: user.bio || null
    },
    skills,
    completed_tasks,
    stats: {
      tasks_completed: completed_tasks.length,
      total_earned_kobo: totalEarnedKobo,
      avg_rating: avgRating
    }
  };
}

module.exports = {
  getVerifiedTalentProfile
};
