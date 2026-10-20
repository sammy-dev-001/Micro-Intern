const express = require('express');
const { z } = require('zod');
const { getDBConnection } = require('../db');
const { authMiddleware, optionalAuth } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');
const { getVerifiedTalentProfile } = require('../services/profileQuery');

const router = express.Router();

const updateMeSchema = z.object({
  name: z.string().min(2).optional(),
  // Talent fields
  university: z.string().optional().nullable(),
  course: z.string().optional().nullable(),
  year_of_study: z.number().int().min(1).max(7).optional().nullable(),
  bio: z.string().optional().nullable(),
  kyc_status: z.enum(['none', 'pending', 'verified']).optional(),
  pandascrow_account_id: z.string().optional().nullable(),
  // Business fields
  company_name: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  company_size: z.string().optional().nullable(),
  website: z.string().optional().nullable()
});

const updateSkillsSchema = z.object({
  skills: z.array(z.string().min(1))
});

// GET /api/users/:id/profile (Public)
router.get('/:id/profile', async (req, res, next) => {
  try {
    const db = await getDBConnection();
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      throw new AppError('Invalid user ID', 400, 'INVALID_USER_ID');
    }

    const profile = await getVerifiedTalentProfile(db, userId);
    if (!profile) {
      throw new AppError('User profile not found', 404, 'USER_NOT_FOUND');
    }

    res.json(profile);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/users/me
router.patch('/me', authMiddleware, async (req, res, next) => {
  try {
    const validated = updateMeSchema.parse(req.body);
    const db = await getDBConnection();
    const userId = req.user.id;

    if (validated.name) {
      await db.run('UPDATE users SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [validated.name, userId]);
    }

    if (req.user.type === 'talent') {
      const talentFields = [];
      const talentValues = [];

      for (const field of ['university', 'course', 'year_of_study', 'bio', 'kyc_status', 'pandascrow_account_id']) {
        if (validated[field] !== undefined) {
          talentFields.push(`${field} = ?`);
          talentValues.push(validated[field]);
        }
      }

      if (talentFields.length > 0) {
        talentFields.push('updated_at = CURRENT_TIMESTAMP');
        talentValues.push(userId);
        await db.run(
          `UPDATE talent_profiles SET ${talentFields.join(', ')} WHERE user_id = ?`,
          talentValues
        );
      }
    } else {
      const bizFields = [];
      const bizValues = [];

      for (const field of ['company_name', 'industry', 'company_size', 'website', 'pandascrow_account_id']) {
        if (validated[field] !== undefined) {
          bizFields.push(`${field} = ?`);
          bizValues.push(validated[field]);
        }
      }

      if (bizFields.length > 0) {
        bizFields.push('updated_at = CURRENT_TIMESTAMP');
        bizValues.push(userId);
        await db.run(
          `UPDATE business_profiles SET ${bizFields.join(', ')} WHERE user_id = ?`,
          bizValues
        );
      }
    }

    // Return updated user info
    const updatedUser = await db.get('SELECT id, name, email, type, created_at FROM users WHERE id = ?', userId);
    let profile = null;
    if (updatedUser.type === 'talent') {
      profile = await db.get('SELECT * FROM talent_profiles WHERE user_id = ?', userId);
    } else {
      profile = await db.get('SELECT * FROM business_profiles WHERE user_id = ?', userId);
    }

    res.json({
      user: {
        ...updatedUser,
        profile
      }
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/me/skills
router.put('/me/skills', authMiddleware, async (req, res, next) => {
  try {
    if (req.user.type !== 'talent') {
      throw new AppError('Only talent accounts can update skills', 403, 'FORBIDDEN');
    }

    const { skills } = updateSkillsSchema.parse(req.body);
    const db = await getDBConnection();
    const userId = req.user.id;

    // Check existing verified skills so we don't accidentally demote them
    const existingSkills = await db.all(
      'SELECT skill_id, source FROM talent_skills WHERE talent_id = ?',
      userId
    );
    const verifiedSkillIds = new Set(
      existingSkills.filter(s => s.source === 'verified').map(s => s.skill_id)
    );

    // Delete only self_declared skills
    await db.run(
      "DELETE FROM talent_skills WHERE talent_id = ? AND source = 'self_declared'",
      userId
    );

    // Add submitted skills
    for (const skillName of skills) {
      const trimmed = skillName.trim();
      if (!trimmed) continue;

      let skill = await db.get('SELECT id FROM skills WHERE LOWER(name) = LOWER(?)', trimmed);
      if (!skill) {
        const ins = await db.run('INSERT INTO skills (name) VALUES (?)', trimmed);
        skill = { id: ins.lastID };
      }

      const isVerified = verifiedSkillIds.has(skill.id);
      await db.run(
        `INSERT OR IGNORE INTO talent_skills (talent_id, skill_id, source, verified_at)
         VALUES (?, ?, ?, ?)`,
        [userId, skill.id, isVerified ? 'verified' : 'self_declared', isVerified ? new Date().toISOString() : null]
      );
    }

    const allSkills = await db.all(`
      SELECT s.id, s.name, ts.source, ts.verified_at
      FROM talent_skills ts
      JOIN skills s ON ts.skill_id = s.id
      WHERE ts.talent_id = ?
    `, userId);

    res.json({
      success: true,
      skills: allSkills
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/me/dashboard (Role-aware dashboard)
router.get('/me/dashboard', authMiddleware, async (req, res, next) => {
  try {
    const db = await getDBConnection();
    const userId = req.user.id;

    if (req.user.type === 'talent') {
      const profile = await getVerifiedTalentProfile(db, userId);
      const myApplications = await db.all(`
        SELECT a.id, a.project_id, a.pitch, a.status, a.created_at,
               p.title, p.budget_kobo, p.task_type, p.status as project_status,
               u.name as business_name
        FROM applications a
        JOIN projects p ON a.project_id = p.id
        JOIN users u ON p.business_id = u.id
        WHERE a.talent_id = ?
        ORDER BY a.created_at DESC
      `, userId);

      const activeProjects = await db.all(`
        SELECT p.*, u.name as business_name, m.name as mentor_name
        FROM projects p
        JOIN users u ON p.business_id = u.id
        LEFT JOIN users m ON p.assigned_mentor_id = m.id
        WHERE p.assigned_talent_id = ?
          AND p.status IN ('assigned', 'in_progress', 'submitted', 'in_review', 'changes_requested')
        ORDER BY p.updated_at DESC
      `, userId);

      const unreadNotifications = await db.all(`
        SELECT * FROM notifications 
        WHERE user_id = ? AND read_at IS NULL
        ORDER BY created_at DESC
      `, userId);

      return res.json({
        type: 'talent',
        profile,
        active_projects: activeProjects,
        applications: myApplications,
        notifications: unreadNotifications
      });
    } else {
      // Business Dashboard
      const businessProjects = await db.all(`
        SELECT p.*,
          e.status as escrow_status,
          e.amount_kobo as escrow_amount,
          (SELECT COUNT(*) FROM applications a WHERE a.project_id = p.id) as applicant_count,
          u.name as assigned_talent_name
        FROM projects p
        LEFT JOIN escrows e ON p.id = e.project_id
        LEFT JOIN users u ON p.assigned_talent_id = u.id
        WHERE p.business_id = ?
        ORDER BY p.created_at DESC
      `, userId);

      const profile = await db.get('SELECT * FROM business_profiles WHERE user_id = ?', userId);

      const unreadNotifications = await db.all(`
        SELECT * FROM notifications 
        WHERE user_id = ? AND read_at IS NULL
        ORDER BY created_at DESC
      `, userId);

      return res.json({
        type: 'business',
        business_profile: profile,
        projects: businessProjects,
        notifications: unreadNotifications
      });
    }
  } catch (err) {
    next(err);
  }
});

// GET /api/users/:id (General user info)
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const db = await getDBConnection();
    const userId = parseInt(req.params.id, 10);
    const user = await db.get('SELECT id, name, type, created_at FROM users WHERE id = ?', userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    let profile = null;
    if (user.type === 'talent') {
      profile = await db.get('SELECT university, course, year_of_study, bio FROM talent_profiles WHERE user_id = ?', userId);
    } else {
      profile = await db.get('SELECT company_name, industry, company_size, website FROM business_profiles WHERE user_id = ?', userId);
    }

    res.json({
      user: {
        ...user,
        profile
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
