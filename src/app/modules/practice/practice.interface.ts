import { ExamType, ModuleType, QuestionType } from '@prisma/client';

export interface CreatePracticeModuleInput {
  courseId: string;
  title: string;
  examType: ExamType;
  moduleType: ModuleType;
  metadata?: Record<string, unknown>;
}

export interface CreateQuestionInput {
  title?: string;
  text: string;
  examType: ExamType;
  moduleType: ModuleType;
  questionType: QuestionType;
  options?: Record<string, unknown>[];
  correctAnswer: Record<string, unknown> | string;
  media?: Record<string, unknown>;
  difficulty?: number;
  timeLimitSec?: number;
  practiceModuleId?: string;
}
