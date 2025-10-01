import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { setRefreshTokenCookie } from '../../helpers/cookieHelper';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import { OtpService } from './otp.service';

const sendOtp = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  await OtpService.sendOTP(email);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'OTP sent successfully',
    data: null,
  });
});

const resendOtp = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  await OtpService.resendOTP(email);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'OTP resent successfully',
    data: null,
  });
});

const verifyOtp = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.query as { email: string };
  const { otp } = req.body as { otp: string };

  const result = await OtpService.verifyOTP(email, otp);

  setRefreshTokenCookie(res, result.refreshToken);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'OTP verified successfully',
    data: {
      accessToken: result.accessToken,
      user: result.user,
    },
  });
});

export const OTPController = {
  sendOtp,
  resendOtp,
  verifyOtp,
};
