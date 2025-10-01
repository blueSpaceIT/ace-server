import { UserRole } from '@prisma/client';
import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { CourseModuleController } from './courseModule.controller';
import { CourseModuleValidation } from './courseModule.validation';

const router = Router();

router.post(
  '/',
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(CourseModuleValidation.createModuleValidationSchema),
  CourseModuleController.createModule,
);

router.get('/', CourseModuleController.getModules);

router.get('/:moduleId', CourseModuleController.getModuleById);

router.patch(
  '/:moduleId',
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
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
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  CourseModuleController.deleteModule,
);

//hard delete
router.delete(
  '/:moduleId/delete',
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  CourseModuleController.hardDeleteModule,
);

export const CourseModuleRoutes = router;
