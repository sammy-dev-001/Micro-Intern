const { AppError } = require('../middleware/errorHandler');

const PROJECT_STATES = {
  DRAFT: 'draft',
  OPEN: 'open',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  SUBMITTED: 'submitted',
  IN_REVIEW: 'in_review',
  CHANGES_REQUESTED: 'changes_requested',
  APPROVED: 'approved',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

const ALLOWED_TRANSITIONS = {
  [PROJECT_STATES.DRAFT]: [PROJECT_STATES.OPEN, PROJECT_STATES.CANCELLED],
  [PROJECT_STATES.OPEN]: [PROJECT_STATES.ASSIGNED, PROJECT_STATES.CANCELLED],
  [PROJECT_STATES.ASSIGNED]: [PROJECT_STATES.IN_PROGRESS, PROJECT_STATES.SUBMITTED, PROJECT_STATES.OPEN, PROJECT_STATES.CANCELLED], // open if abandoned, submitted when deliverable uploaded
  [PROJECT_STATES.IN_PROGRESS]: [PROJECT_STATES.SUBMITTED, PROJECT_STATES.OPEN, PROJECT_STATES.CANCELLED], // open if abandoned
  [PROJECT_STATES.SUBMITTED]: [PROJECT_STATES.IN_REVIEW, PROJECT_STATES.CHANGES_REQUESTED, PROJECT_STATES.APPROVED, PROJECT_STATES.CANCELLED],
  [PROJECT_STATES.IN_REVIEW]: [PROJECT_STATES.CHANGES_REQUESTED, PROJECT_STATES.APPROVED, PROJECT_STATES.CANCELLED],
  [PROJECT_STATES.CHANGES_REQUESTED]: [PROJECT_STATES.IN_PROGRESS, PROJECT_STATES.SUBMITTED, PROJECT_STATES.CANCELLED],
  [PROJECT_STATES.APPROVED]: [PROJECT_STATES.COMPLETED, PROJECT_STATES.CANCELLED],
  [PROJECT_STATES.COMPLETED]: [],
  [PROJECT_STATES.CANCELLED]: []
};

/**
 * Validates whether a state transition is legal according to the specification.
 */
function canTransition(currentStatus, targetStatus) {
  const allowed = ALLOWED_TRANSITIONS[currentStatus];
  if (!allowed) return false;
  return allowed.includes(targetStatus);
}

/**
 * Asserts that a state transition is valid, throwing an AppError if invalid.
 */
function assertTransition(currentStatus, targetStatus, context = '') {
  if (!canTransition(currentStatus, targetStatus)) {
    throw new AppError(
      `Invalid state transition from '${currentStatus}' to '${targetStatus}'. ${context}`.trim(),
      400,
      'INVALID_STATE_TRANSITION'
    );
  }
}

/**
 * Updates a project status with atomic checks and state machine validation.
 */
async function transitionProject(db, projectId, targetStatus, extraUpdates = {}) {
  const project = await db.get('SELECT * FROM projects WHERE id = ?', projectId);
  if (!project) {
    throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
  }

  // Idempotent: if already in targetStatus, apply extraUpdates if any and return
  if (project.status === targetStatus) {
    if (Object.keys(extraUpdates).length > 0) {
      const fields = ['updated_at = CURRENT_TIMESTAMP'];
      const values = [];
      for (const [key, value] of Object.entries(extraUpdates)) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
      values.push(projectId);
      await db.run(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`, values);
    }
    return await db.get('SELECT * FROM projects WHERE id = ?', projectId);
  }

  assertTransition(project.status, targetStatus, `Project ID: ${projectId}`);

  // Invariant enforcement: cannot reach open unless escrow exists and is funded
  if (targetStatus === PROJECT_STATES.OPEN) {
    const escrow = await db.get('SELECT * FROM escrows WHERE project_id = ?', projectId);
    if (!escrow || escrow.status !== 'funded') {
      throw new AppError(
        'Project cannot be opened without a funded escrow.',
        422,
        'ESCROW_NOT_FUNDED'
      );
    }
  }

  // Build dynamic update query
  const fields = ['status = ?', 'updated_at = CURRENT_TIMESTAMP'];
  const values = [targetStatus];

  for (const [key, value] of Object.entries(extraUpdates)) {
    fields.push(`${key} = ?`);
    values.push(value);
  }

  values.push(projectId);

  await db.run(
    `UPDATE projects SET ${fields.join(', ')} WHERE id = ?`,
    values
  );

  return await db.get('SELECT * FROM projects WHERE id = ?', projectId);
}

module.exports = {
  PROJECT_STATES,
  ALLOWED_TRANSITIONS,
  canTransition,
  assertTransition,
  transitionProject
};
