const express = require('express');
const router = express.Router();
const multer = require('multer');
const authenticateJWT = require('../middleware/authMiddleware');
const recordController = require('../controllers/recordController');
const attachmentController = require('../controllers/attachmentController');
const { validate, recordSchema } = require('../middleware/validate');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10)) * 1024 * 1024
  }
});

router.use(authenticateJWT);

router.get('/', recordController.getRecords);
router.post('/', upload.array('files', 10), recordController.createRecord);
router.post('/presigned-upload-url', attachmentController.requestPresignedUploadUrl);
router.get('/:id', recordController.getRecordById);
router.put('/:id', validate(recordSchema), recordController.updateRecord);
router.delete('/:id', recordController.deleteRecord);
router.post('/:id/restore', recordController.restoreRecord);

router.post('/:id/attachments/presigned-upload-url', attachmentController.requestPresignedUploadUrl);
router.post('/:id/attachments', upload.array('files', 10), attachmentController.addAttachments);
router.delete('/:id/attachments/:attachmentId', attachmentController.deleteAttachment);
router.get('/:id/attachments/:attachmentId/download', attachmentController.downloadAttachment);
router.get('/:id/attachments/:attachmentId/preview', attachmentController.previewAttachment);

module.exports = router;
