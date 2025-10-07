import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { IAuthUser } from '../../interfaces/common';
import catchAsync from '../../shared/catchAsync';
import pick from '../../shared/pick';
import sendResponse from '../../shared/sendResponse';
import { practiceFilterableFields } from './practice.constant';
import { PracticeService } from './practice.service';

const getPracticeModules = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IAuthUser;
  const filters = pick(req.query, practiceFilterableFields);
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);

  const result = await PracticeService.getPracticeModules(
    user,
    filters,
    options,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Practice modules fetched successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getQuestions = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IAuthUser;
  const filters = pick(req.query, practiceFilterableFields);
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);

  const result = await PracticeService.getQuestions(user, filters, options);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Questions fetched successfully',
    meta: result.meta,
    data: result.data,
  });
});

const createQuestion = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IAuthUser;
  const files = req.files as
    | { [key: string]: Express.Multer.File[] }
    | undefined;
  const result = await PracticeService.createQuestion(user, req.body, files);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Question created successfully',
    data: result,
  });
});

const updateQuestion = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IAuthUser;
  const files = req.files as
    | { [key: string]: Express.Multer.File[] }
    | undefined;
  const result = await PracticeService.updateQuestion(
    req.params.id,
    req.body,
    files,
    user,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Question updated successfully',
    data: result,
  });
});

const deleteQuestion = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IAuthUser;
  await PracticeService.deleteQuestion(req.params.id, user);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Question deleted successfully',
    data: null,
  });
});

const createPracticeModule = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IAuthUser;
  const result = await PracticeService.createPracticeModule(user, req.body);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Practice module created successfully',
    data: result,
  });
});

const updatePracticeModule = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IAuthUser;
  const result = await PracticeService.updatePracticeModule(
    req.params.id,
    req.body,
    user,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Practice module updated successfully',
    data: result,
  });
});

const deletePracticeModule = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IAuthUser;
  await PracticeService.deletePracticeModule(req.params.id, user);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Practice module deleted successfully',
    data: null,
  });
});

export const PracticeController = {
  getPracticeModules,
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  createPracticeModule,
  updatePracticeModule,
  deletePracticeModule,
};
