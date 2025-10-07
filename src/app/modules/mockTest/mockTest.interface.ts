import { ExamType } from '@prisma/client';

export interface CreateMockTestInput {
  title: string;
  examType: ExamType;
  durationMin: number;
  instructions?: string;
  organizationId?: string;
  questions: Array<{
    questionId: string;
    order: number;
  }>;
}
