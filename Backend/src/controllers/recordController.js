const recordService = require('../services/RecordService');

class RecordController {
  async getRecords(req, res, next) {
    try {
      const { page, limit, category, status, search, sortBy, sortOrder, includeDeleted, targetOwnerId } = req.query;
      const result = await recordService.getRecords({
        ownerId: req.user.id,
        targetOwnerId,
        userRole: req.user.role,
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

  async getRecordById(req, res, next) {
    try {
      const record = await recordService.getRecordById(req.params.id, req.user);
      res.json(record);
    } catch (err) {
      next(err);
    }
  }

  async createRecord(req, res, next) {
    try {
      const { title, description, category, status, preUploadedKeys } = req.body;
      const files = req.files || [];

      let parsedPreUploaded = [];
      if (preUploadedKeys) {
        parsedPreUploaded = typeof preUploadedKeys === 'string' ? JSON.parse(preUploadedKeys) : preUploadedKeys;
      }

      const record = await recordService.createRecord({
        ownerId: req.user.id,
        title,
        description,
        category,
        status,
        files,
        preUploadedKeys: parsedPreUploaded
      });
      res.status(201).json(record);
    } catch (err) {
      next(err);
    }
  }

  async updateRecord(req, res, next) {
    try {
      const { title, description, category, status } = req.body;
      const updated = await recordService.updateRecord(req.params.id, req.user, {
        title,
        description,
        category,
        status
      });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }

  async deleteRecord(req, res, next) {
    try {
      const result = await recordService.softDeleteRecord(req.params.id, req.user);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async restoreRecord(req, res, next) {
    try {
      const restored = await recordService.restoreRecord(req.params.id, req.user);
      res.json(restored);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new RecordController();
