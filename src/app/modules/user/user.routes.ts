import { UserRole } from '@prisma/client';
import { Router } from 'express';
import { multerUpload } from '../../config/multer.config';
import { auth } from '../../middlewares/auth';
import { parseBody } from '../../middlewares/bodyParser';
import validateRequest from '../../middlewares/validateRequest';
import { UserController } from './user.controller';
import { UserValidation } from './user.validation';

const router = Router();

router.post(
  '/create-student',
  validateRequest(UserValidation.createUserValidationSchema),
  UserController.createUser,
);

// ! Super Admin only routes
router.post(
  '/create-admin',
  auth(UserRole.SUPER_ADMIN),
  validateRequest(UserValidation.createUserValidationSchema),
  UserController.createAdmin,
);

router.get(
  '/me',
  auth(UserRole.STUDENT, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  UserController.getMyProfile,
);

router.patch(
  '/me',
  auth(UserRole.STUDENT, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  multerUpload.single('picture'),
  parseBody,
  validateRequest(UserValidation.updateProfileValidationSchema),
  UserController.updateProfile,
);


router.patch(
  '/:id',
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(UserValidation.updateUserStatusValidationSchema),
  UserController.updateUserStatus,
);

router.delete(
  '/:id',
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  UserController.deleteUser,
);

router.get(
  '/',
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  UserController.getAllUsers,
);

export const UserRoutes = router;
