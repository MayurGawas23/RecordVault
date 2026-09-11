const otpService = require('../../src/services/OtpService');

describe('OTP Generation & Verification Unit Tests', () => {
  test('generates valid 6-digit numeric OTP', () => {
    const otp = otpService.generateNumericOtp();
    expect(typeof otp).toBe('string');
    expect(otp).toHaveLength(6);
    expect(/^\d{6}$/.test(otp)).toBe(true);
  });
});
