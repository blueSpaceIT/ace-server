import { Course, Prisma, UserRole } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import slugify from 'slugify';
import ApiError from '../../helpers/ApiError';
import { paginationHelper } from '../../helpers/paginationHelper';
import { IAuthUser } from '../../interfaces/common';
import { IFile } from '../../interfaces/file';
import { IPaginationOptions } from '../../interfaces/pagination';
import prisma from '../../shared/prisma';
import { CreateCourseInput } from './course.interface';

const createCourse = async (
  user: IAuthUser,
  payload: CreateCourseInput,
  file?: IFile,
): Promise<Course> => {
  const slug = slugify(payload.title, { lower: true, strict: true });

  // Check for duplicate slug
  const existingCourse = await prisma.course.findUnique({ where: { slug } });
  if (existingCourse) {
    throw new ApiError(
      StatusCodes.CONFLICT,
      'A course with this title already exists',
    );
  }

  // Handle thumbnail
  let thumbnailUrl: string | undefined;
  if (file) {
    thumbnailUrl = file.path;
  }

  // Determine creator type
  let adminId: string | undefined;
  let teacherId: string | undefined;

  if (
    user.userRole === UserRole.ADMIN ||
    user.userRole === UserRole.SUPER_ADMIN
  ) {
    const admin = await prisma.admin.findUnique({ where: { userId: user.id } });
    if (!admin)
      throw new ApiError(StatusCodes.FORBIDDEN, 'Admin profile not found');
    adminId = admin.id;
  } else if (user.userRole === UserRole.TEACHER) {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id },
    });
    if (!teacher)
      throw new ApiError(StatusCodes.FORBIDDEN, 'Teacher profile not found');
    teacherId = teacher.id;
  } else {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'Only Admins or Teachers can create courses',
    );
  }

  // Create course
  const course = await prisma.course.create({
    data: {
      organizationId: payload.organizationId || null,
      title: payload.title,
      slug,
      description: payload.description,
      price: payload.price ?? 0,
      examType: payload.examType,
      thumbnail: thumbnailUrl,
      metadata: payload.metadata as Prisma.InputJsonValue | undefined,
      adminId,
      teacherId,
      visibility: payload.visibility ?? false,
      featured: payload.featured ?? false,
    },
    include: {
      organization: { select: { id: true, name: true } },
      teacher: {
        select: { id: true, user: { select: { id: true, name: true } } },
      },
      admin: {
        select: { id: true, user: { select: { id: true, name: true } } },
      },
    },
  });

  return course;
};

const updateCourse = async (
  id: string,
  payload: Partial<Course>,
  file?: IFile,
): Promise<Course> => {
  const existingCourse = await prisma.course.findUnique({ where: { id } });

  if (!existingCourse || existingCourse.isDeleted) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Course not found or deleted');
  }

  const updateData: Prisma.CourseUpdateInput = {};

  // Update slug if title changes (and slug is not provided)
  if (payload.title) {
    const newSlug = slugify(payload.title, { lower: true, strict: true });
    const duplicateSlug = await prisma.course.findFirst({
      where: { slug: newSlug, id: { not: id } },
    });
    if (duplicateSlug) {
      throw new ApiError(
        StatusCodes.CONFLICT,
        'Another course with the same title already exists',
      );
    }
    updateData.title = payload.title;
    updateData.slug = newSlug;
  }

  // Other updatable fields
  if (payload.description !== undefined)
    updateData.description = payload.description;
  if (payload.price !== undefined) updateData.price = payload.price;
  if (payload.examType !== undefined) updateData.examType = payload.examType;
  if (payload.metadata !== undefined)
    updateData.metadata = payload.metadata as Prisma.InputJsonValue;
  if (payload.organizationId !== undefined) {
    if (payload.organizationId) {
      updateData.organization = { connect: { id: payload.organizationId } };
    } else {
      updateData.organization = { disconnect: true };
    }
  }
  if (file) updateData.thumbnail = file.path;

  const updatedCourse = await prisma.course.update({
    where: { id },
    data: updateData,
    include: {
      organization: { select: { id: true, name: true } },
      teacher: {
        select: { id: true, user: { select: { id: true, name: true } } },
      },
      admin: {
        select: { id: true, user: { select: { id: true, name: true } } },
      },
    },
  });

  return updatedCourse;
};

const getAllCourses = async (
  user: IAuthUser | null,
  params: Record<string, unknown>,
  options: IPaginationOptions,
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const { searchTerm, minPrice, maxPrice, ...filterData } = params;

  const andConditions: Prisma.CourseWhereInput[] = [];

  //  Global search
  if (searchTerm) {
    andConditions.push({
      OR: ['title', 'description'].map((field) => ({
        [field]: { contains: String(searchTerm), mode: 'insensitive' },
      })),
    });
  }

  //  Exact filters
  if (Object.keys(filterData).length) {
    andConditions.push({
      AND: Object.entries(filterData).map(([key, value]) => ({
        [key]: { equals: value },
      })),
    });
  }

  // Visibility: Non-admins only see visible & not deleted courses
  if (!user || (user.userRole !== 'ADMIN' && user.userRole !== 'SUPER_ADMIN')) {
    andConditions.push({ visibility: true, isDeleted: false });
  } else {
    // Admins can see all courses including deleted
    andConditions.push({ isDeleted: false });
  }

  const whereConditions: Prisma.CourseWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const [courses, total] = await prisma.$transaction([
    prisma.course.findMany({
      where: whereConditions,
      skip,
      take: limit,
      orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      include: {
        organization: { select: { id: true, name: true, slug: true } },
        teacher: {
          include: {
            user: { select: { id: true, name: true, picture: true } },
          },
        },
        admin: {
          include: {
            user: { select: { id: true, name: true, picture: true } },
          },
        },
      },
    }),
    prisma.course.count({ where: whereConditions }),
  ]);

  return {
    meta: { page, limit, total },
    data: courses,
  };
};

const getCourseBySlug = async (slug: string, user?: IAuthUser) => {
  const whereClause: Prisma.CourseWhereInput = { slug, isDeleted: false };

  const includeEnrollments =
    user && user.userRole === UserRole.STUDENT
      ? { where: { student: { userId: user.id } } }
      : undefined;

  const course = await prisma.course.findFirst({
    where: whereClause,
    include: {
      modules: { orderBy: { order: 'asc' } },
      organization: { select: { id: true, name: true, slug: true } },
      teacher: {
        include: { user: { select: { id: true, name: true, picture: true } } },
      },
      admin: {
        include: { user: { select: { id: true, name: true, picture: true } } },
      },
      enrollments: includeEnrollments,
    },
  });

  if (!course) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Course not found');
  }

  return course;
};

const toggleCourseVisibility = async (
  id: string,
  user: IAuthUser,
): Promise<Pick<Course, 'id' | 'title' | 'visibility'>> => {
  const course = await prisma.course.findUnique({
    where: { id, isDeleted: false },
  });
  if (!course) throw new ApiError(StatusCodes.NOT_FOUND, 'Course not found');

  // Only teachers can modify their own courses
  if (user.userRole === UserRole.TEACHER && course.teacherId !== user.id) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'You can only modify your own courses',
    );
  }

  return prisma.course.update({
    where: { id },
    data: { visibility: !course.visibility },
    select: { id: true, title: true, visibility: true },
  });
};

const toggleCourseFeatured = async (
  id: string,
  user: IAuthUser,
): Promise<Pick<Course, 'id' | 'title' | 'featured'>> => {
  const course = await prisma.course.findUnique({
    where: { id, isDeleted: false },
  });
  if (!course) throw new ApiError(StatusCodes.NOT_FOUND, 'Course not found');
  if (!course.visibility)
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Only visible courses can be featured',
    );

  // Only teachers can modify their own courses
  if (user.userRole === UserRole.TEACHER && course.teacherId !== user.id) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'You can only modify your own courses',
    );
  }

  return prisma.course.update({
    where: { id },
    data: { featured: !course.featured },
    select: { id: true, title: true, featured: true },
  });
};

const restoreCourse = async (
  id: string,
  user: IAuthUser,
): Promise<Pick<Course, 'id' | 'title'>> => {
  const course = await prisma.course.findUnique({ where: { id } });
  if (!course || !course.isDeleted)
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Course not found or already active',
    );

  if (
    !(
      user.userRole === UserRole.ADMIN || user.userRole === UserRole.SUPER_ADMIN
    )
  ) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'Only admins can restore courses',
    );
  }

  return prisma.course.update({
    where: { id },
    data: { isDeleted: false },
    select: { id: true, title: true },
  });
};

const deleteCourse = async (id: string, user: IAuthUser): Promise<void> => {
  const course = await prisma.course.findUnique({
    where: { id, isDeleted: false },
  });
  if (!course) throw new ApiError(StatusCodes.NOT_FOUND, 'Course not found');

  if (
    !(
      user.userRole === UserRole.ADMIN || user.userRole === UserRole.SUPER_ADMIN
    )
  ) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Only admins can delete courses');
  }

  await prisma.course.update({
    where: { id },
    data: { isDeleted: true },
  });
};

export const CourseService = {
  createCourse,
  getAllCourses,
  getCourseBySlug,
  updateCourse,
  toggleCourseVisibility,
  toggleCourseFeatured,
  restoreCourse,
  deleteCourse,
};
