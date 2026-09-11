const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long.'),
  email: z.string().email('Invalid email address format.'),
  password: z.string().min(8, 'Password must be at least 8 characters long.')
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address format.'),
  password: z.string().min(1, 'Password is required.')
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address format.')
});

const verifyOtpSchema = z.object({
  email: z.string().email('Invalid email address format.'),
  otp: z.string().length(6, 'OTP code must be exactly 6 digits.').regex(/^\d+$/, 'OTP must be numeric.')
});

const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address format.'),
  otp: z.string().length(6, 'OTP code must be exactly 6 digits.').regex(/^\d+$/, 'OTP must be numeric.'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters long.')
});

const recordSchema = z.object({
  title: z.string().min(1, 'Title is required.').max(200, 'Title exceeds 200 characters.'),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  status: z.enum(['active', 'archived']).optional().default('active')
});

function validate(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        const issues = err.errors.map(e => e.message).join(', ');
        return res.status(400).json({ error: issues, details: err.errors });
      }
      next(err);
    }
  };
}

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema,
  recordSchema
};
