const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const emailService = require('./EmailService');
const logger = require('../config/Logger');

class OtpService {
  /**
   * Generates a 6-digit numeric cryptographically random OTP string.
   */
  generateNumericOtp() {
    const buffer = crypto.randomBytes(4);
    const num = buffer.readUInt32BE(0) % 1000000;
    return num.toString().padStart(6, '0');
  }

  /**
   * Handles forgot password request for an email address.
   * Constant timing & generic response to prevent user enumeration.
   */
  async requestPasswordReset(email) {
    const startTime = Date.now();
    
    // Find user
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    
    if (user) {
      // Check 15 minute generation window (max 3 generation requests per 15 min per user)
      const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
      const recentOtpsCount = await prisma.passwordResetOtp.count({
        where: {
          user_id: user.id,
          created_at: { gte: fifteenMinsAgo }
        }
      });

      const maxResends = parseInt(process.env.OTP_RESEND_MAX || '10', 10);
      if (recentOtpsCount >= maxResends) {
        logger.warn({ userId: user.id }, 'OTP resend rate limit exceeded for user');
        console.log(`\n⚠️ OTP RESEND RATE LIMIT EXCEEDED FOR [${user.email}]: Max ${maxResends} OTP requests per 15 minutes.\n`);
        await this._balanceTiming(startTime);
        return { success: true, message: `OTP resend rate limit reached (${maxResends} max per 15 mins). Please wait a few minutes before requesting another code.` };
      }

      // Invalidate all prior unused OTPs for this user
      await prisma.passwordResetOtp.updateMany({
        where: { user_id: user.id, is_used: false },
        data: { is_used: true }
      });

      // Generate 6-digit OTP
      const plainOtp = this.generateNumericOtp();
      const otpHash = await bcrypt.hash(plainOtp, 10);
      
      const ttlMinutes = parseInt(process.env.OTP_TTL_MINUTES || '10', 10);
      const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

      await prisma.passwordResetOtp.create({
        data: {
          user_id: user.id,
          otp_hash: otpHash,
          expires_at: expiresAt,
          attempts: 0,
          is_used: false
        }
      });

      // Send OTP email asynchronously / await without leaking errors
      await emailService.sendOtpEmail(user.email, plainOtp);
    } else {
      // Dummy work to simulate bcrypt + email delay so response timing is identical
      await bcrypt.hash('dummy_otp_string_123456', 10);
    }

    await this._balanceTiming(startTime, 300);
    return { success: true, message: 'If an account with that email exists, password reset instructions have been sent.' };
  }

  /**
   * Helper to equalize response timing to avoid user timing enumeration
   */
  async _balanceTiming(startTime, minDurationMs = 250) {
    const elapsed = Date.now() - startTime;
    if (elapsed < minDurationMs) {
      await new Promise(r => setTimeout(r, minDurationMs - elapsed));
    }
  }

  /**
   * Verifies an OTP code for a given email address
   */
  async verifyOtp(email, otp) {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      return { valid: false, message: 'Invalid or expired OTP code.' };
    }

    // Find the latest active, non-expired OTP record
    const otpRecord = await prisma.passwordResetOtp.findFirst({
      where: {
        user_id: user.id,
        is_used: false,
        expires_at: { gt: new Date() }
      },
      orderBy: { created_at: 'desc' }
    });

    if (!otpRecord) {
      return { valid: false, message: 'Invalid or expired OTP code.' };
    }

    const maxAttempts = parseInt(process.env.OTP_MAX_ATTEMPTS || '5', 10);
    if (otpRecord.attempts >= maxAttempts) {
      // Invalidate OTP on attempt limit reached
      await prisma.passwordResetOtp.update({
        where: { id: otpRecord.id },
        data: { is_used: true }
      });
      return { valid: false, message: 'Maximum verification attempts exceeded. Please request a new OTP code.' };
    }

    const isMatch = await bcrypt.compare(otp, otpRecord.otp_hash);
    if (!isMatch) {
      await prisma.passwordResetOtp.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } }
      });
      return { valid: false, message: 'Invalid OTP code.' };
    }

    return { valid: true, userId: user.id, otpRecordId: otpRecord.id };
  }
}

module.exports = new OtpService();
