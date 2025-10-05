import { AuthProviderType, UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import config from '.';
import prisma from '../shared/prisma';

export const seedSuperAdmin = async (): Promise<void> => {
  if (!config.SUPER_ADMIN_EMAIL || !config.SUPER_ADMIN_PASSWORD) {
    console.error(
      '❌ SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD not set in environment.',
    );
    process.exit(1);
  }
  try {
    const existing = await prisma.user.findUnique({
      where: { email: config.SUPER_ADMIN_EMAIL },
    });

    if (existing) {
      console.log('✅ Super Admin already exists!');
      return;
    }
    console.log('⏳ Creating Super Admin...');
    const hashedPassword = await bcrypt.hash(
      config.SUPER_ADMIN_PASSWORD,
      Number(config.BCRYPT_SALT_ROUND),
    );

    const superAdmin = await prisma.user.create({
      data: {
        name: 'Super Admin',
        email: config.SUPER_ADMIN_EMAIL,
        password: hashedPassword,
        userRole: UserRole.SUPER_ADMIN,
        status: UserStatus.ACTIVE,
        isDeleted: false,
        authProviders: {
          create: {
            provider: AuthProviderType.CREDENTIALS,
            providerId: config.SUPER_ADMIN_EMAIL,
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        userRole: true,
        status: true,
        createdAt: true,
      },
    });

    console.log('✅ Super Admin created successfully!');
    console.log(superAdmin);
  } catch (err) {
    console.error('❌ Error creating Super Admin:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};
