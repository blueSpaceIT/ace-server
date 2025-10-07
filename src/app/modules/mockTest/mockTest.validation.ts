import { ExamType } from '@prisma/client';
import { z } from 'zod';

const createMockTestValidationSchema = z.object({
  body: z.object({
    title: z.string().min(2, 'Title is required'),
    examType: z.enum(ExamType),
    durationMin: z
      .number()
      .int()
      .positive('Duration must be a positive number'),
    instructions: z.string().optional(),
    organizationId: z.string().optional(),
    questions: z
      .array(
        z.object({
          questionId: z.string(),
          order: z.number().int().positive(),
        }),
      )
      .min(1, 'At least one question must be included'),
  }),
});

const updateMockTestValidationSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    examType: z.enum(ExamType).optional(),
    durationMin: z.number().int().positive().optional(),
    instructions: z.string().optional(),
    organizationId: z.string().optional(),
    questions: z
      .array(
        z.object({
          questionId: z.string(),
          order: z.number().int().positive(),
        }),
      )
      .optional(),
  }),
});

export const MockTestValidation = {
  createMockTestValidationSchema,
  updateMockTestValidationSchema,
};
