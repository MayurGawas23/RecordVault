/**
 * Enforces server-side password complexity requirements.
 * Requirements:
 * - 8+ characters
 * - Uppercase letter [A-Z]
 * - Lowercase letter [a-z]
 * - Number [0-9]
 * - Special character [!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]
 */
function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'Password is required.' };
  }
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter.' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter.' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one numeric digit.' };
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character.' };
  }

  return { valid: true };
}

module.exports = { validatePassword };
