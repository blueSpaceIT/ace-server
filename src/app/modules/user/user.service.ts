// Updated User Service (user.service.ts)
import {
  AuthProviderType,
  Prisma,
  User,
  UserRole,
  UserStatus,
} from '@prisma/client';
import bcrypt from 'bcrypt';
import { StatusCodes } from 'http-status-codes';
import config from '../../config';
import ApiError from '../../helpers/ApiError';
import { paginationHelper } from '../../helpers/paginationHelper';
import { IAuthUser } from '../../interfaces/common';
import { IFile } from '../../interfaces/file';
import { IPaginationOptions } from '../../interfaces/pagination';
import prisma from '../../shared/prisma';
import { OtpService } from '../otp/otp.service';
import { userSearchAbleFields } from './user.constant';
import { CreateProfileResult, CreateUserInput } from './user.interface';
import { buildVerifyUrl } from './user.utils';

const createStudent = async (
  payload: CreateUserInput,
): Promise<CreateProfileResult> => {
  const existing = await prisma.user.findUnique({
    where: { email: payload.email },
    include: { student: true },
  });

  if (existing) {
    if (existing.status === 'PENDING') {
      await OtpService.resendOTP(payload.email);
      return {
        user: existing,
        profile: existing.student,
        verifyUrl: buildVerifyUrl(payload.email),
      };
    }
    throw new ApiError(
      StatusCodes.CONFLICT,
      'User with this email already exists',
    );
  }

  const hashedPassword = await bcrypt.hash(
    payload.password,
    Number(config.BCRYPT_SALT_ROUND),
  );

  const result = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        name: payload.name,
        email: payload.email,
        password: hashedPassword,
        phone: payload.phone,
        userRole: UserRole.STUDENT,
        status: 'PENDING',
        organizationId: payload.organizationId,
        authProviders: {
          create: {
            provider: AuthProviderType.CREDENTIALS,
            providerId: payload.email,
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
        updatedAt: true,
      },
    });

    const newStudent = await tx.student.create({
      data: { userId: newUser.id },
    });

    return { user: newUser, profile: newStudent };
  });

  await OtpService.sendOTP(payload.email);
  return { ...result, verifyUrl: buildVerifyUrl(payload.email) };
};

const createTeacher = async (
  payload: CreateUserInput,
): Promise<CreateProfileResult> => {
  const existing = await prisma.user.findUnique({
    where: { email: payload.email },
    include: { teacher: true },
  });

  if (existing) {
    if (existing.status === 'PENDING') {
      await OtpService.resendOTP(payload.email);
      return {
        user: existing,
        profile: existing.teacher,
        verifyUrl: buildVerifyUrl(payload.email),
      };
    }
    throw new ApiError(
      StatusCodes.CONFLICT,
      'User with this email already exists',
    );
  }

  const hashedPassword = await bcrypt.hash(
    payload.password,
    Number(config.BCRYPT_SALT_ROUND),
  );

  const result = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        name: payload.name,
        email: payload.email,
        password: hashedPassword,
        phone: payload.phone,
        userRole: UserRole.TEACHER,
        status: 'PENDING',
        organizationId: payload.organizationId,
        authProviders: {
          create: {
            provider: AuthProviderType.CREDENTIALS,
            providerId: payload.email,
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
        updatedAt: true,
      },
    });

    const newTeacher = await tx.teacher.create({
      data: { userId: newUser.id },
    });

    return { user: newUser, profile: newTeacher };
  });

  await OtpService.sendOTP(payload.email);
  return { ...result, verifyUrl: buildVerifyUrl(payload.email) };
};

const createAdmin = async (
  payload: CreateUserInput,
): Promise<CreateProfileResult> => {
  const existing = await prisma.user.findUnique({
    where: { email: payload.email },
    include: { admin: true },
  });

  if (existing) {
    if (existing.status === 'PENDING') {
      await OtpService.resendOTP(payload.email);
      return {
        user: existing,
        profile: existing.admin,
        verifyUrl: buildVerifyUrl(payload.email),
      };
    }
    throw new ApiError(
      StatusCodes.CONFLICT,
      'User with this email already exists',
    );
  }

  const hashedPassword = await bcrypt.hash(
    payload.password,
    Number(config.BCRYPT_SALT_ROUND),
  );

  const result = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        name: payload.name,
        email: payload.email,
        password: hashedPassword,
        phone: payload.phone,
        userRole: UserRole.ADMIN,
        status: 'PENDING',
        organizationId: payload.organizationId,
        authProviders: {
          create: {
            provider: AuthProviderType.CREDENTIALS,
            providerId: payload.email,
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
        updatedAt: true,
      },
    });

    const newAdmin = await tx.admin.create({
      data: { userId: newUser.id },
    });

    return { user: newUser, profile: newAdmin };
  });

  await OtpService.sendOTP(payload.email);
  return { ...result, verifyUrl: buildVerifyUrl(payload.email) };
};

const updateProfile = async (
  currentUser: IAuthUser,
  payload: Partial<User> & { targetScore?: number },
  file?: IFile,
) => {
  const user = await prisma.user.findUnique({
    where: { id: currentUser.id, isDeleted: false },
  });

  if (!user || user.status !== 'ACTIVE') {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found or inactive');
  }

  let pictureUrl = user.picture;
  if (file) {
    pictureUrl = file.path;
  }

  await prisma.user.update({
    where: { id: currentUser.id },
    data: {
      name: payload.name ?? user.name,
      phone: payload.phone ?? user.phone,
      picture: pictureUrl,
    },
  });

  // Role-specific updates (e.g., targetScore for STUDENT)
  if (
    currentUser.userRole === UserRole.STUDENT &&
    payload.targetScore !== undefined
  ) {
    await prisma.student.update({
      where: { userId: currentUser.id },
      data: { targetScore: payload.targetScore },
    });
  }

  return true;
};

const updateUserStatus = async (
  id: string,
  status: UserStatus,
): Promise<{ name: string | null; status: UserStatus }> => {
  const userRecord = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, isDeleted: true },
  });

  if (!userRecord || userRecord.isDeleted) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { status },
    select: { name: true, status: true },
  });

  return updated;
};

const deleteUser = async (id: string): Promise<{ name: string | null }> => {
  const userRecord = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, isDeleted: true },
  });

  if (!userRecord || userRecord.isDeleted) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  await prisma.user.update({
    where: { id },
    data: { isDeleted: true },
  });

  return { name: userRecord.name };
};

const getMyProfile = async (authUser: IAuthUser) => {
  const includeObj: any = { organization: true };

  if (authUser.userRole === UserRole.STUDENT) {
    includeObj.student = true;
  }
  if (authUser.userRole === UserRole.TEACHER) {
    includeObj.teacher = true;
  }
  if (
    authUser.userRole === UserRole.ADMIN ||
    authUser.userRole === UserRole.SUPER_ADMIN
  ) {
    includeObj.admin = true;
  }

  const user = await prisma.user.findUnique({
    where: { id: authUser.id, isDeleted: false },
    include: includeObj,
  });

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  const { password, ...safeUser } = user;

  return safeUser;
};

const getAllUsers = async (
  params: Record<string, unknown>,
  options: IPaginationOptions,
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = params;

  const andConditions: Prisma.UserWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: userSearchAbleFields.map((field) => ({
        [field]: {
          contains: String(searchTerm),
          mode: 'insensitive',
        },
      })),
    });
  }

  if (Object.keys(filterData).length) {
    andConditions.push({
      AND: Object.entries(filterData).map(([key, value]) => ({
        [key]: { equals: value },
      })),
    });
  }

  const whereConditions: Prisma.UserWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const includeData = {
    student: { select: { targetScore: true, examDate: true } },
    teacher: { select: { id: true } },
    admin: { select: { id: true } },
    organization: { select: { id: true, name: true } },
  };

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where: whereConditions,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: includeData,
    }),
    prisma.user.count({ where: whereConditions }),
  ]);

  return {
    meta: { page, limit, total },
    data: users,
  };
};

export const UserService = {
  createStudent,
  createTeacher,
  createAdmin,
  updateProfile,
  updateUserStatus,
  deleteUser,
  getMyProfile,
  getAllUsers,
};
