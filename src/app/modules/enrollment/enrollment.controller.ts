import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { IAuthUser } from '../../interfaces/common';
import catchAsync from '../../shared/catchAsync';
import pick from '../../shared/pick';
import sendResponse from '../../shared/sendResponse';
import { enrollmentFilterableFields } from './enrollment.constant';
import { EnrollmentService } from './enrollment.service';

const getEnrollments = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IAuthUser;
  const filters = pick(req.query, enrollmentFilterableFields);
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);

  const result = await EnrollmentService.getEnrollments(user, filters, options);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Enrollments fetched successfully',
    meta: result.meta,
    data: result.data,
  });
});

const enroll = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IAuthUser;
  const result = await EnrollmentService.enroll(user, req.body);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Enrollment successful',
    data: result,
  });
});

const unenroll = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IAuthUser;
  const result = await EnrollmentService.unenroll(req.params.id, user);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Unenrolled successfully',
    data: result,
  });
});

export const EnrollmentController = {
  getEnrollments,
  enroll,
  unenroll,
};
