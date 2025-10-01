import { ModuleType } from '@prisma/client';
import { z } from 'zod';

const createModuleValidationSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(128, 'Title is too long'),
    description: z
      .string()
      .min(1, 'Description is required')
      .max(2048, 'Description is too long'),
    order: z
      .number('Order must be a number')
      .int()
      .nonnegative('Order must be a positive integer'),
    moduleType: z.enum(ModuleType, 'Invalid module type'),
    metadata: z.any().optional(),
  }),
});

const updateModuleValidationSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(128).optional(),
    description: z.string().min(1).max(2048).optional(),
    order: z.number().int().nonnegative().optional(),
    moduleType: z.enum(ModuleType).optional(),
    metadata: z.any().optional(),
    isDeleted: z.boolean().optional(),
  }),
});

export const CourseModuleValidation = {
  createModuleValidationSchema,
  updateModuleValidationSchema,
};
