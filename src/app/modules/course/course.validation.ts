import { z } from 'zod';

const createCourseValidationSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(128, 'Title is too long'),
    description: z
      .string()
      .min(1, 'Description is required')
      .max(2048, 'Description is too long'),
    price: z
      .number('Price must be a number')
      .int()
      .nonnegative('Price must be a positive integer'),
    thumbnail: z.string().optional(),
    metadata: z.any().optional(),
    visibility: z.boolean().optional(),
    featured: z.boolean().optional(),
  }),
});

const updateCourseValidationSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(128).optional(),
    slug: z.string().min(1).max(128).optional(),
    description: z.string().min(1).max(2048).optional(),
    price: z.number().int().nonnegative().optional(),
    thumbnail: z.string().optional(),
    metadata: z.any().optional(),
    visibility: z.boolean().optional(),
    featured: z.boolean().optional(),
    isDeleted: z.boolean().optional(),
  }),
});

export const CourseValidation = {
  createCourseValidationSchema,
  updateCourseValidationSchema,
};
