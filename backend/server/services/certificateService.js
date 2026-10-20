const crypto = require('crypto');
const { getVerifiedTalentProfile } = require('./profileQuery');
const { AppError } = require('../middleware/errorHandler');

/**
 * Deterministically serialize a JS object with sorted keys
 */
function canonicalStringify(obj) {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalStringify).join(',') + ']';
  }
  const keys = Object.keys(obj).sort();
  const pairs = keys.map(k => JSON.stringify(k) + ':' + canonicalStringify(obj[k]));
  return '{' + pairs.join(',') + '}';
}

function computeSha256(canonicalStr) {
  return crypto.createHash('sha256').update(canonicalStr, 'utf8').digest('hex');
}

function generateSlug() {
  const chars = '0123456789abcdefghjkmnpqrstvwxyz'; // base32 url-safe
  let str = '';
  const bytes = crypto.randomBytes(10);
  for (let i = 0; i < 10; i++) {
    str += chars[bytes[i] % chars.length];
  }
  return `mci_${str}`;
}

/**
 * Issues a new certificate for a talent.
 */
async function issueCertificate(db, talentId) {
  // 1. Get profile data
  const profile = await getVerifiedTalentProfile(db, talentId);
  if (!profile) {
    throw new AppError('Talent user not found', 404, 'USER_NOT_FOUND');
  }

  // Precondition: at least 1 completed + escrow-released task
  if (!profile.completed_tasks || profile.completed_tasks.length === 0) {
    throw new AppError(
      'Complete at least one paid task to issue a certificate.',
      422,
      'NO_VERIFIED_WORK'
    );
  }

  const issuedAt = new Date().toISOString();
  const slug = generateSlug();

  // Create clean snapshot payload without sensitive identity fields
  const snapshotDraft = {
    talent: {
      id: profile.user.id,
      name: profile.user.name,
      university: profile.user.university,
      course: profile.user.course,
      bio: profile.user.bio
    },
    skills: profile.skills,
    completed_tasks: profile.completed_tasks,
    stats: profile.stats
  };

  // Draft hash to check 24h idempotency
  const contentHash = computeSha256(canonicalStringify(snapshotDraft));

  // Check if identical active cert was issued within 24 hours
  const recentCert = await db.get(`
    SELECT * FROM certificates 
    WHERE talent_id = ? 
      AND revoked_at IS NULL 
      AND superseded_by IS NULL
      AND datetime(issued_at) > datetime('now', '-24 hours')
    ORDER BY id DESC LIMIT 1
  `, talentId);

  if (recentCert) {
    const existingSnapshot = JSON.parse(recentCert.snapshot_json);
    const existingDraft = {
      talent: existingSnapshot.talent,
      skills: existingSnapshot.skills,
      completed_tasks: existingSnapshot.completed_tasks,
      stats: existingSnapshot.stats
    };
    const existingHash = computeSha256(canonicalStringify(existingDraft));

    if (existingHash === contentHash) {
      // Idempotent return of recent certificate
      return {
        certificate: recentCert,
        isExisting: true
      };
    }
  }

  // Embed the certificate block into the snapshot so the hash covers the whole certificate
  const fullSnapshot = {
    certificate: {
      slug,
      issued_at: issuedAt,
      issuer: 'MicroIntern',
      issuer_url: 'https://microintern.ng',
      snapshot_hash: '' // placeholder for hashing
    },
    ...snapshotDraft
  };

  // Canonicalize and hash with placeholder
  const initialCanonical = canonicalStringify(fullSnapshot);
  const snapshotHash = `sha256:${computeSha256(initialCanonical)}`;
  fullSnapshot.certificate.snapshot_hash = snapshotHash;

  const finalSnapshotJson = JSON.stringify(fullSnapshot);

  // Insert certificate
  const insertResult = await db.run(`
    INSERT INTO certificates (slug, talent_id, snapshot_json, snapshot_hash, issued_at)
    VALUES (?, ?, ?, ?, ?)
  `, [slug, talentId, finalSnapshotJson, snapshotHash, issuedAt]);

  const newCertId = insertResult.lastID;

  // Mark previous active certificate as superseded by this one
  const prevCert = await db.get(`
    SELECT id FROM certificates
    WHERE talent_id = ? AND id != ? AND superseded_by IS NULL AND revoked_at IS NULL
    ORDER BY id DESC LIMIT 1
  `, [talentId, newCertId]);

  if (prevCert) {
    await db.run('UPDATE certificates SET superseded_by = ? WHERE id = ?', [newCertId, prevCert.id]);
    await db.run(`
      INSERT INTO certificate_events (certificate_id, event, actor_id, metadata_json)
      VALUES (?, 'superseded', ?, ?)
    `, [prevCert.id, talentId, JSON.stringify({ superseded_by: newCertId })]);
  }

  // Audit log: issued
  await db.run(`
    INSERT INTO certificate_events (certificate_id, event, actor_id, metadata_json)
    VALUES (?, 'issued', ?, ?)
  `, [newCertId, talentId, JSON.stringify({ slug, snapshot_hash: snapshotHash })]);

  const certRow = await db.get('SELECT * FROM certificates WHERE id = ?', newCertId);
  return {
    certificate: certRow,
    isExisting: false
  };
}

module.exports = {
  canonicalStringify,
  computeSha256,
  generateSlug,
  issueCertificate
};
