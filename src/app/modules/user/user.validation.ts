import { UserStatus } from '@prisma/client';
import { z } from 'zod';

const createUserValidationSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(24, 'Name is too long'),
    phone: z.string().min(1, 'Phone is required').max(16, 'Phone is too long'),
    city: z.string().min(1, 'City is required').max(16, 'City is too long'),
    email: z.email('Invalid email address'),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .max(32, 'Password is too long'),
  }),
});

const updateProfileValidationSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(24, 'Name is too long'),
    phone: z.string().min(1, 'Phone is required').max(16, 'Phone is too long'),
    address: z
      .string()
      .min(1, 'Address is required')
      .max(128, 'Address is too long'),
  }),
});

const updateUserStatusValidationSchema = z.object({
  body: z.object({
    status: z.enum(UserStatus),
  }),
});

export const UserValidation = {
  createUserValidationSchema,
  updateProfileValidationSchema,
  updateUserStatusValidationSchema,
};
