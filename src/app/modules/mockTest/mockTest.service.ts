import { Prisma, UserRole } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import ApiError from '../../helpers/ApiError';
import { paginationHelper } from '../../helpers/paginationHelper';
import { IAuthUser } from '../../interfaces/common';
import prisma from '../../shared/prisma';

import { mockTestSearchableFields } from './mockTest.constant';
import { CreateMockTestInput } from './mockTest.interface';

const getAllMockTests = async (
  _user: IAuthUser,
  filters: any,
  options: any,
) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = filters;

  const andConditions: Prisma.MockTestWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: mockTestSearchableFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      })),
    });
  }

  if (filterData.examType) {
    andConditions.push({
      examType: filterData.examType,
    });
  }

  if (filterData.organizationId) {
    andConditions.push({
      organizationId: filterData.organizationId,
    });
  }

  const whereConditions: Prisma.MockTestWhereInput = { AND: andConditions };

  const data = await prisma.mockTest.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : { createdAt: 'desc' },
    include: {
      organization: true,
      questions: {
        include: {
          question: true,
        },
      },
    },
  });

  const total = await prisma.mockTest.count({ where: whereConditions });

  return {
    meta: { total, page, limit },
    data,
  };
};

const getMockTestById = async (id: string, _user: IAuthUser) => {
  const mockTest = await prisma.mockTest.findUnique({
    where: { id },
    include: {
      organization: true,
      questions: {
        include: { question: true },
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!mockTest) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Mock test not found');
  }

  return mockTest;
};

const createMockTest = async (
  user: IAuthUser,
  payload: CreateMockTestInput,
) => {
  const {
    title,
    examType,
    durationMin,
    instructions,
    organizationId,
    questions,
  } = payload;

  // Role restriction
  if (
    user.userRole !== UserRole.ADMIN &&
    user.userRole !== UserRole.SUPER_ADMIN &&
    user.userRole !== UserRole.TEACHER
  ) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'You are not authorized to create a mock test',
    );
  }

  //  Create MockTest with connected questions
  const mockTest = await prisma.mockTest.create({
    data: {
      title,
      examType,
      durationMin,
      instructions,
      organizationId,
      adminId: user.id,
      questions: {
        create: questions.map((q) => ({
          question: { connect: { id: q.questionId } },
          order: q.order,
        })),
      },
    },
    include: {
      questions: {
        include: { question: true },
      },
    },
  });

  return mockTest;
};

const updateMockTest = async (id: string, payload: any, user: IAuthUser) => {
  const existing = await prisma.mockTest.findUnique({ where: { id } });
  if (!existing)
    throw new ApiError(StatusCodes.NOT_FOUND, 'Mock test not found');
  if (
    user.userRole !== UserRole.ADMIN &&
    user.userRole !== UserRole.SUPER_ADMIN &&
    user.userRole !== UserRole.TEACHER
  ) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'You are not authorized to update a mock test',
    );
  }

  const { questionIds, ...updateData } = payload;

  // Update basic info
  await prisma.mockTest.update({
    where: { id },
    data: {
      ...updateData,
      updatedAt: new Date(),
    },
  });

  // Update related questions (replace all)
  if (questionIds && questionIds.length > 0) {
    await prisma.mockTestQuestion.deleteMany({ where: { mockTestId: id } });
    await prisma.mockTestQuestion.createMany({
      data: questionIds.map((q: any) => ({
        mockTestId: id,
        questionId: q.questionId,
        order: q.order,
      })),
    });
  }

  return prisma.mockTest.findUnique({
    where: { id },
    include: {
      questions: {
        include: { question: true },
        orderBy: { order: 'asc' },
      },
    },
  });
};

const deleteMockTest = async (id: string, user: IAuthUser) => {
  if (
    user.userRole !== UserRole.ADMIN &&
    user.userRole !== UserRole.SUPER_ADMIN
  ) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'You are not authorized to delete mock test',
    );
  }

  await prisma.mockTest.delete({ where: { id } });
};

export const MockTestService = {
  getAllMockTests,
  getMockTestById,
  createMockTest,
  updateMockTest,
  deleteMockTest,
};
