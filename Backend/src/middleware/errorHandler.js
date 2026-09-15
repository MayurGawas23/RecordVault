const logger = require('../config/Logger');

function errorHandler(err, req, res, next) {
  const isCustomError = err && typeof err === 'object' && !err.stack;
  
  // Extract error attributes cleanly whether plain object or Error instance
  const errMessage = err.message || err.error || 'An unexpected error occurred.';
  const errCode = err.code || null;
  const errStatus = err.statusCode || err.status || (res.statusCode !== 200 ? res.statusCode : 500);

  // Log complete error context into Backend logs / Render terminal stdout
  logger.error({
    err: {
      name: err.name || 'APIError',
      message: errMessage,
      stack: err.stack || null,
      code: errCode,
      statusCode: errStatus
    },
    path: req.path,
    method: req.method,
    userId: req.user?.id || null,
    ip: req.ip
  }, `API Error [${req.method} ${req.path}]: ${errMessage}`);

  // Handle custom thrown errors (like { statusCode: 401, message: 'Invalid email or password.' })
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      error: errMessage,
      remainingSeconds: err.remainingSeconds,
      lockoutUntil: err.lockoutUntil
    });
  }

  // Multer file size errors
  if (errCode === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File exceeds maximum allowed upload size limit.' });
  }

  // Prisma Database Connection Error (P1001)
  if (errCode === 'P1001') {
    return res.status(503).json({ error: 'Database server is unreachable. Please verify database connection.' });
  }

  // Prisma Unique Constraint Error (P2002)
  if (errCode === 'P2002') {
    return res.status(409).json({ error: 'A record with this unique value already exists.' });
  }

  // Return operational error message or fallback
  return res.status(errStatus).json({
    error: errMessage
  });
}

module.exports = errorHandler;
