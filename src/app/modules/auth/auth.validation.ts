import { z } from 'zod';

const loginSchema = z.object({
  body: z.object({
    email: z.email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

const refreshSchema = z.object({
  cookies: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z
      .string()
      .min(6, 'Current password must be at least 6 characters'),
    newPassword: z
      .string()
      .min(6, 'New password must be at least 6 characters'),
  }),
});

const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.email('Invalid email address'),
  }),
});

const resetPasswordSchema = z.object({
  query: z.object({
    token: z.string().min(1, 'Reset token is required'),
  }),
  body: z.object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

export const AuthValidation = {
  loginSchema,
  refreshSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
