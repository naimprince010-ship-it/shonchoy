const prisma = require('./prisma');

async function logActivity(userId, userName, action, entityType, entityId, details = null) {
  try {
    await prisma.auditLog.create({
      data: {
        user_id: userId,
        user_name: userName,
        action,
        entity_type: entityType,
        entity_id: entityId,
        details: details ? (typeof details === 'object' ? details : { message: details }) : null
      }
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
    // Suppress error so main transaction doesn't fail
  }
}

module.exports = { logActivity };
