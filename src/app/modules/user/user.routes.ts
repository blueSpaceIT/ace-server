import { UserRole } from '@prisma/client';
import { Router } from 'express';
import { multerUpload } from '../../config/multer.config';
import { auth } from '../../middlewares/auth';
import { parseBody } from '../../middlewares/bodyParser';
import validateRequest from '../../middlewares/validateRequest';
import { UserController } from './user.controller';
import { UserValidation } from './user.validation';

const router = Router();

// Student creation (public, for self-registration)
router.post(
  '/create-student',
  validateRequest(UserValidation.createStudentValidationSchema),
  UserController.createStudent,
);

// Teacher creation (admin only)
router.post(
  '/create-teacher',
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(UserValidation.createTeacherValidationSchema),
  UserController.createTeacher,
);

// Admin creation (super admin only)
router.post(
  '/create-admin',
  auth(UserRole.SUPER_ADMIN),
  validateRequest(UserValidation.createAdminValidationSchema),
  UserController.createAdmin,
);

// Profile management (role-based)
router.get(
  '/me',
  auth(
    UserRole.STUDENT,
    UserRole.TEACHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  ),
  UserController.getMyProfile,
);

router.patch(
  '/me',
  auth(
    UserRole.STUDENT,
    UserRole.TEACHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  ),
  multerUpload.single('picture'),
  parseBody,
  validateRequest(UserValidation.updateProfileValidationSchema),
  UserController.updateProfile,
);

// Admin actions
router.patch(
  '/:id/status',
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
