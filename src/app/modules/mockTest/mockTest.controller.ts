import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { IAuthUser } from '../../interfaces/common';
import catchAsync from '../../shared/catchAsync';
import pick from '../../shared/pick';
import sendResponse from '../../shared/sendResponse';
import { mockTestFilterableFields } from './mockTest.constant';
import { MockTestService } from './mockTest.service';

const getAllMockTests = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IAuthUser;
  const filters = pick(req.query, mockTestFilterableFields);
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);

  const result = await MockTestService.getAllMockTests(user, filters, options);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Mock tests fetched successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getMockTestById = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IAuthUser;
  const { id } = req.params;
  const result = await MockTestService.getMockTestById(id, user);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Mock test fetched successfully',
    data: result,
  });
});

const createMockTest = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IAuthUser;
  const result = await MockTestService.createMockTest(user, req.body);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Mock test created successfully',
    data: result,
  });
});

const updateMockTest = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IAuthUser;
  const { id } = req.params;
  const result = await MockTestService.updateMockTest(id, req.body, user);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Mock test updated successfully',
    data: result,
  });
});

const deleteMockTest = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IAuthUser;
  const { id } = req.params;
  await MockTestService.deleteMockTest(id, user);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Mock test deleted successfully',
    data: null,
  });
});

export const MockTestController = {
  getAllMockTests,
  getMockTestById,
  createMockTest,
  updateMockTest,
  deleteMockTest,
};
