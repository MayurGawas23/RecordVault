require('dotenv').config();
const app = require('./app');
const logger = require('./config/Logger');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info(`RecordVault Backend running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
