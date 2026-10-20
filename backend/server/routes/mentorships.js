const express = require('express');
const { z } = require('zod');
const { getDBConnection } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');
const { createNotification } = require('../services/notifications');

const router = express.Router();

const inviteSchema = z.object({
  talent_id: z.number().int().positive('Valid talent_id is required')
});

// POST /api/mentorships (Mentor invites a talent)
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { talent_id } = inviteSchema.parse(req.body);
    const mentor_id = req.user.id;

    if (mentor_id === talent_id) {
      throw new AppError('Self-mentorship is not allowed.', 400, 'SELF_MENTORSHIP_FORBIDDEN');
    }

    const db = await getDBConnection();

    // Verify talent exists
    const talent = await db.get("SELECT id, name, type FROM users WHERE id = ?", talent_id);
    if (!talent) {
      throw new AppError('Talent user not found.', 404, 'USER_NOT_FOUND');
    }

    // Rule: max 3 active mentees per mentor
    const activeMenteesCount = await db.get(
      "SELECT COUNT(*) as count FROM mentorships WHERE mentor_id = ? AND status = 'active'",
      mentor_id
    );
    if (activeMenteesCount.count >= 3) {
      throw new AppError('Mentors can have at most 3 active mentees.', 422, 'MENTOR_CAP_EXCEEDED');
    }

    // Rule: max 1 active mentor per talent
    const activeMentorCount = await db.get(
      "SELECT COUNT(*) as count FROM mentorships WHERE talent_id = ? AND status = 'active'",
      talent_id
    );
    if (activeMentorCount.count >= 1) {
      throw new AppError('This talent already has an active mentor (max 1 allowed).', 422, 'TALENT_MENTOR_CAP_EXCEEDED');
    }

    // Check if an existing invite or relationship exists
    const existing = await db.get(
      "SELECT id, status FROM mentorships WHERE mentor_id = ? AND talent_id = ? AND status IN ('pending', 'active')",
      [mentor_id, talent_id]
    );
    if (existing) {
      throw new AppError(
        `A mentorship relationship already exists in '${existing.status}' status.`,
        409,
        'MENTORSHIP_EXISTS'
      );
    }

    const result = await db.run(
      `INSERT INTO mentorships (mentor_id, talent_id, status) VALUES (?, ?, 'pending')`,
      [mentor_id, talent_id]
    );

    await createNotification(db, {
      userId: talent_id,
      type: 'mentorship_invite',
      payload: {
        mentorshipId: result.lastID,
        mentorName: req.user.name,
        mentorId: mentor_id
      }
    });

    res.status(201).json({
      id: result.lastID,
      mentor_id,
      talent_id,
      status: 'pending'
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/mentorships/:id/accept (Talent accepts invite)
router.post('/:id/accept', authMiddleware, async (req, res, next) => {
  try {
    const mentorshipId = parseInt(req.params.id, 10);
    const db = await getDBConnection();

    const mentorship = await db.get('SELECT * FROM mentorships WHERE id = ?', mentorshipId);
    if (!mentorship) {
      throw new AppError('Mentorship invite not found.', 404, 'NOT_FOUND');
    }

    if (mentorship.talent_id !== req.user.id) {
      throw new AppError('Only the invited talent can accept this mentorship.', 403, 'FORBIDDEN');
    }

    if (mentorship.status !== 'pending') {
      throw new AppError(`Cannot accept mentorship with status '${mentorship.status}'.`, 400, 'INVALID_STATUS');
    }

    // Re-verify rules:
    const activeMentorCount = await db.get(
      "SELECT COUNT(*) as count FROM mentorships WHERE talent_id = ? AND status = 'active'",
      req.user.id
    );
    if (activeMentorCount.count >= 1) {
      throw new AppError('You already have an active mentor (max 1 allowed).', 422, 'TALENT_MENTOR_CAP_EXCEEDED');
    }

    const mentorActiveCount = await db.get(
      "SELECT COUNT(*) as count FROM mentorships WHERE mentor_id = ? AND status = 'active'",
      mentorship.mentor_id
    );
    if (mentorActiveCount.count >= 3) {
      throw new AppError('The mentor has reached the maximum of 3 active mentees.', 422, 'MENTOR_CAP_EXCEEDED');
    }

    await db.run(
      "UPDATE mentorships SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      mentorshipId
    );

    await createNotification(db, {
      userId: mentorship.mentor_id,
      type: 'mentorship_accepted',
      payload: {
        mentorshipId,
        talentName: req.user.name,
        talentId: req.user.id
      }
    });

    res.json({
      success: true,
      id: mentorshipId,
      status: 'active'
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/mentorships/:id (End or decline mentorship)
router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const mentorshipId = parseInt(req.params.id, 10);
    const db = await getDBConnection();

    const mentorship = await db.get('SELECT * FROM mentorships WHERE id = ?', mentorshipId);
    if (!mentorship) {
      throw new AppError('Mentorship not found.', 404, 'NOT_FOUND');
    }

    if (mentorship.mentor_id !== req.user.id && mentorship.talent_id !== req.user.id) {
      throw new AppError('You are not authorized to modify this mentorship.', 403, 'FORBIDDEN');
    }

    await db.run(
      "UPDATE mentorships SET status = 'ended', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      mentorshipId
    );

    res.json({
      success: true,
      id: mentorshipId,
      status: 'ended'
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/me/mentees (Mentees list for mentor)
router.get('/mentees', authMiddleware, async (req, res, next) => {
  try {
    const db = await getDBConnection();
    const mentees = await db.all(`
      SELECT m.id as mentorship_id, m.status, m.created_at,
             u.id as talent_id, u.name, u.email,
             tp.university, tp.course, tp.year_of_study
      FROM mentorships m
      JOIN users u ON m.talent_id = u.id
      LEFT JOIN talent_profiles tp ON u.id = tp.user_id
      WHERE m.mentor_id = ? AND m.status = 'active'
      ORDER BY m.created_at DESC
    `, req.user.id);

    res.json({ mentees });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/me/mentor (Active mentor for talent)
router.get('/mentor', authMiddleware, async (req, res, next) => {
  try {
    const db = await getDBConnection();
    const mentor = await db.get(`
      SELECT m.id as mentorship_id, m.status, m.created_at,
             u.id as mentor_id, u.name, u.email, u.type as mentor_type,
             bp.company_name, bp.industry
      FROM mentorships m
      JOIN users u ON m.mentor_id = u.id
      LEFT JOIN business_profiles bp ON u.id = bp.user_id
      WHERE m.talent_id = ? AND m.status = 'active'
    `, req.user.id);

    res.json({ mentor: mentor || null });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
