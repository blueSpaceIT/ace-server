import { UserRole } from '@prisma/client';

export interface IAuthUser {
  id: string;
  email: string;
  role: UserRole;
}
