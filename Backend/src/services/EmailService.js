require('dotenv').config({ override: true });
const nodemailer = require('nodemailer');
const logger = require('../config/Logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this._initTransporter();
  }

  _extractEmailAddress(str) {
    if (!str) return 'mayur.gawas4work@gmail.com';
    const match = str.match(/<([^>]+)>/);
    if (match) return match[1].trim();
    return str.trim();
  }

  _initTransporter() {
    require('dotenv').config({ override: true });
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER ? process.env.SMTP_USER.trim() : null;
    const pass = process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, '') : null;

    if (user && pass && user !== 'test@ethereal.email') {
      const isGmail = host.toLowerCase().includes('gmail') || user.toLowerCase().endsWith('@gmail.com');
      
      // On cloud hosts like Render where port 587 outbound TCP sockets are blocked,
      // keep connection timeouts short (3s) so the API response returns immediately.
      const timeoutMs = process.env.RENDER || process.env.NODE_ENV === 'production' ? 3000 : 10000;

      const transportConfig = {
        host: isGmail ? 'smtp.gmail.com' : host,
        port: port || 587,
        secure: port === 465,
        requireTLS: true,
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
        connectionTimeout: timeoutMs,
        greetingTimeout: timeoutMs,
        socketTimeout: timeoutMs
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
   * Send via Brevo (Sendinblue) HTTPS REST API (Port 443)
   */
  async _sendViaBrevoApi(to, subject, text, html) {
    const rawKey = process.env.BREVO_API_KEY ? process.env.BREVO_API_KEY.trim() : null;
    if (!rawKey) return null;

    const apiKey = rawKey.replace(/^["']|["']$/g, '').trim();
    const rawSender = process.env.SMTP_USER || process.env.SMTP_FROM || 'mayur.gawas4work@gmail.com';
    const senderEmail = this._extractEmailAddress(rawSender);

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
          console.log('\n⚠️ BREVO 401 UNAUTHORIZED: Ensure BREVO_API_KEY is an API v3 key starting with "xkeysib-" generated at https://app.brevo.com/settings/keys/api and Authorized IP list is left empty.\n');
        }
      }
    } catch (err) {
      logger.error({ err: err.message }, 'Failed to connect to Brevo HTTPS API');
    }
    return null;
  }

  /**
   * Send via Brevo SMTP Relay Port 2525 (Port 2525 is unblocked on Render)
   */
  async _sendViaBrevoSmtp(to, subject, text, html) {
    const brevoPass = (process.env.BREVO_SMTP_PASS || process.env.BREVO_API_KEY || '').replace(/["'\s]/g, '');
    const brevoUser = (process.env.BREVO_SMTP_USER || process.env.SMTP_USER || '').trim();

    if (!brevoPass || !brevoUser) return null;

    try {
      const transporter = nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: 2525,
        secure: false,
        auth: {
          user: brevoUser,
          pass: brevoPass
        },
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 5000
      });

      const info = await transporter.sendMail({
        from: `RecordVault Security <${brevoUser}>`,
        to,
        subject,
        text,
        html
      });

      logger.info({ to, subject, messageId: info.messageId }, 'Real email delivered successfully via Brevo SMTP Port 2525');
      console.log(`✅ REAL EMAIL DELIVERED via Brevo SMTP Port 2525 to ${to} (Message ID: ${info.messageId})\n`);
      return info;
    } catch (err) {
      logger.warn({ err: err.message, to }, 'Brevo SMTP Port 2525 attempt failed');
    }
    return null;
  }

  /**
   * Send via Mailtrap Sending HTTPS REST API (Port 443)
   */
  async _sendViaMailtrapApi(to, subject, text, html) {
    const rawKey = process.env.MAILTRAP_TOKEN ? process.env.MAILTRAP_TOKEN.trim() : null;
    if (!rawKey) return null;

    const apiKey = rawKey.replace(/^["']|["']$/g, '').trim();
    const fromAddress = process.env.MAILTRAP_FROM || 'hello@demomailtrap.com';

    try {
      const res = await fetch('https://send.api.mailtrap.io/api/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: { email: fromAddress, name: 'RecordVault Security' },
          to: [{ email: to }],
          subject: subject,
          text: text,
          html: html
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        logger.info({ to, subject, messageIds: data.message_ids }, 'Real email delivered successfully via Mailtrap HTTPS API');
        console.log(`✅ REAL EMAIL DELIVERED via Mailtrap HTTPS API to ${to}\n`);
        return { success: true, messageIds: data.message_ids, viaMailtrap: true };
      } else {
        logger.warn({ data, status: res.status }, 'Mailtrap HTTPS API returned error response');
      }
    } catch (err) {
      logger.error({ err: err.message }, 'Failed to connect to Mailtrap HTTPS API');
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
    const senderEmail = this._extractEmailAddress(process.env.SMTP_USER || 'mayur.gawas4work@gmail.com');

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
   * Send an email with HTTPS APIs primary, Brevo Port 2525, SMTP fallback, and Terminal log
   */
  async sendEmailWithRetry(to, subject, text, html, retries = 1) {
    // 1. ALWAYS log to terminal output
    this._logToTerminal(to, subject, text);

    // 2. Try Brevo HTTPS API (Port 443)
    const brevoApiResult = await this._sendViaBrevoApi(to, subject, text, html);
    if (brevoApiResult) {
      return brevoApiResult;
    }

    // 3. Try Brevo SMTP Relay Port 2525 (Unblocked on Render)
    const brevoSmtpResult = await this._sendViaBrevoSmtp(to, subject, text, html);
    if (brevoSmtpResult) {
      return brevoSmtpResult;
    }

    // 4. Try Mailtrap HTTPS API (Port 443)
    const mailtrapResult = await this._sendViaMailtrapApi(to, subject, text, html);
    if (mailtrapResult) {
      return mailtrapResult;
    }

    // 5. Try SendGrid HTTPS API (Port 443)
    const sendgridResult = await this._sendViaSendGridApi(to, subject, text, html);
    if (sendgridResult) {
      return sendgridResult;
    }

    // 6. Try Resend HTTPS API (Port 443)
    const resendResult = await this._sendViaResendApi(to, subject, text, html);
    if (resendResult) {
      return resendResult;
    }

    // 7. Fallback to standard SMTP (keep timeout fast on cloud)
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
        logger.warn({ attempt, retries, err: err.message, to }, 'Real SMTP delivery attempt failed');
        if (attempt < retries) {
          await new Promise(res => setTimeout(res, 500));
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
