const pino = require('pino');

const redactPaths = [
  'password',
  'password_hash',
  'passwordHash',
  'otp',
  'otp_hash',
  'otpHash',
  'token',
  'access_token',
  'accessToken',
  'refresh_token',
  'refreshToken',
  'authorization',
  'headers.authorization',
  'req.headers.authorization',
  'body.password',
  'body.otp',
  'body.newPassword',
  'body.token'
];

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  redact: {
    paths: redactPaths,
    censor: '[REDACTED]'
  },
  base: { env: process.env.NODE_ENV }
});

module.exports = logger;
