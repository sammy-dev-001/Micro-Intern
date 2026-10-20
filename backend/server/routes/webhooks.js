const express = require('express');
const { getDBConnection } = require('../db');
const { verifyWebhookSignature } = require('../services/pandascrow');
const { transitionProject } = require('../services/stateMachine');
const { verifyTalentSkills } = require('../services/skillVerifier');
const { createNotification } = require('../services/notifications');

const router = express.Router();

// POST /api/webhooks/pandascrow
router.post('/pandascrow', async (req, res, next) => {
  try {
    const signature = req.headers['x-pandascrow-signature'] || req.headers['x-signature'];

    // In production, signature verification is required
    if (process.env.NODE_ENV === 'production' || signature) {
      const isValid = verifyWebhookSignature(req.rawBody || JSON.stringify(req.body), signature);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid webhook signature.' });
      }
    }

    const { event, data } = req.body;
    if (!event || !data) {
      return res.status(400).json({ error: 'Invalid webhook payload structure.' });
    }

    const db = await getDBConnection();
    const escrowId = data.escrow_id || data.id;

    const escrow = await db.get('SELECT * FROM escrows WHERE pandascrow_escrow_id = ?', escrowId);
    if (!escrow) {
      console.warn(`[Webhook] No matching escrow found for pandascrow_escrow_id: ${escrowId}`);
      // Return 200 to acknowledge unhandled event idempotently
      return res.json({ received: true, unhandled: true });
    }

    const project = await db.get('SELECT * FROM projects WHERE id = ?', escrow.project_id);

    switch (event) {
      case 'escrow.funded': {
        // Idempotency: if already funded, return early
        if (escrow.status === 'funded') {
          return res.json({ received: true, idempotent: true });
        }

        await db.run(`
          UPDATE escrows 
          SET status = 'funded', funded_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, escrow.id);

        // Project goes live in marketplace only when funded!
        if (project && project.status === 'draft') {
          await transitionProject(db, project.id, 'open');
        }

        console.log(`[Webhook] Escrow ${escrow.id} funded. Project ${project.id} is now open.`);
        break;
      }

      case 'payout.success': {
        const transactionRef = data.transaction_ref || data.reference || `webhook_tx_${Date.now()}`;

        // Idempotency check:
        const existingPayout = await db.get(
          'SELECT id, status FROM payouts WHERE pandascrow_transaction_ref = ?',
          transactionRef
        );

        if (existingPayout && existingPayout.status === 'success') {
          return res.json({ received: true, idempotent: true });
        }

        if (existingPayout) {
          await db.run(`
            UPDATE payouts 
            SET status = 'success', completed_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `, existingPayout.id);
        } else {
          await db.run(`
            INSERT INTO payouts (escrow_id, talent_id, amount_kobo, pandascrow_transaction_ref, status, completed_at)
            VALUES (?, ?, ?, ?, 'success', CURRENT_TIMESTAMP)
          `, [escrow.id, project.assigned_talent_id, escrow.amount_kobo, transactionRef]);
        }

        // Set escrow status to released
        await db.run(`
          UPDATE escrows 
          SET status = 'released', released_at = CURRENT_TIMESTAMP, payout_ref = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [transactionRef, escrow.id]);

        // Transition project to completed
        if (project && project.status !== 'completed') {
          await transitionProject(db, project.id, 'completed');
        }

        // Upgrade talent verified skills
        if (project.assigned_talent_id) {
          await verifyTalentSkills(db, project.assigned_talent_id);

          await createNotification(db, {
            userId: project.assigned_talent_id,
            type: 'payout_released',
            payload: {
              projectId: project.id,
              title: project.title,
              amount_kobo: escrow.amount_kobo,
              transactionRef
            }
          });
        }

        console.log(`[Webhook] Payout successful for project ${project.id}. Talent skills verified.`);
        break;
      }

      case 'escrow.refunded': {
        if (escrow.status !== 'refunded') {
          await db.run(`
            UPDATE escrows 
            SET status = 'refunded', updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `, escrow.id);
          if (project && project.status !== 'cancelled') {
            await transitionProject(db, project.id, 'cancelled');
          }
        }
        break;
      }

      default:
        console.log(`[Webhook] Unhandled Pandascrow event: ${event}`);
    }

    res.json({ received: true, event });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
