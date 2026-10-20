const express = require('express');
const { z } = require('zod');
const { getDBConnection } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { AppError } = require('../middleware/errorHandler');
const { transitionProject } = require('../services/stateMachine');
const { diffWorker } = require('../workers/diffWorker');
const { createNotification } = require('../services/notifications');

const router = express.Router({ mergeParams: true });

const deliverableBodySchema = z.object({
  link: z.string().optional().nullable(),
  notes: z.string().optional().nullable()
});

// POST /api/projects/:id/deliverables (Submit deliverable or revision)
router.post('/', authMiddleware, upload.single('output_file'), async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.id, 10);
    const { link, notes } = deliverableBodySchema.parse(req.body);
    const db = await getDBConnection();

    const project = await db.get('SELECT * FROM projects WHERE id = ?', projectId);
    if (!project) throw new AppError('Project not found.', 404, 'NOT_FOUND');

    if (project.assigned_talent_id !== req.user.id) {
      throw new AppError('Only the assigned talent can submit deliverables for this project.', 403, 'FORBIDDEN');
    }

    if (!['assigned', 'in_progress', 'changes_requested'].includes(project.status)) {
      throw new AppError(
        `Cannot submit deliverables when project is in '${project.status}' status.`,
        400,
        'INVALID_STATUS'
      );
    }

    // Determine round
    const lastDeliverable = await db.get(
      'SELECT MAX(round) as max_round FROM deliverables WHERE project_id = ?',
      projectId
    );
    const currentRound = (lastDeliverable && lastDeliverable.max_round) ? lastDeliverable.max_round + 1 : 1;

    if (currentRound > 3) {
      throw new AppError(
        'Revision cap reached: Maximum 3 rounds allowed.',
        422,
        'REVISION_CAP_EXCEEDED'
      );
    }

    // For data_cleaning, output file upload is required
    let outputFileRecord = null;
    if (req.file) {
      const insFile = await db.run(`
        INSERT INTO project_files (
          project_id, role, storage_path, original_name, size_bytes, uploaded_by
        ) VALUES (?, 'output', ?, ?, ?, ?)
      `, [
        projectId,
        req.file.path,
        req.file.originalname,
        req.file.size,
        req.user.id
      ]);
      outputFileRecord = { id: insFile.lastID, path: req.file.path, name: req.file.originalname };
    } else if (project.task_type === 'data_cleaning' && !link) {
      throw new AppError(
        'A cleaned output CSV file (or download link) is required for data cleaning deliverables.',
        400,
        'OUTPUT_FILE_REQUIRED'
      );
    }

    // Insert deliverable
    const initialCheckStatus = project.task_type === 'data_cleaning' ? null : 'not_applicable';
    const insDeliverable = await db.run(`
      INSERT INTO deliverables (
        project_id, talent_id, round, link, notes, automated_check_status
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      projectId,
      req.user.id,
      currentRound,
      link || (outputFileRecord ? outputFileRecord.name : null),
      notes || null,
      initialCheckStatus
    ]);

    const deliverableId = insDeliverable.lastID;

    // Transition project to submitted
    await transitionProject(db, projectId, 'submitted');

    // Run diffWorker if data_cleaning
    if (project.task_type === 'data_cleaning' && outputFileRecord) {
      const inputFile = await db.get(
        "SELECT storage_path FROM project_files WHERE project_id = ? AND role = 'input' ORDER BY id DESC LIMIT 1",
        projectId
      );

      if (inputFile) {
        diffWorker.enqueue({
          db,
          projectId,
          deliverableId,
          inputFileStoragePath: inputFile.storage_path,
          outputFileStoragePath: outputFileRecord.path
        });
      } else {
        // No input file found to compare with, move directly to in_review
        await transitionProject(db, projectId, 'in_review');
      }
    } else {
      // Non-diff project moves to in_review
      await transitionProject(db, projectId, 'in_review');

      // Notify business
      await createNotification(db, {
        userId: project.business_id,
        type: 'deliverable_submitted',
        payload: {
          projectId,
          deliverableId,
          title: project.title,
          round: currentRound
        }
      });
    }

    const created = await db.get('SELECT * FROM deliverables WHERE id = ?', deliverableId);
    res.status(201).json({
      success: true,
      deliverable: {
        ...created,
        automated_check_report: created.automated_check_report ? JSON.parse(created.automated_check_report) : null
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/projects/:id/deliverables
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.id, 10);
    const db = await getDBConnection();

    const project = await db.get('SELECT * FROM projects WHERE id = ?', projectId);
    if (!project) throw new AppError('Project not found.', 404, 'NOT_FOUND');

    const isAuthorized = [project.business_id, project.assigned_talent_id, project.assigned_mentor_id].includes(req.user.id);
    if (!isAuthorized) {
      throw new AppError('You are not authorized to view deliverables for this project.', 403, 'FORBIDDEN');
    }

    const deliverables = await db.all(
      'SELECT * FROM deliverables WHERE project_id = ? ORDER BY round ASC',
      projectId
    );

    const parsed = deliverables.map(d => ({
      ...d,
      automated_check_report: d.automated_check_report ? JSON.parse(d.automated_check_report) : null
    }));

    res.json(parsed);
  } catch (err) {
    next(err);
  }
});

// GET /api/projects/:id/deliverables/:round
router.get('/:round', authMiddleware, async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.id, 10);
    const round = parseInt(req.params.round, 10);
    const db = await getDBConnection();

    const project = await db.get('SELECT * FROM projects WHERE id = ?', projectId);
    if (!project) throw new AppError('Project not found.', 404, 'NOT_FOUND');

    const isAuthorized = [project.business_id, project.assigned_talent_id, project.assigned_mentor_id].includes(req.user.id);
    if (!isAuthorized) {
      throw new AppError('You are not authorized to view deliverables for this project.', 403, 'FORBIDDEN');
    }

    const deliverable = await db.get(
      'SELECT * FROM deliverables WHERE project_id = ? AND round = ?',
      [projectId, round]
    );

    if (!deliverable) {
      throw new AppError(`Deliverable round ${round} not found.`, 404, 'NOT_FOUND');
    }

    res.json({
      ...deliverable,
      automated_check_report: deliverable.automated_check_report ? JSON.parse(deliverable.automated_check_report) : null
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
