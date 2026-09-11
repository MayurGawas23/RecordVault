const logger = require('../config/Logger');

function errorHandler(err, req, res, next) {
  logger.error({ err, path: req.path, method: req.method }, 'Unhandled API request error');

  if (err.statusCode) {
    return res.status(err.statusCode).json({
      error: err.message,
      remainingSeconds: err.remainingSeconds,
      lockoutUntil: err.lockoutUntil
    });
  }

  // Multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: `File exceeds maximum allowed upload size limit.` });
  }

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : (err.message || 'An unexpected error occurred.')
  });
}

module.exports = errorHandler;
