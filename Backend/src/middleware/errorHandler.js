const logger = require('../config/Logger');

function errorHandler(err, req, res, next) {
  // Always log full error details (stack trace, message, route context) to Backend logs / Render terminal
  logger.error({
    err: {
      name: err.name,
      message: err.message,
      stack: err.stack,
      code: err.code
    },
    path: req.path,
    method: req.method,
    userId: req.user?.id || null,
    ip: req.ip
  }, `API Error [${req.method} ${req.path}]: ${err.message || 'Unhandled server error'}`);

  if (err.statusCode) {
    return res.status(err.statusCode).json({
      error: err.message,
      remainingSeconds: err.remainingSeconds,
      lockoutUntil: err.lockoutUntil
    });
  }

  // Multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File exceeds maximum allowed upload size limit.' });
  }

  // Database constraint errors
  if (err.code && typeof err.code === 'string' && err.code.startsWith('P')) {
    return res.status(400).json({ error: 'A database constraint violation occurred.' });
  }

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;

  // Return clean, user-friendly message to Frontend (never leak raw stack traces to client)
  res.status(statusCode).json({
    error: err.message && statusCode < 500 ? err.message : 'An unexpected error occurred. Please try again later.'
  });
}

module.exports = errorHandler;
