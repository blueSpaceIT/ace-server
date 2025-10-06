import { ModuleType } from '@prisma/client';

export interface CreateModuleInput {
  courseId: string;
  title: string;
  description?: string;
  order: number;
  moduleType: ModuleType;
  metadata?: Record<string, unknown>;
}
