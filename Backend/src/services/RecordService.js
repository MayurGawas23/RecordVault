const crypto = require('crypto');
const prisma = require('../config/db');
const storageFactory = require('../storage/StorageFactory');
const { validateFileSignature } = require('../utils/MagicBytesValidator');
const auditService = require('./AuditService');
const logger = require('../config/Logger');

class RecordService {
  /**
   * Helper to generate UUID-based S3/local object keys
   */
  _generateStorageKey(recordId, originalFilename) {
    const sanitized = (originalFilename || 'attachment').replace(/[^a-zA-Z0-9_.-]/g, '_');
    const uuid = crypto.randomUUID();
    return recordId ? `records/${recordId}/${uuid}-${sanitized}` : `uploads/${uuid}-${sanitized}`;
  }

  /**
   * Retrieves paginated, filtered, sorted records at the database level
   */
  async getRecords({ ownerId, targetOwnerId, userRole, page = 1, limit = 10, category, status, search, sortBy = 'created_at', sortOrder = 'desc', includeDeleted = false }) {
    const pageNum = Math.max(1, parseInt(page, 10));
    const take = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * take;

    const where = {};

    // Filter by target owner if explicitly specified, or scope to owner unless Admin
    if (targetOwnerId) {
      where.owner_id = targetOwnerId;
    } else if (userRole !== 'ADMIN') {
      where.owner_id = ownerId;
    }

    // Soft delete status
    if (includeDeleted === 'true' || includeDeleted === true) {
      where.is_deleted = true;
    } else {
      where.is_deleted = false;
    }

    if (category) {
      where.category = { equals: category, mode: 'insensitive' };
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Sorting
    const validSortFields = ['created_at', 'updated_at', 'title', 'category', 'status'];
    const orderByField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const orderDirection = sortOrder.toLowerCase() === 'asc' ? 'asc' : 'desc';

    const [total, records] = await Promise.all([
      prisma.record.count({ where }),
      prisma.record.findMany({
        where,
        skip,
        take,
        orderBy: { [orderByField]: orderDirection },
        include: {
          owner: { select: { id: true, name: true, email: true } },
          attachments: { select: { id: true, file_name: true, file_size: true, mime_type: true, uploaded_at: true, storage_path: true } }
        }
      })
    ]);

    return {
      records,
      pagination: {
        total,
        page: pageNum,
        limit: take,
        totalPages: Math.ceil(total / take)
      }
    };
  }

  /**
   * Get single record by ID with ownership enforcement
   */
  async getRecordById(id, currentUser) {
    const record = await prisma.record.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        attachments: true
      }
    });

    if (!record) {
      throw { statusCode: 404, message: 'Record not found.' };
    }

    this._checkAuthorization(record, currentUser);
    return record;
  }

  /**
   * Validate file signature & size limit BEFORE generating presigned upload URL
   */
  async generatePresignedUploadUrl({ recordId, fileName, fileSize, mimeType, headerChunkBase64, currentUser }) {
    if (recordId) {
      await this.getRecordById(recordId, currentUser);
    }

    const maxSizeBytes = (parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10)) * 1024 * 1024;
    if (fileSize > maxSizeBytes) {
      throw { statusCode: 400, message: `File '${fileName}' exceeds maximum allowed size of ${process.env.MAX_FILE_SIZE_MB || 10}MB.` };
    }

    // Decode header bytes to validate magic byte signature
    let headerBuffer;
    if (headerChunkBase64) {
      headerBuffer = Buffer.from(headerChunkBase64, 'base64');
    } else {
      headerBuffer = Buffer.alloc(0);
    }

    const sigCheck = await validateFileSignature(headerBuffer, fileName);
    if (!sigCheck.valid) {
      throw { statusCode: 400, message: sigCheck.reason || `Invalid or disallowed file signature for '${fileName}'.` };
    }

    const key = this._generateStorageKey(recordId, fileName);
    const storageAdapter = storageFactory.getStorageAdapter();
    const presignedInfo = await storageAdapter.getPresignedUploadUrl(key, sigCheck.mime);

    return {
      key,
      uploadUrl: presignedInfo?.uploadUrl || null,
      proxyUploadNeeded: !presignedInfo?.uploadUrl,
      mimeType: sigCheck.mime
    };
  }

  /**
   * Create a new record with optional file attachments
   */
  async createRecord({ ownerId, title, description, category, status, files = [], preUploadedKeys = [] }) {
    const maxFiles = parseInt(process.env.MAX_FILES_PER_RECORD || '10', 10);
    const maxSizeBytes = (parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10)) * 1024 * 1024;

    const totalAttachments = files.length + preUploadedKeys.length;
    if (totalAttachments > maxFiles) {
      throw { statusCode: 400, message: `Maximum ${maxFiles} attachments allowed per record.` };
    }

    const processedAttachments = [];
    const storageAdapter = storageFactory.getStorageAdapter();

    // Process direct proxy buffer files (local mode / fallback)
    for (const file of files) {
      if (file.size > maxSizeBytes) {
        throw { statusCode: 400, message: `File '${file.originalname}' exceeds maximum allowed size of ${process.env.MAX_FILE_SIZE_MB || 10}MB.` };
      }

      const sigCheck = await validateFileSignature(file.buffer, file.originalname);
      if (!sigCheck.valid) {
        throw { statusCode: 400, message: sigCheck.reason || `Invalid or disallowed file signature for '${file.originalname}'.` };
      }

      const key = this._generateStorageKey(null, file.originalname);
      await storageAdapter.save(key, file.buffer, sigCheck.mime);

      processedAttachments.push({
        file_name: file.originalname,
        storage_path: key,
        file_size: file.size,
        mime_type: sigCheck.mime
      });
    }

    // Process pre-uploaded S3 keys
    for (const item of preUploadedKeys) {
      processedAttachments.push({
        file_name: item.fileName,
        storage_path: item.key,
        file_size: item.fileSize,
        mime_type: item.mimeType
      });
    }

    const newRecord = await prisma.$transaction(async (tx) => {
      const rec = await tx.record.create({
        data: {
          owner_id: ownerId,
          title,
          description: description || null,
          category: category || null,
          status: status === 'archived' ? 'archived' : 'active',
          attachments: {
            create: processedAttachments
          }
        },
        include: { attachments: true }
      });
      return rec;
    });

    await auditService.log(ownerId, 'record_create', newRecord.id, { title: newRecord.title });
    return newRecord;
  }

  /**
   * Update existing record metadata
   */
  async updateRecord(id, currentUser, { title, description, category, status }) {
    const record = await this.getRecordById(id, currentUser);

    const updated = await prisma.record.update({
      where: { id },
      data: {
        title: title !== undefined ? title : record.title,
        description: description !== undefined ? description : record.description,
        category: category !== undefined ? category : record.category,
        status: status ? (status === 'archived' ? 'archived' : 'active') : record.status
      },
      include: { attachments: true }
    });

    await auditService.log(currentUser.id, 'record_update', id, { title: updated.title });
    return updated;
  }

  /**
   * Soft delete a record
   */
  async softDeleteRecord(id, currentUser) {
    const record = await this.getRecordById(id, currentUser);

    const deleted = await prisma.record.update({
      where: { id },
      data: {
        is_deleted: true,
        deleted_at: new Date()
      }
    });

    await auditService.log(currentUser.id, 'record_delete', id, { title: record.title });
    return { success: true, message: 'Record soft deleted successfully.' };
  }

  /**
   * Restore a soft-deleted record within 30 days
   */
  async restoreRecord(id, currentUser) {
    const record = await prisma.record.findUnique({
      where: { id }
    });

    if (!record) {
      throw { statusCode: 404, message: 'Record not found.' };
    }

    this._checkAuthorization(record, currentUser);

    if (!record.is_deleted) {
      throw { statusCode: 400, message: 'Record is not deleted.' };
    }

    // Verify within 30-day window (30 * 24 * 60 * 60 * 1000 ms)
    if (record.deleted_at) {
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      const elapsed = Date.now() - new Date(record.deleted_at).getTime();
      if (elapsed > thirtyDaysMs) {
        throw { statusCode: 410, message: 'The 30-day recovery window for this record has expired.' };
      }
    }

    const restored = await prisma.record.update({
      where: { id },
      data: {
        is_deleted: false,
        deleted_at: null
      },
      include: { attachments: true }
    });

    await auditService.log(currentUser.id, 'record_restore', id, { title: record.title });
    return restored;
  }

  /**
   * Adds attachments to an existing record
   */
  async addAttachments(recordId, currentUser, files = [], preUploadedKeys = []) {
    const record = await this.getRecordById(recordId, currentUser);

    const existingCount = await prisma.attachment.count({ where: { record_id: recordId } });
    const maxFiles = parseInt(process.env.MAX_FILES_PER_RECORD || '10', 10);
    const maxSizeBytes = (parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10)) * 1024 * 1024;

    const totalNew = files.length + preUploadedKeys.length;
    if (existingCount + totalNew > maxFiles) {
      throw { statusCode: 400, message: `Record would exceed maximum ${maxFiles} allowed attachments.` };
    }

    const storageAdapter = storageFactory.getStorageAdapter();
    const created = [];

    // Proxy buffer files
    for (const file of files) {
      if (file.size > maxSizeBytes) {
        throw { statusCode: 400, message: `File '${file.originalname}' exceeds size limit.` };
      }

      const sigCheck = await validateFileSignature(file.buffer, file.originalname);
      if (!sigCheck.valid) {
        throw { statusCode: 400, message: sigCheck.reason || `Invalid signature for '${file.originalname}'.` };
      }

      const key = this._generateStorageKey(recordId, file.originalname);
      await storageAdapter.save(key, file.buffer, sigCheck.mime);

      const att = await prisma.attachment.create({
        data: {
          record_id: recordId,
          file_name: file.originalname,
          storage_path: key,
          file_size: file.size,
          mime_type: sigCheck.mime
        }
      });
      created.push(att);
    }

    // Direct pre-uploaded S3 keys
    for (const item of preUploadedKeys) {
      const att = await prisma.attachment.create({
        data: {
          record_id: recordId,
          file_name: item.fileName,
          storage_path: item.key,
          file_size: item.fileSize,
          mime_type: item.mimeType
        }
      });
      created.push(att);
    }

    return created;
  }

  /**
   * Delete an attachment from a record
   */
  async deleteAttachment(recordId, attachmentId, currentUser) {
    const record = await this.getRecordById(recordId, currentUser);

    const attachment = await prisma.attachment.findFirst({
      where: { id: attachmentId, record_id: recordId }
    });

    if (!attachment) {
      throw { statusCode: 404, message: 'Attachment not found.' };
    }

    const storageAdapter = storageFactory.getStorageAdapter();
    await storageAdapter.delete(attachment.storage_path);
    await prisma.attachment.delete({ where: { id: attachmentId } });

    return { success: true, message: 'Attachment deleted.' };
  }

  /**
   * Get attachment file buffer/path/url for download or preview
   */
  async getAttachmentForDownload(recordId, attachmentId, currentUser, disposition = 'inline') {
    const record = await this.getRecordById(recordId, currentUser);

    const attachment = await prisma.attachment.findFirst({
      where: { id: attachmentId, record_id: recordId }
    });

    if (!attachment) {
      throw { statusCode: 404, message: 'Attachment not found.' };
    }

    const storageAdapter = storageFactory.getStorageAdapter();
    let stream = null;
    let filePath = null;
    let url = null;

    if (typeof storageAdapter.getStream === 'function') {
      try {
        stream = await storageAdapter.getStream(attachment.storage_path);
      } catch (err) {
        logger.warn({ err: err.message, key: attachment.storage_path }, 'Storage getStream failed, falling back to getUrl');
      }
    }

    if (!stream) {
      const locationInfo = await storageAdapter.getUrl(attachment.storage_path, {
        disposition,
        fileName: attachment.file_name,
        contentType: attachment.mime_type,
        expiresIn: 300
      });
      filePath = locationInfo.filePath || null;
      url = locationInfo.url || null;
    }

    return {
      stream,
      filePath,
      url,
      fileName: attachment.file_name,
      mimeType: attachment.mime_type,
      fileSize: attachment.file_size
    };
  }

  /**
   * Server-side ownership / admin guard
   */
  _checkAuthorization(record, currentUser) {
    if (currentUser.role === 'ADMIN') return;
    if (record.owner_id !== currentUser.id) {
      throw { statusCode: 403, message: 'Forbidden: You do not have access to this record.' };
    }
  }
}

module.exports = new RecordService();
