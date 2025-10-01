import { UserRole } from '@prisma/client';
import { Router } from 'express';
import { multerUpload } from '../../config/multer.config';
import { auth } from '../../middlewares/auth';
import { parseBody } from '../../middlewares/bodyParser';
import validateRequest from '../../middlewares/validateRequest';
import { CourseController } from './course.controller';
import { CourseValidation } from './course.validation';

const router = Router();

router.post(
  '/',
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  multerUpload.single('thumbnail'),
  parseBody,
  validateRequest(CourseValidation.createCourseValidationSchema),
  CourseController.createCourse,
);

router.get('/', CourseController.getAllCourses);

router.get(
  '/all',
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  CourseController.getAllCourses,
);

router.get('/:slug', CourseController.getCourseBySlug);

router.patch(
  '/:id',
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  multerUpload.single('thumbnail'),
  parseBody,
  validateRequest(CourseValidation.updateCourseValidationSchema),
  CourseController.updateCourse,
);

router.patch(
  '/:id/visibility',
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  CourseController.toggleCourseVisibility,
);

router.patch(
  '/:id/featured',
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  CourseController.toggleCourseFeatured,
);

router.patch(
  '/:id/restore',
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  CourseController.restoreCourse,
);

router.delete(
  '/:id',
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  CourseController.deleteCourse,
);

export const CourseRoutes = router;
