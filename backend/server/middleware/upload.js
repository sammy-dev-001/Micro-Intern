const multer = require('multer');
const path = require('path');
const fs = require('fs');

const STORAGE_ROOT = path.resolve(process.env.STORAGE_DIR || path.join(__dirname, '../../storage'));
const UPLOADS_DIR = path.join(STORAGE_ROOT, 'uploads');
const CERTIFICATES_DIR = path.join(STORAGE_ROOT, 'certificates');

// Ensure directories exist
fs.mkdirSync(UPLOADS_DIR, { recursive: true });
fs.mkdirSync(CERTIFICATES_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const sanitizedExt = path.extname(file.originalname).toLowerCase();
    const baseName = path.basename(file.originalname, sanitizedExt).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${baseName}-${uniqueSuffix}${sanitizedExt}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024 // 25 MB limit
  }
});

module.exports = {
  upload,
  STORAGE_ROOT,
  UPLOADS_DIR,
  CERTIFICATES_DIR
};
