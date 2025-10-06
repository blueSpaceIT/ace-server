import { ExamType } from '@prisma/client';
import { z } from 'zod';

const createCourseValidationSchema = z.object({
  body: z.object({
    organizationId: z.string().optional(),
    title: z.string().min(1, 'Title is required').max(128, 'Title is too long'),
    description: z
      .string()
      .min(1, 'Description is required')
      .max(2048, 'Description is too long'),
    price: z.coerce
      .number()
      .int('Price must be an integer')
      .nonnegative('Price must be a positive integer')
      .default(0),
    examType: z.enum(ExamType),
    thumbnail: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  }),
});

const updateCourseValidationSchema = z.object({
  body: z.object({
    organizationId: z.string().optional(),
    title: z.string().min(1).max(128).optional(),
    slug: z.string().min(1).max(128).optional(),
    description: z.string().min(1).max(2048).optional(),
    price: z.coerce.number().int().nonnegative().optional(),
    examType: z.enum(ExamType).optional(),
    thumbnail: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  }),
});

export const CourseValidation = {
  createCourseValidationSchema,
  updateCourseValidationSchema,
};
