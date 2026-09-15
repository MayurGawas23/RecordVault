require('dotenv').config();
const app = require('./app');
const prisma = require('./config/db');
const logger = require('./config/Logger');

const PORT = process.env.PORT || 5000;

process.on('unhandledRejection', (reason, promise) => {
  logger.error({ err: reason }, 'Unhandled Promise Rejection in Backend Server');
});

process.on('uncaughtException', (err) => {
  logger.error({ err }, 'Uncaught Exception in Backend Server');
});

app.listen(PORT, async () => {
  logger.info(`RecordVault Backend running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);

  // Test database connection on startup
  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.info('Database connection verified successfully (PostgreSQL).');
  } catch (err) {
    logger.error({ err }, 'DATABASE CONNECTION FAILED: Unable to reach PostgreSQL database.');
  }
});
