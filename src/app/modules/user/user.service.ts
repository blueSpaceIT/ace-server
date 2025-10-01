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
import { buildVerifyUrl } from './user.utils';

const createAdmin = async (
  payload: CreateUserInput,
): Promise<Partial<User> & { verifyUrl: string }> => {
  const existing = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  // If user exists and is in PENDING status, resend OTP instead of throwing error
  if (existing) {
    if (existing.status === 'PENDING') {
      // Resend OTP for existing PENDING user
      await OtpService.resendOTP(payload.email);
      return {
        ...existing,
        verifyUrl: buildVerifyUrl(payload.email),
      };
    } else {
      throw new ApiError(
        StatusCodes.CONFLICT,
        'User with this email already exists',
      );
    }
  }

  const hashedPassword = await bcrypt.hash(
    payload.password,
    Number(config.BCRYPT_SALT_ROUND),
  );

  const newUser = await prisma.user.create({
    data: {
      name: payload.name,
      email: payload.email,
      password: hashedPassword,
      role: UserRole.ADMIN,
      status: 'PENDING',
      authProviders: {
        create: {
          provider: AuthProviderType.credentials,
          providerId: payload.email,
        },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  await OtpService.sendOTP(payload.email);

  return { ...newUser, verifyUrl: buildVerifyUrl(payload.email) };
};

const createUser = async (
  payload: CreateUserInput,
): Promise<Partial<User> & { verifyUrl: string }> => {
  const existing = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  // If user exists and is in PENDING status, resend OTP instead of throwing error
  if (existing) {
    if (existing.status === 'PENDING') {
      // Resend OTP for existing PENDING user
      await OtpService.resendOTP(payload.email);
      return {
        ...existing,
        verifyUrl: buildVerifyUrl(payload.email),
      };
    } else {
      throw new ApiError(
        StatusCodes.CONFLICT,
        'User with this email already exists',
      );
    }
  }

  const hashedPassword = await bcrypt.hash(
    payload.password,
    Number(config.BCRYPT_SALT_ROUND),
  );

  const newUser = await prisma.user.create({
    data: {
      name: payload.name,
      email: payload.email,
      password: hashedPassword,
      role: UserRole.STUDENT,
      status: 'PENDING',
      authProviders: {
        create: {
          provider: AuthProviderType.credentials,
          providerId: payload.email,
        },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  await OtpService.sendOTP(payload.email);

  return { ...newUser, verifyUrl: buildVerifyUrl(payload.email) };
};

const updateProfile = async (
  currentUser: IAuthUser,
  payload: Partial<User>,
  file?: IFile,
) => {
  const user = await prisma.user.findUnique({
    where: { id: currentUser.id, isDeleted: false },
  });

  if (!user || user.status !== 'ACTIVE') {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found or inactive');
  }

  let pictureUrl: string | undefined;

  if (file) {
    pictureUrl = file.path;
  }

  await prisma.user.update({
    where: { id: currentUser.id },
    data: {
      name: payload.name ?? user.name,
      phone: payload.phone ?? user.phone,
      address: payload.address ?? user.address,
      picture: pictureUrl ?? user.picture,
    },
  });

  return true;
};

const updateUserStatus = async (
  id: string,
  status: UserStatus,
): Promise<{ name: string; status: UserStatus }> => {
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

const deleteUser = async (id: string): Promise<{ name: string }> => {
  const userRecord = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, isDeleted: true },
  });

  if (!userRecord || userRecord.isDeleted) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  const deleted = await prisma.user.update({
    where: { id },
    data: { isDeleted: true },
    select: { name: true },
  });

  return deleted;
};

const getMyProfile = async (authUser: IAuthUser) => {
  const user = await prisma.user.findUnique({
    where: { id: authUser.id, isDeleted: false },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      address: true,
      picture: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  return user;
};

const getAllUsers = async (
  params: Record<string, unknown>,
  options: IPaginationOptions,
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const { searchTerm, ...filterData } = params;

  const andConditions: Prisma.UserWhereInput[] = [];

  // 🔍 Global search across multiple fields
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

  // 🎯 Exact match filters (role, status, etc.)
  if (Object.keys(filterData).length) {
    andConditions.push({
      AND: Object.entries(filterData).map(([key, value]) => ({
        [key]: { equals: value },
      })),
    });
  }

  const whereConditions: Prisma.UserWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where: whereConditions,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        picture: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.user.count({ where: whereConditions }),
  ]);

  return {
    meta: { page, limit, total },
    data: users,
  };
};

export const UserService = {
  createAdmin,
  createUser,
  updateProfile,
  updateUserStatus,
  deleteUser,
  getMyProfile,
  getAllUsers,
};
