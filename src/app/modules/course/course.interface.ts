import { ExamType } from '@prisma/client';

export interface CreateCourseInput {
  title: string;
  description: string;
  price: number;
  examType: ExamType;
  organizationId?: string;
  metadata?: Record<string, unknown>;
  visibility?: boolean;
  featured?: boolean;
}
