const prisma = require('../config/db');
const recordService = require('../services/RecordService');

class AdminController {
  async getUsers(req, res, next) {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          failed_login_attempts: true,
          lockout_until: true,
          created_at: true,
          _count: {
            select: { records: true }
          }
        },
        orderBy: { created_at: 'desc' }
      });
      res.json(users);
    } catch (err) {
      next(err);
    }
  }

  async updateUserRole(req, res, next) {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      if (!role || typeof role !== 'string' || !role.trim()) {
        return res.status(400).json({ error: 'Role is required.' });
      }

      const normalizedRole = role.trim().toUpperCase();
      if (!['USER', 'ADMIN'].includes(normalizedRole)) {
        return res.status(400).json({ error: 'Invalid role. Allowed roles are only USER and ADMIN.' });
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { role: normalizedRole },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          created_at: true
        }
      });

      res.json(updatedUser);
    } catch (err) {
      next(err);
    }
  }

  async getUserRecords(req, res, next) {
    try {
      const { userId } = req.params;
      const { page, limit, search } = req.query;

      const result = await recordService.getRecords({
        targetOwnerId: userId,
        userRole: 'ADMIN',
        page: page || 1,
        limit: limit || 50,
        search,
        includeDeleted: false
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getAllRecords(req, res, next) {
    try {
      const { page, limit, category, status, search, sortBy, sortOrder, includeDeleted } = req.query;
      const result = await recordService.getRecords({
        ownerId: null,
        userRole: 'ADMIN',
        page,
        limit,
        category,
        status,
        search,
        sortBy,
        sortOrder,
        includeDeleted
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AdminController();
