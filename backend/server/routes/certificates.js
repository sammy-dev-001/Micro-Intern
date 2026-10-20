const express = require('express');
const { getDBConnection } = require('../db');
const { authMiddleware, optionalAuth } = require('../middleware/auth');
const requireType = require('../middleware/requireType');
const { AppError } = require('../middleware/errorHandler');
const { issueCertificate } = require('../services/certificateService');
const { pdfWorker } = require('../workers/pdfWorker');

const router = express.Router();

// POST /api/users/me/certificates (Issue new certificate)
router.post('/me/certificates', authMiddleware, requireType('talent'), async (req, res, next) => {
  try {
    const db = await getDBConnection();
    const result = await issueCertificate(db, req.user.id);
    const cert = result.certificate;

    // Enqueue PDF generation if new
    if (!result.isExisting || !cert.pdf_path) {
      pdfWorker.enqueue({ db, certificateId: cert.id });
    }

    res.status(result.isExisting ? 200 : 201).json({
      slug: cert.slug,
      url: `/c/${cert.slug}`,
      issued_at: cert.issued_at,
      snapshot_hash: cert.snapshot_hash,
      pdf_status: cert.pdf_path ? 'ready' : 'pending',
      pdf_url: cert.pdf_path ? `/c/${cert.slug}.pdf` : null
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/me/certificates (List user's certificates)
router.get('/me/certificates', authMiddleware, requireType('talent'), async (req, res, next) => {
  try {
    const db = await getDBConnection();
    const certs = await db.all(`
      SELECT id, slug, snapshot_hash, issued_at, superseded_by, revoked_at,
             pdf_path, pdf_generated_at, created_at
      FROM certificates
      WHERE talent_id = ?
      ORDER BY id DESC
    `, req.user.id);

    const formatted = certs.map((c, index) => ({
      id: c.id,
      slug: c.slug,
      url: `/c/${c.slug}`,
      snapshot_hash: c.snapshot_hash,
      issued_at: c.issued_at,
      superseded_by: c.superseded_by,
      revoked_at: c.revoked_at,
      is_current: !c.superseded_by && !c.revoked_at,
      pdf_url: c.pdf_path ? `/c/${c.slug}.pdf` : null
    }));

    res.json(formatted);
  } catch (err) {
    next(err);
  }
});

// GET /api/certificates/:slug (Public certificate view)
router.get('/:slug', optionalAuth, async (req, res, next) => {
  try {
    const { slug } = req.params;
    const db = await getDBConnection();

    const cert = await db.get('SELECT * FROM certificates WHERE slug = ?', slug);
    if (!cert) {
      throw new AppError('Certificate not found.', 404, 'CERTIFICATE_NOT_FOUND');
    }

    // Find superseded slug if applicable
    let supersededSlug = null;
    if (cert.superseded_by) {
      const newer = await db.get('SELECT slug FROM certificates WHERE id = ?', cert.superseded_by);
      if (newer) supersededSlug = newer.slug;
    }

    const snapshot = JSON.parse(cert.snapshot_json);

    // Audit log: viewed
    await db.run(`
      INSERT INTO certificate_events (certificate_id, event, actor_id, metadata_json)
      VALUES (?, 'viewed', ?, ?)
    `, [cert.id, req.user ? req.user.id : null, JSON.stringify({ ip: req.ip })]);

    res.json({
      ...snapshot,
      certificate: {
        slug: cert.slug,
        issued_at: cert.issued_at,
        issuer: snapshot.certificate?.issuer || 'MicroIntern',
        issuer_url: snapshot.certificate?.issuer_url || 'https://microintern.ng',
        snapshot_hash: cert.snapshot_hash,
        superseded_by: supersededSlug,
        revoked: !!cert.revoked_at,
        revoked_at: cert.revoked_at,
        pdf_url: cert.pdf_path ? `/c/${cert.slug}.pdf` : null
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/certificates/:slug/verify (Public machine-readable verification)
router.get('/:slug/verify', async (req, res, next) => {
  try {
    const { slug } = req.params;
    const db = await getDBConnection();

    const cert = await db.get('SELECT slug, snapshot_hash, issued_at, revoked_at FROM certificates WHERE slug = ?', slug);
    if (!cert) {
      return res.status(404).json({
        valid: false,
        reason: 'not_found'
      });
    }

    if (cert.revoked_at) {
      return res.json({
        valid: false,
        reason: 'revoked',
        revoked_at: cert.revoked_at,
        snapshot_hash: cert.snapshot_hash
      });
    }

    res.json({
      valid: true,
      slug: cert.slug,
      snapshot_hash: cert.snapshot_hash,
      issued_at: cert.issued_at
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/certificates/:id/revoke (Revoke certificate)
router.post('/:id/revoke', authMiddleware, async (req, res, next) => {
  try {
    const certId = parseInt(req.params.id, 10);
    const db = await getDBConnection();

    const cert = await db.get('SELECT * FROM certificates WHERE id = ?', certId);
    if (!cert) throw new AppError('Certificate not found.', 404, 'NOT_FOUND');

    if (cert.talent_id !== req.user.id) {
      throw new AppError('You do not own this certificate.', 403, 'FORBIDDEN');
    }

    await db.run('UPDATE certificates SET revoked_at = CURRENT_TIMESTAMP WHERE id = ?', certId);

    await db.run(`
      INSERT INTO certificate_events (certificate_id, event, actor_id, metadata_json)
      VALUES (?, 'revoked', ?, ?)
    `, [certId, req.user.id, JSON.stringify({ reason: req.body?.reason || 'talent_revocation' })]);

    res.json({
      success: true,
      message: 'Certificate revoked. Old downloaded copies will be flagged as revoked on the public verification page.'
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/certificates/:id/pdf (Regenerate PDF)
router.post('/:id/pdf', authMiddleware, async (req, res, next) => {
  try {
    const certId = parseInt(req.params.id, 10);
    const db = await getDBConnection();

    const cert = await db.get('SELECT * FROM certificates WHERE id = ?', certId);
    if (!cert) throw new AppError('Certificate not found.', 404, 'NOT_FOUND');

    if (cert.talent_id !== req.user.id) {
      throw new AppError('You do not own this certificate.', 403, 'FORBIDDEN');
    }

    pdfWorker.enqueue({ db, certificateId: certId });

    res.json({
      success: true,
      message: 'PDF generation enqueued.',
      slug: cert.slug
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
