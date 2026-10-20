const express = require('express');
const { z } = require('zod');
const { getDBConnection } = require('../db');
const { authMiddleware, optionalAuth } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router({ mergeParams: true });

const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5, 'Rating must be an integer between 1 and 5'),
  comment: z.string().optional().nullable()
});

// POST /api/projects/:id/reviews
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.id, 10);
    const { rating, comment } = createReviewSchema.parse(req.body);
    const db = await getDBConnection();

    const project = await db.get('SELECT * FROM projects WHERE id = ?', projectId);
    if (!project) throw new AppError('Project not found.', 404, 'NOT_FOUND');

    if (project.status !== 'completed' && project.status !== 'approved') {
      throw new AppError('Reviews can only be submitted after project approval/completion.', 400, 'PROJECT_NOT_COMPLETED');
    }

    const reviewerId = req.user.id;
    let revieweeId = null;

    if (reviewerId === project.business_id) {
      revieweeId = project.assigned_talent_id;
    } else if (reviewerId === project.assigned_talent_id) {
      revieweeId = project.business_id;
    } else {
      throw new AppError('You are not a participant in this project.', 403, 'FORBIDDEN');
    }

    if (!revieweeId) {
      throw new AppError('Cannot review a project without an assigned talent.', 400, 'NO_REVIEWEE');
    }

    // Check duplicate review
    const existing = await db.get(
      'SELECT id FROM reviews WHERE project_id = ? AND reviewer_id = ?',
      [projectId, reviewerId]
    );
    if (existing) {
      throw new AppError('You have already reviewed this project.', 409, 'ALREADY_REVIEWED');
    }

    const result = await db.run(`
      INSERT INTO reviews (project_id, reviewer_id, reviewee_id, rating, comment)
      VALUES (?, ?, ?, ?, ?)
    `, [projectId, reviewerId, revieweeId, rating, comment || null]);

    const review = await db.get('SELECT * FROM reviews WHERE id = ?', result.lastID);
    res.status(201).json(review);
  } catch (err) {
    next(err);
  }
});

// GET /api/users/:id/reviews (Public reviews for a user)
router.get('/user/:id', optionalAuth, async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const db = await getDBConnection();

    const reviews = await db.all(`
      SELECT r.*, u.name as reviewer_name, p.title as project_title
      FROM reviews r
      JOIN users u ON r.reviewer_id = u.id
      JOIN projects p ON r.project_id = p.id
      WHERE r.reviewee_id = ?
      ORDER BY r.created_at DESC
    `, userId);

    const stats = await db.get(`
      SELECT AVG(rating) as avg_rating, COUNT(id) as count
      FROM reviews
      WHERE reviewee_id = ?
    `, userId);

    res.json({
      reviews,
      stats: {
        avg_rating: stats && stats.count > 0 ? Math.round(stats.avg_rating * 10) / 10 : null,
        total_reviews: stats ? stats.count : 0
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
