import { User } from '@prisma/client';

export interface CreateOrganizationInput {
  name: string;
  domain?: string;
}

export interface UpdateOrganizationInput {
  name?: string;
  isActive?: boolean;
}

export interface CreateProfileResult {
  user: Partial<User>;
  profile: any;
}
