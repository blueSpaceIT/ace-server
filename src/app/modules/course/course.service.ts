import { Course, Prisma } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import slugify from 'slugify';
import ApiError from '../../helpers/ApiError';
import { paginationHelper } from '../../helpers/paginationHelper';
import { IAuthUser } from '../../interfaces/common';
import { IFile } from '../../interfaces/file';
import { IPaginationOptions } from '../../interfaces/pagination';
import prisma from '../../shared/prisma';

const createCourse = async (user: IAuthUser, payload: any, file?: IFile) => {
  const slug = slugify(payload.title, { lower: true, strict: true });

  let thumbnailUrl: string | undefined;
  if (file) {
    thumbnailUrl = file.path;
  }

  return prisma.course.create({
    data: {
      ...payload,
      slug,
      thumbnail: thumbnailUrl,
      createdById: user.id,
    },
  });
};

const getAllCourses = async (
  user: IAuthUser | null,
  params: Record<string, unknown>,
  options: IPaginationOptions,
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const { searchTerm, ...filterData } = params;

  const andConditions: Prisma.CourseWhereInput[] = [];

  // 🔍 Global search
  if (searchTerm) {
    andConditions.push({
      OR: ['title', 'description'].map((field) => ({
        [field]: { contains: String(searchTerm), mode: 'insensitive' },
      })),
    });
  }

  // 🎯 Exact filters
  if (Object.keys(filterData).length) {
    andConditions.push({
      AND: Object.entries(filterData).map(([key, value]) => ({
        [key]: { equals: value },
      })),
    });
  }

  // 👀 Visibility rules: Non-admins only see visible courses
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    andConditions.push({ visibility: true });
  }

  const whereConditions: Prisma.CourseWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const [courses, total] = await prisma.$transaction([
    prisma.course.findMany({
      where: whereConditions,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        title: true,
        slug: true,
        price: true,
        thumbnail: true,
        visibility: true,
        featured: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.course.count({ where: whereConditions }),
  ]);

  return {
    meta: { page, limit, total },
    data: courses,
  };
};

const getCourseBySlug = async (slug: string) => {
  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          picture: true,
        },
      },
    },
  });

  if (!course || course.isDeleted || course.visibility === false) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Course not found');
  }

  return course;
};

const updateCourse = async (
  id: string,
  payload: Partial<Course>,
  file?: IFile,
) => {
  const course = await prisma.course.findUnique({
    where: { id },
    select: { id: true, isDeleted: true },
  });

  if (!course || course.isDeleted) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Course not found');
  }

  const updateData: Prisma.CourseUpdateInput = {};

  if (payload.title) {
    updateData.title = payload.title;
    updateData.slug = slugify(payload.title, { lower: true, strict: true });
  }
  if (payload.description !== undefined)
    updateData.description = payload.description;
  if (payload.price !== undefined) updateData.price = payload.price;
  if (payload.metadata !== undefined)
    updateData.metadata = payload.metadata as Prisma.InputJsonValue;
  if (file) updateData.thumbnail = file.path;

  const updatedCourse = await prisma.course.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      price: true,
      thumbnail: true,
      visibility: true,
      featured: true,
      metadata: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updatedCourse;
};

const toggleCourseVisibility = async (
  id: string,
): Promise<{ title: string; visibility: boolean }> => {
  const course = await prisma.course.findUnique({
    where: { id },
    select: { id: true, title: true, visibility: true, isDeleted: true },
  });

  if (!course) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Course not found');
  }

  if (course.isDeleted) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Deleted course cannot be updated',
    );
  }

  const updated = await prisma.course.update({
    where: { id },
    data: { visibility: !course.visibility },
    select: { title: true, visibility: true },
  });

  return updated;
};

const toggleCourseFeatured = async (
  id: string,
): Promise<{ title: string; featured: boolean }> => {
  const course = await prisma.course.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      featured: true,
      visibility: true,
      isDeleted: true,
    },
  });

  if (!course) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Course not found');
  }

  if (course.isDeleted) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Deleted course cannot be updated',
    );
  }

  if (!course.visibility) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Only visible courses can be marked as featured',
    );
  }

  const updated = await prisma.course.update({
    where: { id },
    data: { featured: !course.featured },
    select: { title: true, featured: true },
  });

  return updated;
};

const restoreCourse = async (id: string): Promise<{ title: string }> => {
  const course = await prisma.course.findUnique({
    where: { id },
    select: { id: true, title: true, isDeleted: true },
  });
  if (!course || !course.isDeleted)
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Course not found or already active',
    );

  const restored = await prisma.course.update({
    where: { id },
    data: { isDeleted: false },
    select: { title: true },
  });

  return restored;
};

const deleteCourse = async (id: string): Promise<{ title: string }> => {
  const course = await prisma.course.findUnique({
    where: { id },
    select: { id: true, title: true, isDeleted: true },
  });
  if (!course || course.isDeleted)
    throw new ApiError(StatusCodes.NOT_FOUND, 'Course not found');

  const deleted = await prisma.course.update({
    where: { id },
    data: { isDeleted: true },
    select: { title: true },
  });

  return deleted;
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
