import { CourseModule, Prisma } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import ApiError from '../../helpers/ApiError';
import { paginationHelper } from '../../helpers/paginationHelper';
import { IAuthUser } from '../../interfaces/common';
import { IPaginationOptions } from '../../interfaces/pagination';
import prisma from '../../shared/prisma';
import { moduleSearchableFields } from './courseModule.constant';

const createModule = async (payload: Partial<CourseModule>) => {
  return prisma.courseModule.create({
    data: {
      title: payload.title!,
      description: payload.description!,
      order: payload.order!,
      moduleType: payload.moduleType!,
      metadata: payload.metadata as Prisma.InputJsonValue,
      courseId: payload.courseId!,
    },
    select: {
      id: true,
      title: true,
      order: true,
      moduleType: true,
      courseId: true,
      createdAt: true,
    },
  });
};

const getModules = async (
  user: IAuthUser | null,
  params: Record<string, unknown>,
  options: IPaginationOptions,
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);
  const { searchTerm, moduleType, courseId, isDeleted } = params;

  const andConditions: Prisma.CourseModuleWhereInput[] = [];

  // Global search
  if (searchTerm) {
    andConditions.push({
      OR: moduleSearchableFields.map((field) => ({
        [field]: { contains: String(searchTerm), mode: 'insensitive' },
      })),
    });
  }

  // Exact filters
  if (moduleType)
    andConditions.push({
      moduleType: moduleType as Prisma.EnumModuleTypeFilter,
    });
  if (courseId) andConditions.push({ courseId: String(courseId) });
  if (isDeleted !== undefined)
    andConditions.push({ isDeleted: Boolean(isDeleted) });

  // Non-admins see only modules from visible courses
  if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.userRole)) {
    andConditions.push({
      course: { visibility: true },
      isDeleted: false,
    });
  }

  const whereConditions: Prisma.CourseModuleWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const [modules, total] = await prisma.$transaction([
    prisma.courseModule.findMany({
      where: whereConditions,
      skip,
      take: limit,
      orderBy: sortBy ? { [sortBy]: sortOrder } : { order: 'asc' },
      select: {
        id: true,
        title: true,
        description: true,
        order: true,
        moduleType: true,
        metadata: true,
        courseId: true,
        isDeleted: true,
        createdAt: true,
        updatedAt: true,
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            visibility: true,
          },
        },
      },
    }),
    prisma.courseModule.count({ where: whereConditions }),
  ]);

  return { meta: { page, limit, total }, data: modules };
};

const getModuleById = async (moduleId: string) => {
  const module = await prisma.courseModule.findUnique({
    where: { id: moduleId },
  });
  if (!module || module.isDeleted)
    throw new ApiError(StatusCodes.NOT_FOUND, 'Module not found');
  return module;
};

const updateModule = async (
  moduleId: string,
  payload: Partial<CourseModule>,
): Promise<{ title: string }> => {
  const module = await prisma.courseModule.findUnique({
    where: { id: moduleId },
    select: { id: true, title: true, isDeleted: true },
  });
  if (!module || module.isDeleted)
    throw new ApiError(StatusCodes.NOT_FOUND, 'Module not found');

  await prisma.courseModule.update({
    where: { id: moduleId },
    data: {
      ...(payload.title && { title: payload.title }),
      ...(payload.description && { description: payload.description }),
      ...(payload.order !== undefined && { order: payload.order }),
      ...(payload.moduleType && { moduleType: payload.moduleType }),
      ...(payload.metadata !== undefined && {
        metadata: payload.metadata as Prisma.InputJsonValue,
      }),
    },
  });

  return { title: module.title };
};

const restoreModule = async (moduleId: string): Promise<{ title: string }> => {
  const module = await prisma.courseModule.findUnique({
    where: { id: moduleId },
    select: { id: true, title: true, isDeleted: true },
  });
  if (!module || !module.isDeleted)
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Module not found or already active',
    );

  return prisma.courseModule.update({
    where: { id: moduleId },
    data: { isDeleted: false },
    select: { title: true },
  });
};

const deleteModule = async (moduleId: string): Promise<{ title: string }> => {
  const module = await prisma.courseModule.findUnique({
    where: { id: moduleId },
    select: { id: true, title: true, isDeleted: true },
  });
  if (!module || module.isDeleted)
    throw new ApiError(StatusCodes.NOT_FOUND, 'Module not found');

  return prisma.courseModule.update({
    where: { id: moduleId },
    data: { isDeleted: true },
    select: { title: true },
  });
};

const hardDeleteModule = async (
  moduleId: string,
): Promise<{ title: string }> => {
  const module = await prisma.courseModule.findUnique({
    where: { id: moduleId },
  });
  if (!module) throw new ApiError(StatusCodes.NOT_FOUND, 'Module not found');

  return prisma.courseModule.delete({ where: { id: moduleId } });
};

export const CourseModuleService = {
  createModule,
  getModules,
  getModuleById,
  updateModule,
  restoreModule,
  deleteModule,
  hardDeleteModule,
};
