const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const { validatePassword } = require('../utils/PasswordPolicy');
const otpService = require('./OtpService');
const emailService = require('./EmailService');
const auditService = require('./AuditService');
const logger = require('../config/Logger');

const JWT_SECRET = process.env.JWT_SECRET || 'default_jwt_secret_key_32chars_long!';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'default_jwt_refresh_secret_key_32chars_long!';
const ACCESS_TTL = process.env.JWT_ACCESS_TTL || '15m';
const REFRESH_TTL = process.env.JWT_REFRESH_TTL || '7d';

class AuthService {
  /**
   * Registers a new user account
   */
  async register(name, email, password, role = 'USER') {
    const formattedEmail = email.toLowerCase().trim();
    
    // Server-side password policy enforcement
    const passCheck = validatePassword(password);
    if (!passCheck.valid) {
      throw { statusCode: 400, message: passCheck.message };
    }

    // Check email uniqueness
    const existing = await prisma.user.findUnique({ where: { email: formattedEmail } });
    if (existing) {
      throw { statusCode: 409, message: 'An account with this email address already exists.' };
    }

    const password_hash = await bcrypt.hash(password, 10);

    const normalizedRole = typeof role === 'string' && role.trim().toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER';

    const user = await prisma.user.create({
      data: {
        name,
        email: formattedEmail,
        password_hash,
        role: normalizedRole
      }
    });

    const tokens = this.generateTokenPair(user);
    return {
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      ...tokens
    };
  }

  /**
   * Log in existing user with account lockout throttling
   */
  async login(email, password) {
    const formattedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: formattedEmail } });

    if (!user) {
      // Run dummy bcrypt compare to equalize timing
      await bcrypt.compare(password, '$2b$10$dummyhashfordummyuserpreventingtimingattack12');
      throw { statusCode: 401, message: 'Invalid email or password.' };
    }

    // Check account lockout
    if (user.lockout_until && user.lockout_until > new Date()) {
      const remainingSecs = Math.ceil((user.lockout_until.getTime() - Date.now()) / 1000);
      throw {
        statusCode: 423,
        message: `Account locked due to 5 consecutive failed login attempts.`,
        remainingSeconds: remainingSecs,
        lockoutUntil: user.lockout_until.toISOString()
      };
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      const newAttempts = user.failed_login_attempts + 1;
      let lockoutUntil = null;

      if (newAttempts >= 5) {
        // Lock out account for 15 minutes after 5 consecutive failures
        lockoutUntil = new Date(Date.now() + 15 * 60 * 1000);
        logger.warn({ userId: user.id, email: user.email }, 'Account locked out after 5 failed login attempts');
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failed_login_attempts: newAttempts,
          lockout_until: lockoutUntil
        }
      });

      if (newAttempts >= 5) {
        throw {
          statusCode: 423,
          message: `Account locked due to 5 consecutive failed login attempts.`,
          remainingSeconds: 15 * 60,
          lockoutUntil: lockoutUntil.toISOString()
        };
      }

      throw { statusCode: 401, message: 'Invalid email or password.' };
    }

    // Login successful: reset lockout & failed attempt counters
    if (user.failed_login_attempts > 0 || user.lockout_until !== null) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failed_login_attempts: 0,
          lockout_until: null
        }
      });
    }

    const tokens = this.generateTokenPair(user);
    return {
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      ...tokens
    };
  }

  /**
   * Refresh JWT access token
   */
  async refreshToken(refreshToken) {
    if (!refreshToken) {
      throw { statusCode: 401, message: 'Refresh token required.' };
    }

    try {
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
      if (!user) {
        throw { statusCode: 401, message: 'Invalid token subject.' };
      }

      const tokens = this.generateTokenPair(user);
      return {
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        ...tokens
      };
    } catch (err) {
      throw { statusCode: 401, message: 'Invalid or expired refresh token.' };
    }
  }

  /**
   * Resets user password after verifying OTP
   */
  async resetPassword(email, otp, newPassword) {
    const formattedEmail = email.toLowerCase().trim();
    
    // Server-side password policy enforcement
    const passCheck = validatePassword(newPassword);
    if (!passCheck.valid) {
      throw { statusCode: 400, message: passCheck.message };
    }

    const verifyResult = await otpService.verifyOtp(formattedEmail, otp);
    if (!verifyResult.valid) {
      throw { statusCode: 400, message: verifyResult.message };
    }

    const newHash = await bcrypt.hash(newPassword, 10);

    // Update user password and clear any lockouts
    await prisma.user.update({
      where: { id: verifyResult.userId },
      data: {
        password_hash: newHash,
        failed_login_attempts: 0,
        lockout_until: null
      }
    });

    // Mark OTP as used (single-use)
    await prisma.passwordResetOtp.update({
      where: { id: verifyResult.otpRecordId },
      data: { is_used: true }
    });

    // Write audit log
    await auditService.log(verifyResult.userId, 'password_reset', verifyResult.userId, { email: formattedEmail });

    // Send confirmation email
    await emailService.sendPasswordChangedEmail(formattedEmail);

    return { success: true, message: 'Password has been reset successfully. Please log in with your new password.' };
  }

  /**
   * Generates Access Token and Refresh Token pair
   */
  generateTokenPair(user) {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TTL });
    const refreshToken = jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TTL });

    return { accessToken, refreshToken };
  }
}

module.exports = new AuthService();
