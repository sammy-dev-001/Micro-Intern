const express = require('express');
const { z } = require('zod');
const { getDBConnection } = require('../db');
const { authMiddleware, optionalAuth } = require('../middleware/auth');
const requireType = require('../middleware/requireType');
const { AppError } = require('../middleware/errorHandler');
const { upload } = require('../middleware/upload');
const { transitionProject } = require('../services/stateMachine');
const { pandascrow } = require('../services/pandascrow');
const { createNotification } = require('../services/notifications');
const { verifyTalentSkills } = require('../services/skillVerifier');

const router = express.Router();

const createProjectSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  task_type: z.enum(['data_cleaning', 'social_media', 'data_entry', 'web_basic']),
  budget_kobo: z.coerce.number().int().positive('Budget must be a positive integer in kobo'),
  duration_days: z.coerce.number().int().min(1, 'Duration must be at least 1 day'),
  requires_mentor: z.coerce.boolean().optional().default(false)
});

const assignSchema = z.object({
  application_id: z.number().int().positive('Valid application_id is required')
});

const requestChangesSchema = z.object({
  notes: z.string().min(5, 'Notes explaining requested changes are required')
});

// POST /api/projects (Create draft)
router.post('/', authMiddleware, requireType('business'), upload.single('input_file'), async (req, res, next) => {
  try {
    const validated = createProjectSchema.parse(req.body);
    const businessId = req.user.id; // Enforce token identity, ignore any body business_id

    const verificationMethod = validated.task_type === 'data_cleaning' ? 'automated_diff' : 'manual';
    const db = await getDBConnection();

    const result = await db.run(`
      INSERT INTO projects (
        business_id, title, description, task_type, verification_method,
        budget_kobo, duration_days, requires_mentor, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft')
    `, [
      businessId,
      validated.title,
      validated.description,
      validated.task_type,
      verificationMethod,
      validated.budget_kobo,
      validated.duration_days,
      validated.requires_mentor ? 1 : 0
    ]);

    const projectId = result.lastID;

    // Handle uploaded input CSV file for data_cleaning
    if (req.file) {
      await db.run(`
        INSERT INTO project_files (
          project_id, role, storage_path, original_name, size_bytes, uploaded_by
        ) VALUES (?, 'input', ?, ?, ?, ?)
      `, [
        projectId,
        req.file.path,
        req.file.originalname,
        req.file.size,
        businessId
      ]);
    }

    const created = await db.get('SELECT * FROM projects WHERE id = ?', projectId);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// POST /api/projects/:id/publish (Fund escrow, project stays draft until funded webhook)
router.post('/:id/publish', authMiddleware, requireType('business'), async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.id, 10);
    const db = await getDBConnection();

    const project = await db.get('SELECT * FROM projects WHERE id = ?', projectId);
    if (!project) {
      throw new AppError('Project not found.', 404, 'NOT_FOUND');
    }

    if (project.business_id !== req.user.id) {
      throw new AppError('You do not own this project.', 403, 'FORBIDDEN');
    }

    if (project.status !== 'draft') {
      throw new AppError(`Project is already in '${project.status}' status.`, 400, 'INVALID_STATUS');
    }

    // Check if input CSV is required for data_cleaning
    if (project.task_type === 'data_cleaning') {
      const inputFile = await db.get(
        "SELECT id FROM project_files WHERE project_id = ? AND role = 'input'",
        projectId
      );
      if (!inputFile) {
        throw new AppError(
          'Data cleaning tasks require an input source CSV file before publishing.',
          422,
          'INPUT_FILE_REQUIRED'
        );
      }
    }

    // Fetch business profile
    const businessProfile = await db.get('SELECT * FROM business_profiles WHERE user_id = ?', req.user.id);
    const businessAccountId = businessProfile ? businessProfile.pandascrow_account_id : null;

    // Call Pandascrow
    const escrowResult = await pandascrow.createEscrow({
      amountKobo: project.budget_kobo,
      businessAccountId
    });

    // Insert or update escrow record
    const existingEscrow = await db.get('SELECT id FROM escrows WHERE project_id = ?', projectId);
    let escrowId;
    if (existingEscrow) {
      await db.run(`
        UPDATE escrows SET 
          amount_kobo = ?,
          pandascrow_escrow_id = ?,
          status = 'pending_funding',
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [project.budget_kobo, escrowResult.escrowId, existingEscrow.id]);
      escrowId = existingEscrow.id;
    } else {
      const ins = await db.run(`
        INSERT INTO escrows (project_id, business_id, amount_kobo, pandascrow_escrow_id, status)
        VALUES (?, ?, ?, ?, 'pending_funding')
      `, [projectId, req.user.id, project.budget_kobo, escrowResult.escrowId]);
      escrowId = ins.lastID;
    }

    const escrow = await db.get('SELECT * FROM escrows WHERE id = ?', escrowId);

    res.json({
      success: true,
      message: 'Escrow initiated. Task will go live when escrow funding is confirmed.',
      project,
      escrow
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/projects (Marketplace - open only)
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const db = await getDBConnection();
    const { task_type, search } = req.query;

    let query = `
      SELECT p.*,
             u.name as business_name,
             bp.company_name,
             bp.industry,
             (SELECT COUNT(*) FROM applications a WHERE a.project_id = p.id) as applicant_count
      FROM projects p
      JOIN users u ON p.business_id = u.id
      LEFT JOIN business_profiles bp ON u.id = bp.user_id
      WHERE p.status = 'open'
    `;
    const params = [];

    if (task_type) {
      query += ` AND p.task_type = ?`;
      params.push(task_type);
    }

    if (search) {
      query += ` AND (p.title LIKE ? OR p.description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY p.created_at DESC`;

    const projects = await db.all(query, params);
    res.json(projects);
  } catch (err) {
    next(err);
  }
});

// GET /api/projects/:id
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.id, 10);
    const db = await getDBConnection();

    const project = await db.get(`
      SELECT p.*,
             u.name as business_name,
             bp.company_name,
             bp.industry,
             bp.website,
             m.name as mentor_name,
             t.name as talent_name,
             (SELECT COUNT(*) FROM applications a WHERE a.project_id = p.id) as applicant_count
      FROM projects p
      JOIN users u ON p.business_id = u.id
      LEFT JOIN business_profiles bp ON u.id = bp.user_id
      LEFT JOIN users m ON p.assigned_mentor_id = m.id
      LEFT JOIN users t ON p.assigned_talent_id = t.id
      WHERE p.id = ?
    `, projectId);

    if (!project) {
      throw new AppError('Project not found.', 404, 'NOT_FOUND');
    }

    // Attach input file info
    const inputFile = await db.get(
      "SELECT id, original_name, size_bytes, uploaded_at FROM project_files WHERE project_id = ? AND role = 'input'",
      projectId
    );

    // Attach escrow info if owner or assignee
    let escrow = null;
    if (req.user && (req.user.id === project.business_id || req.user.id === project.assigned_talent_id)) {
      escrow = await db.get('SELECT id, status, amount_kobo, funded_at, released_at FROM escrows WHERE project_id = ?', projectId);
    }

    res.json({
      ...project,
      input_file: inputFile || null,
      escrow
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/me/projects (Current user's projects)
router.get('/user/me', authMiddleware, async (req, res, next) => {
  try {
    const db = await getDBConnection();
    if (req.user.type === 'business') {
      const projects = await db.all(`
        SELECT p.*,
               e.status as escrow_status,
               (SELECT COUNT(*) FROM applications a WHERE a.project_id = p.id) as applicant_count,
               t.name as assigned_talent_name
        FROM projects p
        LEFT JOIN escrows e ON p.id = e.project_id
        LEFT JOIN users t ON p.assigned_talent_id = t.id
        WHERE p.business_id = ?
        ORDER BY p.created_at DESC
      `, req.user.id);
      return res.json(projects);
    } else {
      const projects = await db.all(`
        SELECT p.*,
               u.name as business_name,
               m.name as mentor_name
        FROM projects p
        JOIN users u ON p.business_id = u.id
        LEFT JOIN users m ON p.assigned_mentor_id = m.id
        WHERE p.assigned_talent_id = ?
        ORDER BY p.created_at DESC
      `, req.user.id);
      return res.json(projects);
    }
  } catch (err) {
    next(err);
  }
});

// POST /api/projects/:id/assign (Exclusive assignment with KYC gate & mentor attachment)
router.post('/:id/assign', authMiddleware, requireType('business'), async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.id, 10);
    const { application_id } = assignSchema.parse(req.body);
    const db = await getDBConnection();

    const project = await db.get('SELECT * FROM projects WHERE id = ?', projectId);
    if (!project) throw new AppError('Project not found.', 404, 'NOT_FOUND');
    if (project.business_id !== req.user.id) throw new AppError('You do not own this project.', 403, 'FORBIDDEN');

    if (project.status !== 'open') {
      throw new AppError(`Project cannot be assigned from status '${project.status}'. Must be 'open'.`, 400, 'INVALID_STATUS');
    }

    const application = await db.get('SELECT * FROM applications WHERE id = ? AND project_id = ?', [application_id, projectId]);
    if (!application) throw new AppError('Application not found for this project.', 404, 'NOT_FOUND');
    if (application.status !== 'pending') {
      throw new AppError(`Application is in '${application.status}' status and cannot be accepted.`, 400, 'INVALID_APPLICATION_STATUS');
    }

    const talentId = application.talent_id;

    // KYC Check: talent_profiles.kyc_status = 'verified' required
    const talentProfile = await db.get('SELECT * FROM talent_profiles WHERE user_id = ?', talentId);
    if (!talentProfile || talentProfile.kyc_status !== 'verified') {
      return res.status(422).json({
        error: 'Talent has not completed KYC verification.',
        code: 'KYC_REQUIRED',
        message: 'The selected talent must complete KYC verification before being assigned a funded task.'
      });
    }

    // Mentorship Check:
    let assignedMentorId = null;
    const activeMentorship = await db.get(
      "SELECT mentor_id FROM mentorships WHERE talent_id = ? AND status = 'active'",
      talentId
    );

    if (project.requires_mentor) {
      if (!activeMentorship) {
        return res.status(422).json({
          error: 'Mentor required.',
          code: 'MENTOR_REQUIRED',
          message: 'This project requires an active mentor, but the candidate has no active mentor. The talent must bring a mentor or the project requirement must be toggled off.'
        });
      }
      assignedMentorId = activeMentorship.mentor_id;
    } else {
      // Solo task by default, but if talent has mentor and business or talent brings them:
      // (per decision §10.5: only attach if requires_mentor = true or explicitly requested)
      assignedMentorId = null;
    }

    // Set application accepted
    await db.run("UPDATE applications SET status = 'accepted', updated_at = CURRENT_TIMESTAMP WHERE id = ?", application_id);

    // Transition project to 'assigned'
    await transitionProject(db, projectId, 'assigned', {
      assigned_talent_id: talentId,
      assigned_mentor_id: assignedMentorId
    });

    // Notify talent
    await createNotification(db, {
      userId: talentId,
      type: 'application_accepted',
      payload: {
        projectId,
        title: project.title,
        businessName: req.user.name
      }
    });

    const updated = await db.get('SELECT * FROM projects WHERE id = ?', projectId);
    res.json({
      success: true,
      project: updated
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/projects/:id/abandon (Talent withdraws or task abandoned)
router.post('/:id/abandon', authMiddleware, async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.id, 10);
    const db = await getDBConnection();

    const project = await db.get('SELECT * FROM projects WHERE id = ?', projectId);
    if (!project) throw new AppError('Project not found.', 404, 'NOT_FOUND');

    const isTalent = project.assigned_talent_id === req.user.id;
    const isOwner = project.business_id === req.user.id;

    if (!isTalent && !isOwner) {
      throw new AppError('You are not authorized to abandon this project.', 403, 'FORBIDDEN');
    }

    if (!['assigned', 'in_progress', 'changes_requested'].includes(project.status)) {
      throw new AppError(`Cannot abandon project from status '${project.status}'.`, 400, 'INVALID_STATUS');
    }

    // Mark application as withdrawn
    if (project.assigned_talent_id) {
      await db.run(
        "UPDATE applications SET status = 'withdrawn', updated_at = CURRENT_TIMESTAMP WHERE project_id = ? AND talent_id = ?",
        [projectId, project.assigned_talent_id]
      );
    }

    // Reset assigned talent and mentor, project returns to 'open' with escrow untouched
    await transitionProject(db, projectId, 'open', {
      assigned_talent_id: null,
      assigned_mentor_id: null
    });

    const updated = await db.get('SELECT * FROM projects WHERE id = ?', projectId);
    res.json({
      success: true,
      message: 'Project returned to open marketplace with escrow funds intact.',
      project: updated
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/projects/:id/request-changes (Revision loop with 3 round cap)
router.post('/:id/request-changes', authMiddleware, requireType('business'), async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.id, 10);
    const { notes } = requestChangesSchema.parse(req.body);
    const db = await getDBConnection();

    const project = await db.get('SELECT * FROM projects WHERE id = ?', projectId);
    if (!project) throw new AppError('Project not found.', 404, 'NOT_FOUND');
    if (project.business_id !== req.user.id) throw new AppError('You do not own this project.', 403, 'FORBIDDEN');

    if (!['submitted', 'in_review'].includes(project.status)) {
      throw new AppError(`Cannot request changes on project with status '${project.status}'.`, 400, 'INVALID_STATUS');
    }

    // Check revision round count
    const latestDeliverable = await db.get(
      'SELECT MAX(round) as latest_round FROM deliverables WHERE project_id = ?',
      projectId
    );
    const currentRound = latestDeliverable ? latestDeliverable.latest_round : 1;

    if (currentRound >= 3) {
      throw new AppError(
        'Maximum revision cap reached (3 rounds allowed). Please approve the deliverable or initiate dispute.',
        422,
        'REVISION_CAP_REACHED'
      );
    }

    await transitionProject(db, projectId, 'changes_requested');

    // Notify talent
    await createNotification(db, {
      userId: project.assigned_talent_id,
      type: 'changes_requested',
      payload: {
        projectId,
        title: project.title,
        notes,
        round: currentRound
      }
    });

    const updated = await db.get('SELECT * FROM projects WHERE id = ?', projectId);
    res.json({
      success: true,
      project: updated,
      current_round: currentRound,
      notes
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/projects/:id/approve (Business approves deliverable -> triggers escrow release)
router.post('/:id/approve', authMiddleware, requireType('business'), async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.id, 10);
    const db = await getDBConnection();

    const project = await db.get('SELECT * FROM projects WHERE id = ?', projectId);
    if (!project) throw new AppError('Project not found.', 404, 'NOT_FOUND');
    if (project.business_id !== req.user.id) throw new AppError('You do not own this project.', 403, 'FORBIDDEN');

    if (!['submitted', 'in_review'].includes(project.status)) {
      throw new AppError(`Cannot approve project with status '${project.status}'.`, 400, 'INVALID_STATUS');
    }

    const escrow = await db.get('SELECT * FROM escrows WHERE project_id = ?', projectId);
    if (!escrow || escrow.status !== 'funded') {
      throw new AppError('Escrow must be in funded status to approve and release.', 422, 'ESCROW_NOT_FUNDED');
    }

    // Fetch talent profile for pandascrow account id
    const talentProfile = await db.get('SELECT * FROM talent_profiles WHERE user_id = ?', project.assigned_talent_id);
    const talentAccountId = talentProfile ? talentProfile.pandascrow_account_id : `mock_talent_acc_${project.assigned_talent_id}`;

    // Move project to approved, escrow to release_pending
    await transitionProject(db, projectId, 'approved');
    await db.run(
      "UPDATE escrows SET status = 'release_pending', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      escrow.id
    );

    // Call Pandascrow release
    const releaseResult = await pandascrow.releaseEscrow({
      escrowId: escrow.pandascrow_escrow_id,
      talentAccountId,
      amountKobo: escrow.amount_kobo
    });

    // Record payout
    const payoutIns = await db.run(`
      INSERT INTO payouts (escrow_id, talent_id, amount_kobo, pandascrow_transaction_ref, status)
      VALUES (?, ?, ?, ?, 'pending')
    `, [escrow.id, project.assigned_talent_id, escrow.amount_kobo, releaseResult.transactionRef]);

    // If Pandascrow mock client was used (or returned success immediately), complete the release
    if (releaseResult.status === 'released' || process.env.PANDASCROW_MODE !== 'real') {
      await db.run(
        "UPDATE payouts SET status = 'success', completed_at = CURRENT_TIMESTAMP WHERE id = ?",
        payoutIns.lastID
      );
      await db.run(
        "UPDATE escrows SET status = 'released', released_at = CURRENT_TIMESTAMP, payout_ref = ? WHERE id = ?",
        [releaseResult.transactionRef, escrow.id]
      );
      await transitionProject(db, projectId, 'completed');

      // Update verified skills
      await verifyTalentSkills(db, project.assigned_talent_id);

      // Notify talent
      await createNotification(db, {
        userId: project.assigned_talent_id,
        type: 'payout_released',
        payload: {
          projectId,
          title: project.title,
          amount_kobo: escrow.amount_kobo,
          transactionRef: releaseResult.transactionRef
        }
      });
    }

    const updated = await db.get('SELECT * FROM projects WHERE id = ?', projectId);
    res.json({
      success: true,
      message: 'Project approved and escrow payout initiated.',
      project: updated,
      transaction_ref: releaseResult.transactionRef
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/projects/:id/cancel (Business cancels project -> triggers refund if funded)
router.post('/:id/cancel', authMiddleware, requireType('business'), async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.id, 10);
    const db = await getDBConnection();

    const project = await db.get('SELECT * FROM projects WHERE id = ?', projectId);
    if (!project) throw new AppError('Project not found.', 404, 'NOT_FOUND');
    if (project.business_id !== req.user.id) throw new AppError('You do not own this project.', 403, 'FORBIDDEN');

    if (project.status === 'completed') {
      throw new AppError('Cannot cancel a completed project.', 400, 'ALREADY_COMPLETED');
    }

    const escrow = await db.get('SELECT * FROM escrows WHERE project_id = ?', projectId);
    if (escrow && escrow.status === 'funded') {
      const refundResult = await pandascrow.refundEscrow({
        escrowId: escrow.pandascrow_escrow_id,
        reason: 'business_cancelled'
      });
      await db.run(
        "UPDATE escrows SET status = 'refunded', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        escrow.id
      );
    }

    await transitionProject(db, projectId, 'cancelled');

    const updated = await db.get('SELECT * FROM projects WHERE id = ?', projectId);
    res.json({
      success: true,
      project: updated
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
