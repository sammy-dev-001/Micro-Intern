const express = require('express');
const path = require('path');
const fs = require('fs');
const { getDBConnection } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');
const { CERTIFICATES_DIR } = require('../middleware/upload');

const router = express.Router();

// GET /api/files/:id (Auth-gated project file download)
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const fileId = parseInt(req.params.id, 10);
    const db = await getDBConnection();

    const fileRecord = await db.get('SELECT * FROM project_files WHERE id = ?', fileId);
    if (!fileRecord) {
      throw new AppError('File not found.', 404, 'FILE_NOT_FOUND');
    }

    // Authorization check: User must be project business, assigned talent, or assigned mentor
    const project = await db.get('SELECT business_id, assigned_talent_id, assigned_mentor_id FROM projects WHERE id = ?', fileRecord.project_id);
    if (!project) {
      throw new AppError('Associated project not found.', 404, 'NOT_FOUND');
    }

    const isAuthorized = [
      project.business_id,
      project.assigned_talent_id,
      project.assigned_mentor_id
    ].includes(req.user.id);

    if (!isAuthorized) {
      throw new AppError('You are not authorized to access this file.', 403, 'FORBIDDEN');
    }

    if (!fs.existsSync(fileRecord.storage_path)) {
      throw new AppError('File content is missing from storage.', 404, 'STORAGE_FILE_MISSING');
    }

    res.download(fileRecord.storage_path, fileRecord.original_name);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
