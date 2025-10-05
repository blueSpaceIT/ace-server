import { z } from 'zod';

const createOrganizationValidationSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
    domain: z.string().optional(),
  }),
});

const updateOrganizationValidationSchema = z.object({
  params: z.object({
    id: z.string({ message: 'Invalid organization ID' }),
  }),
  body: z
    .object({
      name: z
        .string()
        .min(1, 'Name is required')
        .max(100, 'Name too long')
        .optional(),
      isActive: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided for update',
    }),
});

const assignAdminValidationSchema = z.object({
  params: z.object({
    id: z.string({ message: 'Invalid organization ID' }),
  }),
  body: z.object({
    userId: z.string({ message: 'Invalid user ID' }),
  }),
});

export const OrganizationValidation = {
  createOrganizationValidationSchema,
  updateOrganizationValidationSchema,
  assignAdminValidationSchema,
};
