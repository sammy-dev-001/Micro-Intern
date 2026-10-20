const jwt = require('jsonwebtoken');
const { getDBConnection } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'microintern_jwt_super_secret_dev_key_2026_change_in_production';

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication token missing or invalid. Use Authorization: Bearer <token>'
      });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token.'
      });
    }

    const db = await getDBConnection();
    const user = await db.get(
      'SELECT id, name, email, type, created_at FROM users WHERE id = ?',
      decoded.userId
    );

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User belonging to this token no longer exists.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      req.user = null;
      return next();
    }

    const db = await getDBConnection();
    const user = await db.get(
      'SELECT id, name, email, type, created_at FROM users WHERE id = ?',
      decoded.userId
    );

    req.user = user || null;
    next();
  } catch (error) {
    req.user = null;
    next();
  }
}

function generateToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, type: user.type },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

module.exports = {
  authMiddleware,
  optionalAuth,
  generateToken,
  JWT_SECRET
};
