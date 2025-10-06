import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { IAuthUser } from '../../interfaces/common';
import catchAsync from '../../shared/catchAsync';
import pick from '../../shared/pick';
import sendResponse from '../../shared/sendResponse';
import { courseFilterableFields } from './course.constant';
import { CourseService } from './course.service';

const createCourse = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IAuthUser;
  const result = await CourseService.createCourse(user, req.body, req.file);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Course created successfully',
    data: result,
  });
});

const updateCourse = catchAsync(async (req: Request, res: Response) => {
  const result = await CourseService.updateCourse(
    req.params.id,
    req.body,
    req.file,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Course updated successfully',
    data: result,
  });
});

const getAllCourses = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, courseFilterableFields);
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
  console.log(req.query);
  const result = await CourseService.getAllCourses(
    req.user as IAuthUser,
    filters,
    options,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Courses fetched successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getCourseBySlug = catchAsync(async (req: Request, res: Response) => {
  const result = await CourseService.getCourseBySlug(
    req.params.slug,
    req.user as IAuthUser,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Course fetched successfully',
    data: result,
  });
});

const toggleCourseVisibility = catchAsync(
  async (req: Request, res: Response) => {
    const updatedCourse = await CourseService.toggleCourseVisibility(
      req.params.id,
      req.user as IAuthUser,
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: `Course ${updatedCourse.title} is now ${
        updatedCourse.visibility ? 'Published' : 'Unpublished'
      }.`,
      data: null,
    });
  },
);

const toggleCourseFeatured = catchAsync(async (req: Request, res: Response) => {
  const updatedCourse = await CourseService.toggleCourseFeatured(
    req.params.id,
    req.user as IAuthUser,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: `Course ${updatedCourse.title} is now ${
      updatedCourse.featured ? 'marked as Featured' : 'no longer Featured'
    }.`,
    data: null,
  });
});

const restoreCourse = catchAsync(async (req: Request, res: Response) => {
  const restoredCourse = await CourseService.restoreCourse(
    req.params.id,
    req.user as IAuthUser,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: `Course ${restoredCourse.title} has been successfully restored.`,
    data: null,
  });
});

const deleteCourse = catchAsync(async (req: Request, res: Response) => {
  await CourseService.deleteCourse(req.params.id, req.user as IAuthUser);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Course deleted successfully and is no longer available.',
    data: null,
  });
});

export const CourseController = {
  createCourse,
  getAllCourses,
  getCourseBySlug,
  updateCourse,
  toggleCourseVisibility,
  toggleCourseFeatured,
  restoreCourse,
  deleteCourse,
};
