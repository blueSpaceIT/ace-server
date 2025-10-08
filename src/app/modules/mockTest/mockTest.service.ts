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
    !(
      [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TEACHER] as UserRole[]
    ).includes(user.userRole)
  ) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'You are not authorized to create a mock test',
    );
  }

  let adminId: string | null = null;

  if (
    user.userRole === UserRole.ADMIN ||
    user.userRole === UserRole.SUPER_ADMIN
  ) {
    const adminProfile = await prisma.admin.findUnique({
      where: { userId: user.id },
    });

    if (!adminProfile) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Admin profile not found. Please contact support.',
      );
    }

    adminId = adminProfile.id;
  }

  // Validate questions exist and not deleted
  const questionIds = questions.map((q) => q.questionId);
  const validQuestions = await prisma.question.findMany({
    where: { id: { in: questionIds }, isDeleted: false },
  });
  if (
    validQuestions.length !== questionIds.length ||
    validQuestions.length === 0
  ) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Some or all questions not found or deleted. Please check question IDs.',
    );
  }

  // Create MockTest
  const mockTest = await prisma.mockTest.create({
    data: {
      title,
      examType,
      durationMin,
      instructions,
      organizationId: organizationId || null,
      adminId,
    },
    include: {
      organization: true,
      admin: true,
    },
  });

  // Create MockTestQuestion entries
  await Promise.all(
    questions.map(async (q) => {
      return prisma.mockTestQuestion.create({
        data: {
          mockTestId: mockTest.id,
          questionId: q.questionId,
          order: q.order,
        },
      });
    }),
  );

  // Fetch updated mock with questions
  const updatedMock = await prisma.mockTest.findUnique({
    where: { id: mockTest.id },
    include: {
      questions: {
        include: { question: true },
        orderBy: { order: 'asc' },
      },
    },
  });

  return updatedMock;
};

const updateMockTest = async (
  id: string,
  payload: CreateMockTestInput,
  user: IAuthUser,
) => {
  const existing = await prisma.mockTest.findUnique({
    where: { id },
    include: { questions: true },
  });

  if (!existing) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Mock test not found');
  }

  // Role-based restriction
  if (
    !(
      [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TEACHER] as UserRole[]
    ).includes(user.userRole)
  ) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'You are not authorized to update a mock test',
    );
  }

  const {
    title,
    examType,
    durationMin,
    instructions,
    organizationId,
    questions,
  } = payload;

  let adminId: string | null = existing.adminId;

  //  If admin/super_admin, ensure admin profile exists
  if (
    user.userRole === UserRole.ADMIN ||
    user.userRole === UserRole.SUPER_ADMIN
  ) {
    const adminProfile = await prisma.admin.findUnique({
      where: { userId: user.id },
    });

    if (!adminProfile) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Admin profile not found. Please contact support.',
      );
    }

    adminId = adminProfile.id;
  }

  //  Validate that provided question IDs exist & not deleted
  const questionIds = questions?.map((q) => q.questionId) || [];
  if (questionIds.length > 0) {
    const validQuestions = await prisma.question.findMany({
      where: { id: { in: questionIds }, isDeleted: false },
    });

    if (
      validQuestions.length !== questionIds.length ||
      validQuestions.length === 0
    ) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Some or all questions not found or deleted. Please check question IDs.',
      );
    }

    //  Remove old question links & replace with new ones
    await prisma.mockTestQuestion.deleteMany({
      where: { mockTestId: id },
    });

    await prisma.mockTestQuestion.createMany({
      data: questions.map((q) => ({
        mockTestId: id,
        questionId: q.questionId,
        order: q.order,
      })),
    });
  }

  // Update mock test metadata
  const updatedMock = await prisma.mockTest.update({
    where: { id },
    data: {
      title,
      examType,
      durationMin,
      instructions,
      organizationId: organizationId || null,
      adminId,
      updatedAt: new Date(),
    },
    include: {
      questions: {
        include: { question: true },
        orderBy: { order: 'asc' },
      },
    },
  });

  return updatedMock;
};

const deleteMockTest = async (id: string, user: IAuthUser) => {
  // Role-based access

  if (
    !([UserRole.ADMIN, UserRole.SUPER_ADMIN] as UserRole[]).includes(
      user.userRole,
    )
  ) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'You are not authorized to delete mock test',
    );
  }

  // Check if mock test exists
  const existingMock = await prisma.mockTest.findUnique({
    where: { id },
  });

  if (!existingMock) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Mock test not found');
  }

  // Delete associated MockTestQuestions first
  await prisma.mockTestQuestion.deleteMany({
    where: { mockTestId: id },
  });

  // Delete the mock test itself
  await prisma.mockTest.delete({
    where: { id },
  });
};

export const MockTestService = {
  getAllMockTests,
  getMockTestById,
  createMockTest,
  updateMockTest,
  deleteMockTest,
};
