/**
 * services/notifications.js
 * 
 * Creates in-app notifications for users.
 */

async function createNotification(db, { userId, type, payload }) {
  const payloadJson = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const result = await db.run(
    `INSERT INTO notifications (user_id, type, payload_json) VALUES (?, ?, ?)`,
    [userId, type, payloadJson]
  );
  return result.lastID;
}

module.exports = {
  createNotification
};
