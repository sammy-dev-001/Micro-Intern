const express = require('express');
const { z } = require('zod');
const { getDBConnection } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const requireType = require('../middleware/requireType');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router({ mergeParams: true });

const createApplicationSchema = z.object({
  pitch: z.string().min(10, 'Pitch must be at least 10 characters')
});

// POST /api/projects/:id/applications (Any talent can self-apply; no KYC check at apply time)
router.post('/', authMiddleware, requireType('talent'), async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.id, 10);
    const { pitch } = createApplicationSchema.parse(req.body);
    const talentId = req.user.id;
    const db = await getDBConnection();

    const project = await db.get('SELECT * FROM projects WHERE id = ?', projectId);
    if (!project) {
      throw new AppError('Project not found.', 404, 'NOT_FOUND');
    }

    if (project.status !== 'open') {
      throw new AppError(`Cannot apply to project with status '${project.status}'. Only open projects accept applications.`, 400, 'PROJECT_NOT_OPEN');
    }

    // Check duplicate application
    const existing = await db.get(
      'SELECT id, status FROM applications WHERE project_id = ? AND talent_id = ?',
      [projectId, talentId]
    );
    if (existing) {
      throw new AppError('You have already applied to this project.', 409, 'ALREADY_APPLIED');
    }

    const result = await db.run(
      'INSERT INTO applications (project_id, talent_id, pitch, status) VALUES (?, ?, ?, ?)',
      [projectId, talentId, pitch, 'pending']
    );

    res.status(201).json({
      id: result.lastID,
      project_id: projectId,
      talent_id: talentId,
      pitch,
      status: 'pending',
      created_at: new Date().toISOString()
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/projects/:id/applications (Business only)
router.get('/', authMiddleware, requireType('business'), async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.id, 10);
    const db = await getDBConnection();

    const project = await db.get('SELECT business_id FROM projects WHERE id = ?', projectId);
    if (!project) throw new AppError('Project not found.', 404, 'NOT_FOUND');
    if (project.business_id !== req.user.id) throw new AppError('You do not own this project.', 403, 'FORBIDDEN');

    const applications = await db.all(`
      SELECT 
        a.id, a.project_id, a.talent_id, a.pitch, a.status, a.created_at,
        u.name as talent_name, u.email as talent_email,
        tp.university, tp.course, tp.year_of_study, tp.bio, tp.kyc_status,
        m.name as mentor_name
      FROM applications a
      JOIN users u ON a.talent_id = u.id
      LEFT JOIN talent_profiles tp ON u.id = tp.user_id
      LEFT JOIN mentorships ms ON ms.talent_id = u.id AND ms.status = 'active'
      LEFT JOIN users m ON ms.mentor_id = m.id
      WHERE a.project_id = ?
      ORDER BY a.created_at ASC
    `, projectId);

    // Attach skills to each applicant
    for (const app of applications) {
      const skills = await db.all(`
        SELECT s.name, ts.source, ts.verified_at
        FROM talent_skills ts
        JOIN skills s ON ts.skill_id = s.id
        WHERE ts.talent_id = ?
      `, app.talent_id);
      app.skills = skills;
    }

    res.json(applications);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/applications/:id (Withdraw application)
router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const applicationId = parseInt(req.params.id, 10);
    const db = await getDBConnection();

    const application = await db.get('SELECT * FROM applications WHERE id = ?', applicationId);
    if (!application) throw new AppError('Application not found.', 404, 'NOT_FOUND');

    if (application.talent_id !== req.user.id) {
      throw new AppError('You do not own this application.', 403, 'FORBIDDEN');
    }

    if (application.status === 'accepted') {
      throw new AppError('Cannot withdraw an accepted application. Please use the abandon endpoint instead.', 400, 'CANNOT_WITHDRAW_ACCEPTED');
    }

    await db.run("UPDATE applications SET status = 'withdrawn', updated_at = CURRENT_TIMESTAMP WHERE id = ?", applicationId);

    res.json({
      success: true,
      message: 'Application withdrawn.'
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
