import { StatusCodes } from 'http-status-codes';
import { redisClient } from '../../config/redis.config';
import ApiError from '../../helpers/ApiError';
import { generateAuthTokens } from '../../helpers/jwtHelpers';
import prisma from '../../shared/prisma';
import sendEmail from '../../shared/sendEmail';
import { OTP_EXPIRATION } from './otp.interface';
import { buildOtpKey, generateOtp, renderOtpEmail } from './otp.utils';

const sendOTP = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  if (user.status === 'ACTIVE') {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'User is already verified');
  }

  const otp = generateOtp();
  const key = buildOtpKey(email);

  // Check if an OTP already exists and delete it before setting a new one
  const existingOtp = await redisClient.get(key);
  if (existingOtp) {
    await redisClient.del(key);
  }
  
  await redisClient.set(key, otp, { EX: OTP_EXPIRATION });

  const html = await renderOtpEmail(user.name, otp);
  await sendEmail.send(email, 'Verify your account', html);

  return { message: 'OTP sent successfully' };
};

const resendOTP = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');

  // Only allow resend if user is still pending
  if (user.status !== 'PENDING') {
    if (user.status === 'ACTIVE') {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'User is already verified');
    }
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `User status is ${user.status}`,
    );
  }

  const otp = generateOtp();
  const key = buildOtpKey(email);

  // Always delete the existing OTP before setting a new one
  await redisClient.del(key);
  await redisClient.set(key, otp, { EX: OTP_EXPIRATION });

  const html = await renderOtpEmail(user.name, otp);
  await sendEmail.send(email, 'Verify your account', html);

  return { message: 'OTP resent successfully' };
};

const verifyOTP = async (email: string, otp: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  if (user.status === 'ACTIVE') {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'User is already verified');
  }

  const key = buildOtpKey(email);
  const savedOtp = await redisClient.get(key);
  if (!savedOtp || savedOtp !== otp) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid or expired OTP');
  }

  const updatedUser = await prisma.user.update({
    where: { email },
    data: { status: 'ACTIVE' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  await redisClient.del(key);

  const tokens = generateAuthTokens({
    id: updatedUser.id,
    email: updatedUser.email,
    role: updatedUser.role,
  });

  return { user: updatedUser, ...tokens };
};

export const OtpService = { sendOTP, resendOTP, verifyOTP };
