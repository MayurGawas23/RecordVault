require('dotenv').config({ override: true });
const nodemailer = require('nodemailer');
const logger = require('../config/Logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this._initTransporter();
  }

  _initTransporter() {
    require('dotenv').config({ override: true });
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER ? process.env.SMTP_USER.trim() : null;
    const pass = process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, '') : null;

    if (user && pass && user !== 'test@ethereal.email') {
      const isGmail = host.toLowerCase().includes('gmail') || user.toLowerCase().endsWith('@gmail.com');
      const transportConfig = {
        host: isGmail ? 'smtp.gmail.com' : host,
        port: port || 587,
        secure: port === 465,
        requireTLS: true,
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000
      };

      this.transporter = nodemailer.createTransport(transportConfig);
      logger.info({ host: transportConfig.host, port: transportConfig.port, user }, 'SMTP transporter configured');
    } else {
      this.transporter = null;
    }
  }

  /**
   * Log email details to terminal
   */
  _logToTerminal(to, subject, text) {
    console.log('\n================================================================================');
    console.log('📧 RECORDVAULT DISPATCHED EMAIL (TERMINAL LOG)');
    console.log(`TO: ${to}`);
    console.log(`SUBJECT: ${subject}`);
    console.log(`TIMESTAMP: ${new Date().toISOString()}`);
    console.log('--------------------------------------------------------------------------------');
    console.log(text);
    console.log('================================================================================\n');
  }

  /**
   * Send via Brevo (Sendinblue) HTTPS REST API (Port 443 - Sends to ANY email address)
   */
  async _sendViaBrevoApi(to, subject, text, html) {
    const rawKey = process.env.BREVO_API_KEY ? process.env.BREVO_API_KEY.trim() : null;
    if (!rawKey) return null;

    const apiKey = rawKey.replace(/^["']|["']$/g, '').trim();
    const senderEmail = process.env.SMTP_USER || 'mayur.gawas4work@gmail.com';

    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': apiKey,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'RecordVault Security', email: senderEmail },
          to: [{ email: to }],
          subject: subject,
          textContent: text,
          htmlContent: html
        })
      });

      const data = await res.json();
      if (res.ok) {
        logger.info({ to, subject, messageId: data.messageId }, 'Real email delivered successfully via Brevo HTTPS API');
        console.log(`✅ REAL EMAIL DELIVERED via Brevo HTTPS API to ${to} (Message ID: ${data.messageId})\n`);
        return { success: true, messageId: data.messageId, viaBrevo: true };
      } else {
        logger.warn({ data, status: res.status }, 'Brevo HTTPS API returned error response');
        if (res.status === 401) {
          console.log('\n⚠️ BREVO 401 UNAUTHORIZED: Ensure BREVO_API_KEY is an API v3 key starting with "xkeysib-" generated at https://app.brevo.com/settings/keys/api\n');
        }
      }
    } catch (err) {
      logger.error({ err: err.message }, 'Failed to connect to Brevo HTTPS API');
    }
    return null;
  }

  /**
   * Send via SendGrid HTTPS REST API (Port 443)
   */
  async _sendViaSendGridApi(to, subject, text, html) {
    const rawKey = process.env.SENDGRID_API_KEY ? process.env.SENDGRID_API_KEY.trim() : null;
    if (!rawKey) return null;

    const apiKey = rawKey.replace(/^["']|["']$/g, '').trim();
    const senderEmail = process.env.SMTP_USER || 'mayur.gawas4work@gmail.com';

    try {
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: senderEmail, name: 'RecordVault Security' },
          subject: subject,
          content: [
            { type: 'text/plain', value: text },
            { type: 'text/html', value: html }
          ]
        })
      });

      if (res.status === 202 || res.ok) {
        logger.info({ to, subject }, 'Real email delivered successfully via SendGrid HTTPS API');
        console.log(`✅ REAL EMAIL DELIVERED via SendGrid HTTPS API to ${to}\n`);
        return { success: true, viaSendGrid: true };
      } else {
        const data = await res.json().catch(() => ({}));
        logger.warn({ data, status: res.status }, 'SendGrid HTTPS API returned error response');
      }
    } catch (err) {
      logger.error({ err: err.message }, 'Failed to connect to SendGrid HTTPS API');
    }
    return null;
  }

  /**
   * Send via Resend HTTPS REST API (Port 443)
   */
  async _sendViaResendApi(to, subject, text, html) {
    const rawKey = process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.trim() : null;
    if (!rawKey) return null;

    const apiKey = rawKey.replace(/^["']|["']$/g, '').trim();
    const fromAddress = process.env.RESEND_FROM || process.env.SMTP_FROM || 'RecordVault <onboarding@resend.dev>';

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [to],
          subject: subject,
          text: text,
          html: html
        })
      });

      const data = await res.json();
      if (res.ok) {
        logger.info({ to, subject, id: data.id }, 'Real email delivered successfully via Resend HTTPS API');
        console.log(`✅ REAL EMAIL DELIVERED via Resend HTTPS API to ${to} (Message ID: ${data.id})\n`);
        return { success: true, messageId: data.id, viaResend: true };
      } else {
        logger.warn({ data, status: res.status }, 'Resend HTTPS API returned error response');
      }
    } catch (err) {
      logger.error({ err: err.message }, 'Failed to connect to Resend HTTPS API');
    }
    return null;
  }

  /**
   * Send an email with HTTPS API primary, SMTP fallback, and Terminal log
   */
  async sendEmailWithRetry(to, subject, text, html, retries = 2) {
    // 1. ALWAYS log to terminal output
    this._logToTerminal(to, subject, text);

    // 2. Try Brevo HTTPS API (Sends to ANY email address over Port 443)
    const brevoResult = await this._sendViaBrevoApi(to, subject, text, html);
    if (brevoResult) {
      return brevoResult;
    }

    // 3. Try SendGrid HTTPS API (Port 443)
    const sendgridResult = await this._sendViaSendGridApi(to, subject, text, html);
    if (sendgridResult) {
      return sendgridResult;
    }

    // 4. Try Resend HTTPS API (Port 443)
    const resendResult = await this._sendViaResendApi(to, subject, text, html);
    if (resendResult) {
      return resendResult;
    }

    // 5. Fallback to SMTP
    this._initTransporter();

    if (!this.transporter) {
      logger.info({ to, subject }, 'Sent email to Terminal log (No HTTP API/SMTP credentials configured)');
      return { success: true, deliveredToTerminal: true };
    }

    const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || '"RecordVault" <noreply@recordvault.internal>';

    let attempt = 0;
    let lastError = null;

    while (attempt < retries) {
      try {
        attempt++;
        const info = await this.transporter.sendMail({
          from: fromAddress,
          to,
          subject,
          text,
          html
        });

        logger.info({ to, subject, messageId: info.messageId }, 'Real email delivered successfully via SMTP');
        console.log(`✅ REAL EMAIL DELIVERED via SMTP to ${to} (Message ID: ${info.messageId})\n`);
        return info;
      } catch (err) {
        lastError = err;
        logger.warn({ attempt, retries, err: err.message, to }, 'Real SMTP delivery attempt failed, retrying...');
        if (attempt < retries) {
          await new Promise(res => setTimeout(res, 500 * Math.pow(2, attempt - 1)));
        }
      }
    }

    console.log(`⚠️ Real email delivery to [${to}] failed (${lastError?.message || lastError}). Outputted to Terminal log above.\n`);
    logger.warn({ err: lastError, to, subject }, 'Real email delivery failed. Fallback to terminal log completed.');
    return { success: true, deliveredToTerminal: true, error: lastError?.message };
  }

  /**
   * Sends OTP email for password reset
   */
  async sendOtpEmail(to, otpCode) {
    console.log('\n================================================================================');
    console.log(`🔑 RECORDVAULT SECURITY OTP CODE FOR [${to}]: ${otpCode}`);
    console.log('================================================================================\n');

    const subject = 'RecordVault Security - Password Recovery OTP Code';
    const text = `Your password recovery verification code is: ${otpCode}. It will expire in 10 minutes. If you did not request this code, please ignore this email.`;
    const html = `
      <div style="font-family: 'Public Sans', sans-serif; max-width: 500px; margin: 0 auto; background: #f6f4ef; padding: 24px; border: 1px solid #dad5c8;">
        <h2 style="font-family: 'Newsreader', serif; color: #1e2a33; margin-top: 0;">RecordVault Security Notice</h2>
        <p style="color: #414846; font-size: 14px;">Password Recovery Request</p>
        <div style="background: #fdfcf9; border: 1.5px solid #3e5c55; padding: 16px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #3e5c55;">${otpCode}</span>
        </div>
        <p style="color: #717976; font-size: 12px;">This code will expire in 10 minutes. Never share this verification code with anyone.</p>
      </div>
    `;
    return this.sendEmailWithRetry(to, subject, text, html);
  }

  /**
   * Sends confirmation email when password was reset successfully
   */
  async sendPasswordChangedEmail(to) {
    const subject = 'RecordVault Security Notice - Password Changed Successfully';
    const text = `Notice: Your RecordVault account password was successfully updated. If you did not initiate this change, please contact system administration immediately.`;
    const html = `
      <div style="font-family: 'Public Sans', sans-serif; max-width: 500px; margin: 0 auto; background: #f6f4ef; padding: 24px; border: 1px solid #dad5c8;">
        <h2 style="font-family: 'Newsreader', serif; color: #1e2a33; margin-top: 0;">RecordVault Security Notice</h2>
        <p style="color: #1b1c19; font-size: 14px;">Your password has been changed successfully.</p>
        <p style="color: #717976; font-size: 12px;">All active login sessions for your account have been invalidated. If you did not initiate this change, please contact system administration immediately.</p>
      </div>
    `;
    return this.sendEmailWithRetry(to, subject, text, html);
  }
}

module.exports = new EmailService();
