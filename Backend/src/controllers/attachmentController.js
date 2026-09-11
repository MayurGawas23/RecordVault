const recordService = require('../services/RecordService');

class AttachmentController {
  async requestPresignedUploadUrl(req, res, next) {
    try {
      const { fileName, fileSize, mimeType, headerChunkBase64 } = req.body;
      if (!fileName || !fileSize) {
        return res.status(400).json({ error: 'fileName and fileSize are required.' });
      }

      const result = await recordService.generatePresignedUploadUrl({
        recordId: req.params.id || null,
        fileName,
        fileSize,
        mimeType,
        headerChunkBase64,
        currentUser: req.user
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async addAttachments(req, res, next) {
    try {
      const files = req.files || [];
      const { preUploadedKeys } = req.body || {};

      let parsedPreUploaded = [];
      if (preUploadedKeys) {
        parsedPreUploaded = typeof preUploadedKeys === 'string' ? JSON.parse(preUploadedKeys) : preUploadedKeys;
      }

      if (!files.length && !parsedPreUploaded.length) {
        return res.status(400).json({ error: 'No attachment files or pre-uploaded keys provided.' });
      }

      const attachments = await recordService.addAttachments(
        req.params.id,
        req.user,
        files,
        parsedPreUploaded
      );

      res.status(201).json(attachments);
    } catch (err) {
      next(err);
    }
  }

  async deleteAttachment(req, res, next) {
    try {
      const { id: recordId, attachmentId } = req.params;
      const result = await recordService.deleteAttachment(recordId, attachmentId, req.user);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async downloadAttachment(req, res, next) {
    try {
      const { id: recordId, attachmentId } = req.params;
      const fileInfo = await recordService.getAttachmentForDownload(
        recordId,
        attachmentId,
        req.user,
        'attachment'
      );

      if (fileInfo.url) {
        return res.redirect(302, fileInfo.url);
      }

      res.setHeader('Content-Type', fileInfo.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileInfo.fileName)}"`);
      res.sendFile(fileInfo.filePath);
    } catch (err) {
      next(err);
    }
  }

  async previewAttachment(req, res, next) {
    try {
      const { id: recordId, attachmentId } = req.params;
      const fileInfo = await recordService.getAttachmentForDownload(
        recordId,
        attachmentId,
        req.user,
        'inline'
      );

      if (fileInfo.url) {
        return res.redirect(302, fileInfo.url);
      }

      res.setHeader('Content-Type', fileInfo.mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileInfo.fileName)}"`);
      res.sendFile(fileInfo.filePath);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AttachmentController();
