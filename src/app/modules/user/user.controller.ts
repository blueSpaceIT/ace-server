import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { IAuthUser } from '../../interfaces/common';
import catchAsync from '../../shared/catchAsync';
import pick from '../../shared/pick';
import sendResponse from '../../shared/sendResponse';
import { userFilterableFields } from './user.constant';
import { UserService } from './user.service';

const createAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.createAdmin(req.body);

  // Check if this was a new user or an existing PENDING user
  const isExistingUser =
    result.createdAt &&
    new Date(result.createdAt).getTime() < Date.now() - 60000;

  sendResponse(res, {
    statusCode: isExistingUser ? StatusCodes.OK : StatusCodes.CREATED,
    success: true,
    message: isExistingUser
      ? 'Found existing unverified account. A new OTP has been sent to your email.'
      : 'Admin created successfully! Please verify your email with the OTP sent.',
    data: result,
  });
});

const createUser = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.createUser(req.body);

  // Check if this was a new user or an existing PENDING user
  const isExistingUser =
    result.createdAt &&
    new Date(result.createdAt).getTime() < Date.now() - 60000;

  sendResponse(res, {
    statusCode: isExistingUser ? StatusCodes.OK : StatusCodes.CREATED,
    success: true,
    message: isExistingUser
      ? 'Found existing unverified account. A new OTP has been sent to your email.'
      : 'Student Profile created successfully! Please verify your email with the OTP sent.',
    data: result,
  });
});

const updateProfile = catchAsync(async (req: Request, res: Response) => {
  await UserService.updateProfile(req.user as IAuthUser, req.body, req.file);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Profile updated successfully',
    data: null,
  });
});

const updateUserStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const updatedUser = await UserService.updateUserStatus(id, status);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: `Status of user ${updatedUser.name} updated to ${updatedUser.status} successfully`,
    data: null,
  });
});

const deleteUser = catchAsync(async (req, res) => {
  const { id } = req.params;

  const deletedUser = await UserService.deleteUser(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: `User ${deletedUser.name} deleted successfully`,
    data: null,
  });
});

const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const profile = await UserService.getMyProfile(req.user as IAuthUser);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Profile fetched successfully',
    data: profile,
  });
});

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, userFilterableFields);
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);

  const result = await UserService.getAllUsers(filters, options);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Users fetched successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const UserController = {
  createAdmin,
  createUser,
  updateProfile,
  updateUserStatus,
  deleteUser,
  getMyProfile,
  getAllUsers,
};
