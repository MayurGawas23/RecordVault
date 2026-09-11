const { PrismaClient } = require('@prisma/client');
const logger = require('./Logger');

const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn' }
  ]
});

prisma.$on('error', (e) => {
  logger.error({ err: e }, 'Prisma error');
});

module.exports = prisma;
