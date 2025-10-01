import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import config from '../../config';
import {
  clearRefreshTokenCookie,
  setRefreshTokenCookie,
} from '../../helpers/cookieHelper';
import { generateAuthTokens } from '../../helpers/jwtHelpers';
import { IAuthUser } from '../../interfaces/common';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import { AuthService } from './auth.service';

const credentialsLogin = async (
  _req: Request,
  res: Response,
  next: NextFunction,
  user: any,
) => {
  try {
    const tokens = generateAuthTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    setRefreshTokenCookie(res, tokens.refreshToken);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Logged in successfully!',
      data: {
        accessToken: tokens.accessToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          picture: user.picture,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const googleCallback = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  const tokens = generateAuthTokens({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  setRefreshTokenCookie(res, tokens.refreshToken);

  const state = (req.query.state as string) || '/';
  const userData = encodeURIComponent(
    JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      picture: user.picture,
    }),
  );

  res.redirect(
    `${config.FRONTEND_URL}${state}?accessToken=${tokens.accessToken}&userData=${userData}`,
  );
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;
  const result = await AuthService.refreshToken(token);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Access token generated successfully!',
    data: result,
  });
});

const changePassword = catchAsync(async (req: Request, res: Response) => {
  await AuthService.changePassword(req.user as IAuthUser, req.body);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Password changed successfully!',
    data: null,
  });
});

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  await AuthService.forgotPassword(req.body);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Password reset email sent successfully!',
    data: null,
  });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const { token } = req.query as { token: string };
  const { password } = req.body;

  const result = await AuthService.resetPassword(token, password);

  setRefreshTokenCookie(res, result.refreshToken);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Password reset successfully and logged in!',
    data: {
      accessToken: result.accessToken,
    },
  });
});

const logoutUser = catchAsync(async (_req: Request, res: Response) => {
  clearRefreshTokenCookie(res);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Logged out successfully!',
    data: null,
  });
});

export const AuthController = {
  credentialsLogin,
  googleCallback,
  refreshToken,
  changePassword,
  forgotPassword,
  resetPassword,
  logoutUser,
};
