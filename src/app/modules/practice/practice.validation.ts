import { ExamType, ModuleType, QuestionType } from '@prisma/client';
import { z } from 'zod';

const createPracticeModuleValidationSchema = z.object({
  body: z.object({
    courseId: z.string(),
    title: z.string().min(1, 'Title is required').max(128, 'Title is too long'),
    examType: z.enum(ExamType),
    moduleType: z.enum(ModuleType),
    metadata: z.record(z.string(), z.unknown()).optional(),
  }),
});

const updatePracticeModuleValidationSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z
    .object({
      courseId: z.string().optional(),
      title: z.string().min(1).max(128).optional(),
      examType: z.enum(ExamType).optional(),
      moduleType: z.enum(ModuleType).optional(),
      metadata: z.record(z.string(), z.unknown()).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided for update',
    }),
});

const createQuestionValidationSchema = z.object({
  body: z.object({
    title: z.string().max(128).optional(),
    text: z.string().min(1, 'Text is required').max(4096, 'Text too long'),
    examType: z.enum(ExamType),
    moduleType: z.enum(ModuleType),
    questionType: z.enum(QuestionType),
    options: z
      .array(
        z.object({
          id: z.string(),
          label: z.string(),
          isCorrect: z.boolean().optional(),
        }),
      )
      .optional(),
    correctAnswer: z.union([z.string(), z.array(z.string())]),
    media: z.record(z.string(), z.string()).optional(),
    difficulty: z.number().int().min(1).max(5).optional(),
    timeLimitSec: z.number().int().min(0).max(300).optional(),
    practiceModuleId: z.string().optional(),
  }),
});

const updateQuestionValidationSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z
    .object({
      title: z.string().max(128).optional(),
      text: z.string().min(1).max(4096).optional(),
      examType: z.enum(ExamType).optional(),
      moduleType: z.enum(ModuleType).optional(),
      questionType: z.enum(QuestionType).optional(),
      options: z
        .array(
          z.object({
            id: z.string(),
            label: z.string(),
            isCorrect: z.boolean().optional(),
          }),
        )
        .optional(),
      correctAnswer: z.union([z.string(), z.array(z.string())]).optional(),
      media: z.record(z.string(), z.string()).optional(),
      difficulty: z.number().int().min(1).max(5).optional(),
      timeLimitSec: z.number().int().min(0).max(300).optional(),
      practiceModuleId: z.string().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided for update',
    }),
});

export const PracticeValidation = {
  createPracticeModuleValidationSchema,
  updatePracticeModuleValidationSchema,
  createQuestionValidationSchema,
  updateQuestionValidationSchema,
};
