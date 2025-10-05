import { UserStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import { StatusCodes } from 'http-status-codes';
import { Secret } from 'jsonwebtoken';
import config from '../../config';
import ApiError from '../../helpers/ApiError';
import { generateAuthTokens, jwtHelpers } from '../../helpers/jwtHelpers';
import { IAuthUser } from '../../interfaces/common';
import prisma from '../../shared/prisma';
import sendEmail from '../../shared/sendEmail';

const refreshToken = async (token?: string | null) => {
  if (!token)
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Refresh token missing');

  let decoded;
  try {
    decoded = jwtHelpers.verifyToken(
      token,
      config.JWT_REFRESH_SECRET as Secret,
    );
  } catch (err) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid refresh token');
  }

  const userData = await prisma.user.findFirst({
    where: {
      email: decoded.email as string,
      status: UserStatus.ACTIVE,
    },
  });

  if (!userData) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'User not found');
  }

  const accessToken = jwtHelpers.generateToken(
    { id: userData.id, email: userData.email, userRole: userData.userRole },
    config.JWT_ACCESS_SECRET as Secret,
    config.JWT_ACCESS_EXPIRES as string,
  );

  return { accessToken };
};

const changePassword = async (
  user: IAuthUser,
  payload: { currentPassword: string; newPassword: string },
) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: user.email },
  });

  if (!existingUser || existingUser.status !== UserStatus.ACTIVE) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found or inactive');
  }

  if (!existingUser.password) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'No password set for this user',
    );
  }

  const isCurrentPasswordValid = await bcrypt.compare(
    payload.currentPassword,
    existingUser.password,
  );

  if (!isCurrentPasswordValid) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Current password is incorrect',
    );
  }

  const newHashedPassword = await bcrypt.hash(
    payload.newPassword,
    Number(config.BCRYPT_SALT_ROUND),
  );

  await prisma.user.update({
    where: { id: existingUser.id },
    data: {
      password: newHashedPassword,
    },
  });
};

const forgotPassword = async (payload: { email: string }) => {
  const user = await prisma.user.findFirst({
    where: { email: payload.email, status: UserStatus.ACTIVE },
  });

  if (!user) throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');

  const resetToken = jwtHelpers.generateToken(
    { email: user.email, id: user.id },
    config.JWT_RESET_PASS_SECRET,
    config.JWT_RESET_PASS_SECRET_EXPIRES,
  );

  const resetPassLink = `${config.FRONTEND_URL}/reset-password?token=${resetToken}`;

  const html = await sendEmail.renderTemplate('reset-password.ejs', {
    name: user.name,
    resetPassLink,
    companyName: config.COMPANY_NAME,
    frontendUrl: config.FRONTEND_URL,
    supportEmail: config.SUPPORT_EMAIL,
  });

  await sendEmail.send(user.email as string, 'Reset Your Password', html);

  return { message: 'Password reset email sent successfully' };
};

const resetPassword = async (token: string, newPassword: string) => {
  const decoded = jwtHelpers.verifyToken(
    token,
    config.JWT_RESET_PASS_SECRET,
  ) as { id: string; email: string };

  const user = await prisma.user.findUnique({ where: { id: decoded.id } });
  if (!user || user.status !== UserStatus.ACTIVE)
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');

  const hashedPassword = await bcrypt.hash(
    newPassword,
    Number(config.BCRYPT_SALT_ROUND),
  );
  await prisma.user.update({
    where: { id: decoded.id },
    data: { password: hashedPassword },
  });

  const tokens = generateAuthTokens({
    id: user.id,
    email: user.email as string,
    userRole: user.userRole,
  });

  return tokens;
};

export const AuthService = {
  refreshToken,
  changePassword,
  forgotPassword,
  resetPassword,
};
