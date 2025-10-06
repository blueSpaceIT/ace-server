import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { IAuthUser } from '../../interfaces/common';
import catchAsync from '../../shared/catchAsync';
import pick from '../../shared/pick';
import sendResponse from '../../shared/sendResponse';
import { moduleFilterableFields } from './courseModule.constant';
import { CourseModuleService } from './courseModule.service';

const createModule = catchAsync(async (req: Request, res: Response) => {
  const module = await CourseModuleService.createModule(req.body);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: `Module ${module.title} created successfully`,
    data: module,
  });
});

const getModules = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, moduleFilterableFields);
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);

  const result = await CourseModuleService.getModules(
    req.user as IAuthUser,
    filters,
    options,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Modules fetched successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getModuleById = catchAsync(async (req: Request, res: Response) => {
  const module = await CourseModuleService.getModuleById(req.params.moduleId);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: `Module ${module.title} fetched successfully`,
    data: module,
  });
});

const updateModule = catchAsync(async (req: Request, res: Response) => {
  const updated = await CourseModuleService.updateModule(
    req.params.moduleId,
    req.body,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: `Module ${updated.title} updated successfully`,
    data: null,
  });
});

const restoreModule = catchAsync(async (req: Request, res: Response) => {
  const restored = await CourseModuleService.restoreModule(req.params.moduleId);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: `Module ${restored.title} restored successfully`,
    data: null,
  });
});

const deleteModule = catchAsync(async (req: Request, res: Response) => {
  const deleted = await CourseModuleService.deleteModule(req.params.moduleId);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: `Module ${deleted.title} deleted successfully`,
    data: null,
  });
});

const hardDeleteModule = catchAsync(async (req: Request, res: Response) => {
  const deleted = await CourseModuleService.hardDeleteModule(
    req.params.moduleId,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: `Module ${deleted.title} permanently deleted successfully`,
    data: null,
  });
});

export const CourseModuleController = {
  createModule,
  getModules,
  getModuleById,
  updateModule,
  restoreModule,
  deleteModule,
  hardDeleteModule,
};
