const { validatePassword } = require('../../src/utils/PasswordPolicy');

describe('Auth Password Policy Unit Tests', () => {
  test('rejects short passwords (< 8 chars)', () => {
    const res = validatePassword('Short1!');
    expect(res.valid).toBe(false);
    expect(res.message).toContain('at least 8 characters');
  });

  test('rejects passwords without uppercase letters', () => {
    const res = validatePassword('lowercase1!');
    expect(res.valid).toBe(false);
    expect(res.message).toContain('uppercase');
  });

  test('rejects passwords without lowercase letters', () => {
    const res = validatePassword('UPPERCASE1!');
    expect(res.valid).toBe(false);
    expect(res.message).toContain('lowercase');
  });

  test('rejects passwords without numbers', () => {
    const res = validatePassword('NoNumbers!');
    expect(res.valid).toBe(false);
    expect(res.message).toContain('numeric digit');
  });

  test('rejects passwords without special characters', () => {
    const res = validatePassword('NoSpecial123');
    expect(res.valid).toBe(false);
    expect(res.message).toContain('special character');
  });

  test('accepts strong compliant passwords', () => {
    const res = validatePassword('StrongP@ssw0rd');
    expect(res.valid).toBe(true);
  });
});
