require('dotenv').config();
const app = require('./app');
const logger = require('./config/Logger');

const PORT = process.env.PORT || 5000;

process.on('unhandledRejection', (reason, promise) => {
  logger.error({ err: reason }, 'Unhandled Promise Rejection in Backend Server');
});

process.on('uncaughtException', (err) => {
  logger.error({ err }, 'Uncaught Exception in Backend Server');
});

app.listen(PORT, () => {
  logger.info(`RecordVault Backend running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
