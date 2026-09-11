const prisma = require('../config/db');
const logger = require('../config/Logger');

class AuditService {
  /**
   * Records an audit log entry in PostgreSQL
   * @param {string|null} userId 
   * @param {'record_create'|'record_update'|'record_delete'|'record_restore'|'password_reset'} action 
   * @param {string|null} targetId 
   * @param {object|null} metadata 
   */
  async log(userId, action, targetId = null, metadata = null) {
    try {
      const entry = await prisma.auditLog.create({
        data: {
          user_id: userId,
          action,
          target_id: targetId,
          metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined
        }
      });
      logger.info({ auditId: entry.id, action, userId, targetId }, 'Audit log entry recorded');
      return entry;
    } catch (err) {
      logger.error({ err, action, userId, targetId }, 'Failed to record audit log');
      // Do not crash main process on non-critical audit log failure
    }
  }
}

module.exports = new AuditService();
