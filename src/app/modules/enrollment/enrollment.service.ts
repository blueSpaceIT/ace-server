import { Prisma, UserRole } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import ApiError from '../../helpers/ApiError';
import { paginationHelper } from '../../helpers/paginationHelper';
import { IAuthUser } from '../../interfaces/common';
import { IPaginationOptions } from '../../interfaces/pagination';
import prisma from '../../shared/prisma';

const getEnrollments = async (
  user: IAuthUser,
  filters: Record<string, unknown>,
  options: IPaginationOptions,
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);
  const { courseId, studentId, ...filterData } = filters;

  const andConditions: Prisma.EnrollmentWhereInput[] = [];

  // Exclude deleted
  andConditions.push({ isDeleted: false });

  // Student filter: Own enrollments only - Fetch student ID first
  let currentStudentId: string | undefined;
  if (user.userRole === UserRole.STUDENT) {
    const student = await prisma.student.findUnique({
      where: { userId: user.id },
    });
    if (!student)
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Student profile not found');
    currentStudentId = student.id;
    andConditions.push({ studentId: currentStudentId });
  }

  // Filters
  if (courseId) {
    andConditions.push({ courseId: courseId as string });
  }
  if (
    studentId &&
    (user.userRole === UserRole.ADMIN || user.userRole === UserRole.SUPER_ADMIN)
  ) {
    andConditions.push({ studentId: studentId as string });
  }
  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.entries(filterData).map(([key, value]) => ({
        [key]: { equals: value },
      })),
    });
  }

  const whereConditions: Prisma.EnrollmentWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : { isDeleted: false };

  const includeData = {
    student: {
      include: { user: { select: { id: true, name: true, email: true } } },
    },
    course: {
      select: {
        id: true,
        title: true,
        slug: true,
        price: true,
        thumbnail: true,
        visibility: true,
        featured: true,
        examType: true,
        organization: { select: { id: true, name: true } },
      },
    },
  };

  const [enrollments, total] = await prisma.$transaction([
    prisma.enrollment.findMany({
      where: whereConditions,
      include: includeData,
      skip,
      take: limit,
      orderBy: { [sortBy as string]: sortOrder },
    }),
    prisma.enrollment.count({ where: whereConditions }),
  ]);

  return { meta: { page, limit, total }, data: enrollments };
};

const enroll = async (user: IAuthUser, payload: { courseId: string }) => {
  // Get student ID
  const student = await prisma.student.findUnique({
    where: { userId: user.id },
  });
  if (!student) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Student profile not found');
  }

  // Check course exists, visible, not deleted
  const course = await prisma.course.findUnique({
    where: { id: payload.courseId, isDeleted: false },
  });

  if (!course) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Course not found');
  }

  if (
    !course.visibility &&
    user.userRole !== UserRole.SUPER_ADMIN &&
    user.userRole !== UserRole.ADMIN
  ) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Course is not visible');
  }

  // Check if already enrolled
  const existing = await prisma.enrollment.findUnique({
    where: {
      studentId_courseId: { studentId: student.id, courseId: payload.courseId },
    },
  });

  if (existing && !existing.isDeleted) {
    throw new ApiError(StatusCodes.CONFLICT, 'Already enrolled in this course');
  }

  // Restore if soft deleted, or create new
  if (existing) {
    const restored = await prisma.enrollment.update({
      where: { id: existing.id },
      data: { isDeleted: false },
      include: {
        student: { select: { id: true } },
        course: { select: { id: true, title: true } },
      },
    });
    return restored;
  }

  const enrollment = await prisma.enrollment.create({
    data: {
      studentId: student.id,
      courseId: payload.courseId,
    },
    include: {
      student: { select: { id: true } },
      course: { select: { id: true, title: true } },
    },
  });

  return enrollment;
};

const unenroll = async (id: string, user: IAuthUser) => {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id, isDeleted: false },
    include: {
      student: { select: { id: true } },
    },
  });

  if (!enrollment) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Enrollment not found');
  }

  // Student can only unenroll own
  if (user.userRole === UserRole.STUDENT && enrollment.studentId !== user.id) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'Can only unenroll own enrollment',
    );
  }

  // Admin check
  if (
    user.userRole === UserRole.ADMIN ||
    user.userRole === UserRole.SUPER_ADMIN
  ) {
    const admin = await prisma.admin.findUnique({ where: { userId: user.id } });
    if (!admin)
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Admin profile not found');
    const userWithOrg = await prisma.user.findUnique({
      where: { id: user.id },
      select: { organizationId: true },
    });
    const course = await prisma.course.findUnique({
      where: { id: enrollment.courseId },
      select: { organizationId: true },
    });
    if (
      course?.organizationId &&
      userWithOrg?.organizationId !== course.organizationId &&
      user.userRole !== UserRole.SUPER_ADMIN
    ) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        'Can only unenroll in own organization',
      );
    }
  }

  const updated = await prisma.enrollment.update({
    where: { id },
    data: { isDeleted: true },
  });

  return updated;
};

export const EnrollmentService = {
  getEnrollments,
  enroll,
  unenroll,
};
