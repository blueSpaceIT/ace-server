import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { IAuthUser } from '../../interfaces/common';
import catchAsync from '../../shared/catchAsync';
import pick from '../../shared/pick';
import sendResponse from '../../shared/sendResponse';
import { EnrollmentService } from './enrollment.service';

const getEnrollments = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ['courseId']);
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);

  const result = await EnrollmentService.getEnrollments(filters, options);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Enrollments fetched successfully',
    meta: result.meta,
    data: result.data,
  });
});

const enroll = catchAsync(async (req: Request, res: Response) => {
  const result = await EnrollmentService.enroll(
    req.body,
    req.user as IAuthUser,
  );

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Enroll successfully',
    data: result,
  });
});

const unenroll = catchAsync(async (req: Request, res: Response) => {
  const result = await EnrollmentService.unenroll(
    req.params.id,
    req.user as IAuthUser,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Enrollment deleted successfully',
    data: result,
  });
});

export const EnrollmentController = {
  getEnrollments,
  enroll,
  unenroll,
};
