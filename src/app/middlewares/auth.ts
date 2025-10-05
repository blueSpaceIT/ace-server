import { UserRole, UserStatus } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Secret } from 'jsonwebtoken';
import config from '../config';
import ApiError from '../helpers/ApiError';
import { jwtHelpers } from '../helpers/jwtHelpers';
import { IAuthUser } from '../interfaces/common';
import prisma from '../shared/prisma';

export const auth =
  (...requiredRoles: UserRole[]) =>
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      // Get authorization token
      const token = req.headers.authorization;
      if (!token) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized');
      }

      // Extract the token from Bearer format
      const tokenParts = token.split(' ');
      const actualToken = tokenParts[1] || token;

      // Verify token
      const verifiedUser = jwtHelpers.verifyToken(
        actualToken,
        config.JWT_ACCESS_SECRET as Secret,
      ) as IAuthUser;

      // Check if user exists and has ACTIVE status
      const user = await prisma.user.findUnique({
        where: { id: verifiedUser.id },
        include: { student: true, teacher: true, admin: true },
      });

      if (!user) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
      }

      if (user.status !== UserStatus.ACTIVE) {
        if (user.status === UserStatus.PENDING) {
          throw new ApiError(
            StatusCodes.FORBIDDEN,
            'Account not verified. Please verify your email with the OTP sent or request a new OTP at /api/v1/otp/resend.',
          );
        } else {
          throw new ApiError(
            StatusCodes.FORBIDDEN,
            `User is ${user.status}. Only ACTIVE accounts can login. Please contact support.`,
          );
        }
      }

      // Check if user has required role
      if (
        requiredRoles.length &&
        !requiredRoles.includes(verifiedUser.userRole)
      ) {
        throw new ApiError(StatusCodes.FORBIDDEN, 'Forbidden');
      }

      // Set user in request object with profile
      req.user = { ...verifiedUser, profile: user };
      next();
    } catch (error) {
      next(error);
    }
  };
