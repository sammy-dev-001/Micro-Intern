const express = require('express');
const { getDBConnection } = require('../db');
const { transitionProject } = require('../services/stateMachine');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();

// Gated behind non-production or mock mode
router.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && process.env.PANDASCROW_MODE !== 'mock') {
    return res.status(403).json({ error: 'Dev endpoints are disabled in production mode.' });
  }
  next();
});

// POST /api/dev/escrow/:id/fund (Simulate funding webhook)
router.post('/escrow/:id/fund', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const db = await getDBConnection();

    // Check if :id is escrow.id or project.id
    let escrow = await db.get('SELECT * FROM escrows WHERE id = ?', id);
    if (!escrow) {
      escrow = await db.get('SELECT * FROM escrows WHERE project_id = ?', id);
    }

    if (!escrow) {
      throw new AppError('Escrow not found.', 404, 'NOT_FOUND');
    }

    // Set escrow funded
    await db.run(`
      UPDATE escrows 
      SET status = 'funded', funded_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, escrow.id);

    // Open project
    const project = await db.get('SELECT * FROM projects WHERE id = ?', escrow.project_id);
    if (project && project.status === 'draft') {
      await transitionProject(db, project.id, 'open');
    }

    const updatedProject = await db.get('SELECT * FROM projects WHERE id = ?', escrow.project_id);
    const updatedEscrow = await db.get('SELECT * FROM escrows WHERE id = ?', escrow.id);

    res.json({
      success: true,
      message: 'Simulated funding successful. Task is now open in marketplace.',
      project: updatedProject,
      escrow: updatedEscrow
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
