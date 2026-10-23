const express = require('express');
const { getDBConnection } = require('../db');

const router = express.Router();

// GET /api/v2/skills
// Public. Returns all skills, sorted alphabetically.
// Used by the signup picker and (later) any skill filter UI.
router.get('/', async (req, res, next) => {
  try {
    const db = await getDBConnection();
    const rows = await db.all('SELECT id, name FROM skills ORDER BY name ASC');
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;