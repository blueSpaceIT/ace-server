import { User } from '@prisma/client';

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
  city?: string;
  organizationId?: string;
}

export interface CreateProfileResult {
  user: Partial<User>;
  profile: any;
  verifyUrl: string;
}
