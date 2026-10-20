const express = require('express');
const { getDBConnection } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router({ mergeParams: true });

// GET /api/projects/:id/escrow
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.id, 10);
    const db = await getDBConnection();

    const project = await db.get('SELECT business_id, assigned_talent_id FROM projects WHERE id = ?', projectId);
    if (!project) throw new AppError('Project not found.', 404, 'NOT_FOUND');

    const isAuthorized = req.user.id === project.business_id || req.user.id === project.assigned_talent_id;
    if (!isAuthorized) {
      throw new AppError('You are not authorized to view escrow details for this project.', 403, 'FORBIDDEN');
    }

    const escrow = await db.get('SELECT * FROM escrows WHERE project_id = ?', projectId);
    if (!escrow) {
      throw new AppError('Escrow record not found for this project.', 404, 'NOT_FOUND');
    }

    const payouts = await db.all('SELECT * FROM payouts WHERE escrow_id = ?', escrow.id);

    res.json({
      ...escrow,
      payouts
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
