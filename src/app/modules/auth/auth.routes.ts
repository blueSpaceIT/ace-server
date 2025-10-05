import { UserRole } from '@prisma/client';
import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import passport from 'passport';
import config from '../../config';
import ApiError from '../../helpers/ApiError';
import { auth } from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { AuthController } from './auth.controller';
import { AuthValidation } from './auth.validation';

const router = Router();

router.post(
  '/login',
  validateRequest(AuthValidation.loginSchema),
  (req, res, next) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return next(
          new ApiError(
            StatusCodes.UNAUTHORIZED,
            info?.message || 'Authentication failed',
          ),
        );
      }
      return AuthController.credentialsLogin(req, res, next, user);
    })(req, res, next);
  },
);

router.get('/google', (req, res, next) => {
  const redirect = req.query.redirect || '/';
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    state: redirect as string,
    prompt: 'select_account',
  })(req, res, next);
});

router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${config.FRONTEND_URL}/login?error=Authentication failed`,
    session: true,
  }),
  AuthController.googleCallback,
);

router.post(
  '/refresh-token',
  validateRequest(AuthValidation.refreshSchema),
  AuthController.refreshToken,
);

router.post(
  '/change-password',
  auth(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.STUDENT,
    UserRole.TEACHER,
  ),
  validateRequest(AuthValidation.changePasswordSchema),
  AuthController.changePassword,
);

router.post(
  '/forgot-password',
  validateRequest(AuthValidation.forgotPasswordSchema),
  AuthController.forgotPassword,
);

router.post(
  '/reset-password',
  validateRequest(AuthValidation.resetPasswordSchema),
  AuthController.resetPassword,
);

router.post('/logout', AuthController.logoutUser);

export const AuthRoutes = router;
