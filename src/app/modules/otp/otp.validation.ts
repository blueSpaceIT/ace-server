import z from 'zod';

const sendOtpSchema = z.object({
  body: z.object({
    email: z.email({ message: 'Invalid email address' }),
  }),
});

const verifyOtpSchema = z.object({
  query: z.object({
    email: z.coerce.string(),
  }),
  body: z.object({
    otp: z
      .string()
      .length(6, { message: 'OTP must be exactly 6 digits' })
      .regex(/^\d{6}$/, { message: 'OTP must be numeric' }),
  }),
});

export const otpValidation = {
  sendOtpSchema,
  verifyOtpSchema,
};
