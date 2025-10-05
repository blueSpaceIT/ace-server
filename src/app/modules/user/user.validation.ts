import { UserStatus } from '@prisma/client';
import { z } from 'zod';

const createStudentValidationSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(24, 'Name is too long'),
    phone: z
      .string()
      .min(1, 'Phone is required')
      .max(16, 'Phone is too long')
      .optional(),
    city: z
      .string()
      .min(1, 'City is required')
      .max(16, 'City is too long')
      .optional(),
    email: z.email('Invalid email address'),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .max(32, 'Password is too long'),
    organizationId: z.string().optional(),
  }),
});

const createTeacherValidationSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(24, 'Name is too long'),
    phone: z
      .string()
      .min(1, 'Phone is required')
      .max(16, 'Phone is too long')
      .optional(),
    city: z
      .string()
      .min(1, 'City is required')
      .max(16, 'City is too long')
      .optional(),
    email: z.email('Invalid email address'),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .max(32, 'Password is too long'),
    organizationId: z.string().optional(),
  }),
});

const createAdminValidationSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(24, 'Name is too long'),
    phone: z
      .string()
      .min(1, 'Phone is required')
      .max(16, 'Phone is too long')
      .optional(),
    city: z
      .string()
      .min(1, 'City is required')
      .max(16, 'City is too long')
      .optional(),
    email: z.email('Invalid email address'),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .max(32, 'Password is too long'),
    organizationId: z.string().optional(),
  }),
});

const updateProfileValidationSchema = z.object({
  body: z
    .object({
      name: z
        .string()
        .min(1, 'Name is required')
        .max(24, 'Name is too long')
        .optional(),
      phone: z
        .string()
        .min(1, 'Phone is required')
        .max(16, 'Phone is too long')
        .optional(),
      address: z
        .string()
        .min(1, 'Address is required')
        .max(128, 'Address is too long')
        .optional(),
      targetScore: z.number().min(0).max(9).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided for update',
    }),
});

const updateUserStatusValidationSchema = z.object({
  body: z.object({
    status: z.enum(UserStatus),
  }),
});

export const UserValidation = {
  createStudentValidationSchema,
  createTeacherValidationSchema,
  createAdminValidationSchema,
  updateProfileValidationSchema,
  updateUserStatusValidationSchema,
};
