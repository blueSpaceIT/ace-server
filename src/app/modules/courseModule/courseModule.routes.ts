import { UserRole } from '@prisma/client';
import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { CourseModuleController } from './courseModule.controller';
import { CourseModuleValidation } from './courseModule.validation';

const router = Router();

router.post(
  '/',
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TEACHER),
  validateRequest(CourseModuleValidation.createModuleValidationSchema),
  CourseModuleController.createModule,
);

router.get(
  '/',
  auth(
    UserRole.STUDENT,
    UserRole.TEACHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  ),
  CourseModuleController.getModules,
);

router.get(
  '/:moduleId',
  auth(
    UserRole.STUDENT,
    UserRole.TEACHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  ),
  CourseModuleController.getModuleById,
);

router.patch(
  '/:moduleId',
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TEACHER),
  validateRequest(CourseModuleValidation.updateModuleValidationSchema),
  CourseModuleController.updateModule,
);

router.patch(
  '/:moduleId/restore',
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  CourseModuleController.restoreModule,
);

router.delete(
  '/:moduleId',
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TEACHER),
  CourseModuleController.deleteModule,
);

// Hard delete (admin/super admin only)
router.delete(
  '/:moduleId/hard-delete',
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  CourseModuleController.hardDeleteModule,
);

export const CourseModuleRoutes = router;
