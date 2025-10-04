import { Prisma } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import ApiError from '../../helpers/ApiError';
import { paginationHelper } from '../../helpers/paginationHelper';
import { IAuthUser } from '../../interfaces/common';
import { IPaginationOptions } from '../../interfaces/pagination';
import prisma from '../../shared/prisma';

const getEnrollments = async (
  filters: Record<string, unknown>,
  options: IPaginationOptions,
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const { courseId, ...filterData } = filters;
  const andConditions: Prisma.enrollmentWhereInput[] = [];

  // Only not deleted enrollments
  andConditions.push({ isDeleted: false });

  // Exact filters
  if (courseId) {
    andConditions.push({ courseId: String(courseId) });
  }

  if (Object.keys(filterData).length) {
    andConditions.push({
      AND: Object.entries(filterData).map(([key, value]) => ({
        [key]: { equals: value },
      })),
    });
  }

  const whereConditions: Prisma.enrollmentWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const [enrollments, total] = await prisma.$transaction([
    prisma.enrollment.findMany({
      where: whereConditions,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        userId: true,
        courseId: true,
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            price: true,
            thumbnail: true,
            visibility: true,
            featured: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.enrollment.count({ where: whereConditions }),
  ]);

  return { meta: { page, limit, total }, data: enrollments };
};

const enroll = async (payload: { courseId: string }, user: IAuthUser) => {
  // Check if course exists, is not deleted, and visible
  const course = await prisma.course.findUnique({
    where: { id: payload.courseId },
    select: { id: true, isDeleted: true, visibility: true },
  });

  if (!course || course.isDeleted) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Course not found or deleted');
  }

  if (!course.visibility) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Course is not visible');
  }

  // Check if user is already enrolled
  const enrollmentExists = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: { userId: user.id, courseId: payload.courseId },
    },
  });

  if (enrollmentExists) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'User is already enrolled in this course',
    );
  }

  return prisma.enrollment.create({
    data: { userId: user.id, courseId: payload.courseId },
    select: {
      id: true,
      userId: true,
      courseId: true,
      createdAt: true,
    },
  });
};

const unenroll = async (id: string, user: IAuthUser) => {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });

  if (!enrollment || enrollment.userId !== user.id) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Enrollment not found');
  }

  return prisma.enrollment.update({
    where: { id },
    data: { isDeleted: true },
  });
};

export const EnrollmentService = {
  getEnrollments,
  enroll,
  unenroll,
};
