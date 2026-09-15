const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const prisma = require('./config/db');
const logger = require('./config/Logger');
const authRoutes = require('./routes/authRoutes');
const recordRoutes = require('./routes/recordRoutes');
const adminRoutes = require('./routes/adminRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || true,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Enhanced Health check endpoint with real DB connectivity test
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.json({
      status: 'ok',
      database: 'connected',
      service: 'RecordVault API',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    logger.error({ err }, 'Healthcheck DB connection test failed');
    return res.status(500).json({
      status: 'error',
      database: 'disconnected',
      service: 'RecordVault API',
      error: err.message || 'Database connection error',
      timestamp: new Date().toISOString()
    });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/admin', adminRoutes);

// Global Error Handler
app.use(errorHandler);

module.exports = app;
