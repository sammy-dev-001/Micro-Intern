const express = require('express');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const { getDBConnection } = require('../db');
const { authMiddleware, generateToken } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');

const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET;

const router = express.Router();

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  type: z.enum(['talent', 'business'], { errorMap: () => ({ message: "Type must be 'talent' or 'business'" }) }),
  // Talent profile fields
  university: z.string().optional().nullable(),
  course: z.string().optional().nullable(),
  year_of_study: z.number().int().min(1).max(7).optional().nullable(),
  bio: z.string().optional().nullable(),
  skills: z.array(z.string()).optional(),
  // Business profile fields
  company_name: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  company_size: z.string().optional().nullable(),
  website: z.string().optional().nullable()
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required')
});

// POST /api/auth/register (and /api/v2/auth/register)
router.post('/register', async (req, res, next) => {
  try {
    const validated = registerSchema.parse(req.body);
    const db = await getDBConnection();

    // Check for existing user
    const existing = await db.get('SELECT id FROM users WHERE email = ?', validated.email);
    if (existing) {
      throw new AppError('An account with this email already exists.', 409, 'EMAIL_EXISTS');
    }

    // Hash password with 12 rounds
    const salt = await bcrypt.genSalt(12);
    const password_hash = await bcrypt.hash(validated.password, salt);

    // Insert user
    const result = await db.run(
      `INSERT INTO users (name, email, password_hash, type) VALUES (?, ?, ?, ?)`,
      [validated.name, validated.email, password_hash, validated.type]
    );
    const userId = result.lastID;

    // Create profile
    if (validated.type === 'talent') {
      await db.run(
        `INSERT INTO talent_profiles (user_id, university, course, year_of_study, bio, kyc_status)
         VALUES (?, ?, ?, ?, ?, 'none')`,
        [userId, validated.university || null, validated.course || null, validated.year_of_study || null, validated.bio || null]
      );

      // Handle skills if provided
      if (validated.skills && Array.isArray(validated.skills)) {
        for (const skillName of validated.skills) {
          const trimmed = skillName.trim();
          if (!trimmed) continue;
          let skill = await db.get('SELECT id FROM skills WHERE LOWER(name) = LOWER(?)', trimmed);
          if (!skill) {
            const ins = await db.run('INSERT INTO skills (name) VALUES (?)', trimmed);
            skill = { id: ins.lastID };
          }
          await db.run(
            `INSERT OR IGNORE INTO talent_skills (talent_id, skill_id, source) VALUES (?, ?, 'self_declared')`,
            [userId, skill.id]
          );
        }
      }
    } else {
      await db.run(
        `INSERT INTO business_profiles (user_id, company_name, industry, company_size, website)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, validated.company_name || validated.name, validated.industry || null, validated.company_size || null, validated.website || null]
      );
    }

    const user = await db.get('SELECT id, name, email, type, created_at FROM users WHERE id = ?', userId);
    const token = generateToken(user);

    res.status(201).json({
      user,
      token
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const db = await getDBConnection();

    const user = await db.get('SELECT * FROM users WHERE email = ?', email);
    if (!user) {
      throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
    }

    // Fetch profile details
    let profile = null;
    if (user.type === 'talent') {
      profile = await db.get('SELECT * FROM talent_profiles WHERE user_id = ?', user.id);
    } else {
      profile = await db.get('SELECT * FROM business_profiles WHERE user_id = ?', user.id);
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      type: user.type,
      created_at: user.created_at,
      profile
    };

    const token = generateToken(safeUser);

    res.json({
      user: safeUser,
      token
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const db = await getDBConnection();
    let profile = null;
    if (req.user.type === 'talent') {
      profile = await db.get('SELECT * FROM talent_profiles WHERE user_id = ?', req.user.id);
    } else {
      profile = await db.get('SELECT * FROM business_profiles WHERE user_id = ?', req.user.id);
    }

    res.json({
      user: {
        ...req.user,
        profile
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  // Stateless JWT: client discards token
  res.json({ success: true, message: 'Logged out successfully.' });
});

// POST /auth/google
// Verifies a Google ID token.
// Existing user → { user, token }
// New user → { needs_role: true, pending: <signed-JWT> }
// The signed JWT contains { google_id, email, name } and expires in 10 min.
// The frontend passes it back to /auth/google/complete after role selection.
router.post('/google', async (req, res, next) => {
  try {
    const { credential } = req.body || {};
    if (!credential) {
      throw new AppError('Missing Google credential.', 400, 'MISSING_CREDENTIAL');
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new AppError('Invalid Google token.', 401, 'INVALID_GOOGLE_TOKEN');
    }

    const email = payload.email.toLowerCase();
    const name = payload.name || email.split('@')[0];
    const googleId = payload.sub;

    const db = await getDBConnection();

    // Existing user → log in
    const existing = await db.get('SELECT * FROM users WHERE email = ?', email);
    if (existing) {
      let profile = null;
      if (existing.type === 'talent') {
        profile = await db.get('SELECT * FROM talent_profiles WHERE user_id = ?', existing.id);
      } else {
        profile = await db.get('SELECT * FROM business_profiles WHERE user_id = ?', existing.id);
      }
      const safeUser = {
        id: existing.id,
        name: existing.name,
        email: existing.email,
        type: existing.type,
        created_at: existing.created_at,
        profile,
      };
      const token = generateToken(safeUser);
      return res.json({ user: safeUser, token });
    }

    // New user → signed pending JWT, then hand off to role selection
    const pending = jwt.sign(
      { google_id: googleId, email, name },
      JWT_SECRET,
      { expiresIn: '10m' }
    );

    return res.json({ needs_role: true, pending });
  } catch (err) {
    next(err);
  }
});

// POST /auth/google/complete
// Accepts { pending: <signed-JWT>, type: 'talent' | 'business' }.
// Verifies the JWT (so pending cannot be forged), creates the user.
router.post('/google/complete', async (req, res, next) => {
  try {
    const { pending, type } = req.body || {};
    if (!pending || !type) {
      throw new AppError('Missing required fields.', 400, 'MISSING_FIELDS');
    }
    if (!['talent', 'business'].includes(type)) {
      throw new AppError("Type must be 'talent' or 'business'.", 400, 'INVALID_TYPE');
    }

    let claims;
    try {
      claims = jwt.verify(pending, JWT_SECRET);
    } catch (e) {
      throw new AppError(
        'Signup session expired or invalid. Please start over.',
        401,
        'INVALID_PENDING'
      );
    }

    const { email, name } = claims;
    if (!email || !name) {
      throw new AppError('Invalid pending data.', 400, 'INVALID_PENDING');
    }

    const db = await getDBConnection();

    const existing = await db.get('SELECT id FROM users WHERE email = ?', email.toLowerCase());
    if (existing) {
      throw new AppError('An account with this email already exists.', 409, 'EMAIL_EXISTS');
    }

    // Google users have no password. Store a random-hash so the column is
    // non-null and the account can't be password-logged-into.
    const bcrypt = require('bcryptjs');
    const randomPw = require('crypto').randomBytes(32).toString('hex');
    const salt = await bcrypt.genSalt(12);
    const password_hash = await bcrypt.hash(randomPw, salt);

    const result = await db.run(
      `INSERT INTO users (name, email, password_hash, type) VALUES (?, ?, ?, ?)`,
      [name, email.toLowerCase(), password_hash, type]
    );
    const userId = result.lastID;

    if (type === 'talent') {
      await db.run(
        `INSERT INTO talent_profiles (user_id, kyc_status) VALUES (?, 'none')`,
        [userId]
      );
    } else {
      await db.run(
        `INSERT INTO business_profiles (user_id, company_name) VALUES (?, ?)`,
        [userId, name]
      );
    }

    const user = await db.get(
      'SELECT id, name, email, type, created_at FROM users WHERE id = ?',
      userId
    );
    const token = generateToken(user);

    res.status(201).json({ user, token });
  } catch (err) {
    next(err);
  }
});
module.exports = router;
