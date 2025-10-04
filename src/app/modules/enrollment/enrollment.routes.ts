import { UserRole } from '@prisma/client';
import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import { EnrollmentController } from './enrollment.controller';

const router = Router();

router.get('/', EnrollmentController.getEnrollments);

router.post(
  '/',
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.STUDENT),
  EnrollmentController.enroll,
);

router.delete(
  '/:id',
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.STUDENT),
  EnrollmentController.unenroll,
);

export const EnrollmentRoutes = router;
