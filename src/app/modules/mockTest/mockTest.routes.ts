import { UserRole } from '@prisma/client';
import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { MockTestController } from './mockTest.controller';
import { MockTestValidation } from './mockTest.validation';

const router = Router();

// GET all mocks (filtered by examType, organization, pagination)
router.get(
  '/',
  auth(
    UserRole.STUDENT,
    UserRole.TEACHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  ),
  MockTestController.getAllMockTests,
);

// GET single mock by ID (with questions)
router.get(
  '/:id',
  auth(
    UserRole.STUDENT,
    UserRole.TEACHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  ),
  MockTestController.getMockTestById,
);

// POST create mock (admin/teacher)
router.post(
  '/',
  auth(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(MockTestValidation.createMockTestValidationSchema),
  MockTestController.createMockTest,
);

// PATCH update mock
router.patch(
  '/:id',
  auth(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(MockTestValidation.updateMockTestValidationSchema),
  MockTestController.updateMockTest,
);

// DELETE mock (soft delete)
router.delete(
  '/:id',
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  MockTestController.deleteMockTest,
);

export const MockTestRoutes = router;
