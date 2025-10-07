import {
  ExamType,
  ModuleType,
  PracticeModule,
  Prisma,
  QuestionType,
  UserRole,
} from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import ApiError from '../../helpers/ApiError';
import { paginationHelper } from '../../helpers/paginationHelper';
import { IAuthUser } from '../../interfaces/common';
import { IPaginationOptions } from '../../interfaces/pagination';
import prisma from '../../shared/prisma';
import {
  CreatePracticeModuleInput,
  CreateQuestionInput,
} from './practice.interface';

const getPracticeModules = async (
  _user: IAuthUser,
  filters: Record<string, unknown>,
  options: IPaginationOptions,
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const { courseId, examType, moduleType, searchTerm } = filters;
  const andConditions: Prisma.PracticeModuleWhereInput[] = [];

  //  Search
  if (searchTerm) {
    andConditions.push({
      OR: [{ title: { contains: String(searchTerm), mode: 'insensitive' } }],
    });
  }

  //  Filter
  if (courseId) andConditions.push({ courseId: courseId as string });
  if (examType) andConditions.push({ examType: examType as ExamType });
  if (moduleType) andConditions.push({ moduleType: moduleType as ModuleType });

  //  Exclude deleted
  andConditions.push({ isDeleted: false });

  const where: Prisma.PracticeModuleWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : { isDeleted: false };

  const include: Prisma.PracticeModuleInclude = {
    course: {
      select: { id: true, title: true, slug: true, examType: true },
    },
    questions: {
      where: { isDeleted: false },
      select: {
        id: true,
        title: true,
        text: true,
        questionType: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    },
  };

  const [modules, total] = await prisma.$transaction([
    prisma.practiceModule.findMany({
      where,
      include,
      skip,
      take: limit,
      orderBy: sortBy
        ? { [sortBy]: sortOrder as Prisma.SortOrder }
        : { createdAt: 'desc' },
    }),
    prisma.practiceModule.count({ where }),
  ]);

  return {
    meta: { page, limit, total },
    data: modules,
  };
};

const getQuestions = async (
  _user: IAuthUser,
  filters: Record<string, unknown>,
  options: IPaginationOptions,
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);
  const {
    practiceModuleId,
    examType,
    moduleType,
    questionType,
    difficulty,
    searchTerm,
  } = filters;

  const andConditions: Prisma.QuestionWhereInput[] = [];

  //  Search
  if (searchTerm) {
    andConditions.push({
      OR: [
        { text: { contains: String(searchTerm), mode: 'insensitive' } },
        { title: { contains: String(searchTerm), mode: 'insensitive' } },
      ],
    });
  }

  //  Filters
  if (practiceModuleId)
    andConditions.push({ practiceModuleId: practiceModuleId as string });
  if (examType) andConditions.push({ examType: examType as ExamType });
  if (moduleType) andConditions.push({ moduleType: moduleType as ModuleType });
  if (questionType)
    andConditions.push({ questionType: questionType as QuestionType });
  if (difficulty) andConditions.push({ difficulty: Number(difficulty) });

  andConditions.push({ isDeleted: false });

  const where: Prisma.QuestionWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : { isDeleted: false };

  const include: Prisma.QuestionInclude = {
    practiceModule: {
      include: {
        course: { select: { id: true, title: true, examType: true } },
      },
    },
  };

  const [questions, total] = await prisma.$transaction([
    prisma.question.findMany({
      where,
      include,
      skip,
      take: limit,
      orderBy: sortBy
        ? { [sortBy]: sortOrder as Prisma.SortOrder }
        : { createdAt: 'desc' },
    }),
    prisma.question.count({ where }),
  ]);

  return { meta: { page, limit, total }, data: questions };
};

const createQuestion = async (
  _user: IAuthUser,
  payload: CreateQuestionInput,
  files?: { [key: string]: Express.Multer.File[] },
) => {
  // Check if related module exists
  if (payload.practiceModuleId) {
    const moduleExists = await prisma.practiceModule.findFirst({
      where: { id: payload.practiceModuleId, isDeleted: false },
    });
    if (!moduleExists)
      throw new ApiError(StatusCodes.NOT_FOUND, 'Practice module not found');
  }

  //  Handle media
  const media: Record<string, string> = {};
  if (files?.mediaAudio?.[0]) media.audioUrl = files.mediaAudio[0].path;
  if (files?.mediaImage?.[0]) media.imageUrl = files.mediaImage[0].path;

  //  Create question safely with proper JSON typing
  const question = await prisma.question.create({
    data: {
      title: payload.title,
      text: payload.text,
      examType: payload.examType,
      moduleType: payload.moduleType,
      questionType: payload.questionType,
      options: payload.options
        ? (payload.options as Prisma.InputJsonValue)
        : undefined,
      correctAnswer: payload.correctAnswer
        ? (payload.correctAnswer as Prisma.InputJsonValue)
        : undefined,
      difficulty: payload.difficulty,
      timeLimitSec: payload.timeLimitSec,
      practiceModuleId: payload.practiceModuleId ?? null,
      media:
        Object.keys(media).length > 0
          ? (media as Prisma.InputJsonValue)
          : undefined,
    },
    include: {
      practiceModule: {
        include: {
          course: { select: { id: true, title: true, examType: true } },
        },
      },
    },
  });

  return question;
};

const updateQuestion = async (
  id: string,
  payload: Partial<CreateQuestionInput>,
  files?: { [key: string]: Express.Multer.File[] },
  _user?: IAuthUser,
) => {
  const existing = await prisma.question.findFirst({
    where: { id, isDeleted: false },
  });

  if (!existing)
    throw new ApiError(StatusCodes.NOT_FOUND, 'Question not found');

  // Merge old + new media
  const media = (existing.media as Record<string, string>) || {};
  if (files?.mediaAudio?.[0]) media.audioUrl = files.mediaAudio[0].path;
  if (files?.mediaImage?.[0]) media.imageUrl = files.mediaImage[0].path;

  const updated = await prisma.question.update({
    where: { id },
    data: {
      title: payload.title,
      text: payload.text,
      examType: payload.examType,
      moduleType: payload.moduleType,
      questionType: payload.questionType,
      options: payload.options
        ? (payload.options as Prisma.InputJsonValue)
        : undefined,
      correctAnswer: payload.correctAnswer
        ? (payload.correctAnswer as Prisma.InputJsonValue)
        : undefined,
      difficulty: payload.difficulty,
      timeLimitSec: payload.timeLimitSec,
      media:
        Object.keys(media).length > 0
          ? (media as Prisma.InputJsonValue)
          : undefined,
      // Only update relation if explicitly passed
      ...(payload.practiceModuleId
        ? { practiceModule: { connect: { id: payload.practiceModuleId } } }
        : {}),
    },
    include: {
      practiceModule: {
        include: {
          course: { select: { id: true, title: true, examType: true } },
        },
      },
    },
  });

  return updated;
};

const deleteQuestion = async (id: string, user: IAuthUser): Promise<void> => {
  //  Role check
  if (
    user.userRole !== UserRole.ADMIN &&
    user.userRole !== UserRole.SUPER_ADMIN
  ) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'You do not have permission to delete this question',
    );
  }

  //  Find the question
  const question = await prisma.question.findFirst({
    where: { id, isDeleted: false },
  });

  if (!question) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Question not found');
  }

  //  Soft delete
  await prisma.question.update({
    where: { id },
    data: { isDeleted: true },
  });
};

const createPracticeModule = async (
  user: IAuthUser,
  payload: CreatePracticeModuleInput,
): Promise<PracticeModule> => {
  // Role check: only TEACHER, ADMIN, SUPER_ADMIN can create

  if (
    user.userRole !== UserRole.ADMIN &&
    user.userRole !== UserRole.SUPER_ADMIN &&
    user.userRole !== UserRole.TEACHER
  ) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'You do not have permission to delete this question',
    );
  }

  // Check course exists
  const course = await prisma.course.findFirst({
    where: { id: payload.courseId, isDeleted: false },
  });
  if (!course) throw new ApiError(StatusCodes.NOT_FOUND, 'Course not found');

  return prisma.practiceModule.create({
    data: {
      courseId: payload.courseId,
      title: payload.title,
      examType: payload.examType,
      moduleType: payload.moduleType,
      metadata: payload.metadata as Prisma.JsonObject | undefined,
    },
    include: { course: { select: { title: true } } },
  });
};

const updatePracticeModule = async (
  id: string,
  payload: Partial<CreatePracticeModuleInput>,
  user: IAuthUser,
): Promise<PracticeModule> => {
  // Role check: only TEACHER, ADMIN, SUPER_ADMIN can create

  if (
    user.userRole !== UserRole.ADMIN &&
    user.userRole !== UserRole.SUPER_ADMIN &&
    user.userRole !== UserRole.TEACHER
  ) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'You do not have permission to delete this question',
    );
  }

  const existing = await prisma.practiceModule.findFirst({
    where: { id, isDeleted: false },
  });
  if (!existing)
    throw new ApiError(StatusCodes.NOT_FOUND, 'Practice module not found');

  // Only update allowed fields; avoid courseId issue
  const data: Prisma.PracticeModuleUpdateInput = {
    title: payload.title,
    examType: payload.examType,
    moduleType: payload.moduleType,
    metadata: payload.metadata as Prisma.JsonObject | undefined,
  };

  return prisma.practiceModule.update({
    where: { id },
    data,
  });
};

const deletePracticeModule = async (
  id: string,
  user: IAuthUser,
): Promise<void> => {
  // Only ADMIN and SUPER_ADMIN can delete

  if (
    user.userRole !== UserRole.ADMIN &&
    user.userRole !== UserRole.SUPER_ADMIN
  ) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'You do not have permission to delete this question',
    );
  }

  const existing = await prisma.practiceModule.findFirst({
    where: { id, isDeleted: false },
  });
  if (!existing)
    throw new ApiError(StatusCodes.NOT_FOUND, 'Practice module not found');

  await prisma.practiceModule.update({
    where: { id },
    data: { isDeleted: true },
  });
};

export const PracticeService = {
  getPracticeModules,
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  createPracticeModule,
  updatePracticeModule,
  deletePracticeModule,
};
