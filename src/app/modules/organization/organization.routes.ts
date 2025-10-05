import { UserRole } from '@prisma/client';
import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { OrganizationController } from './organization.controller';
import { OrganizationValidation } from './organization.validation';

const router = Router();

router.post(
  '/',
  auth(UserRole.SUPER_ADMIN),
  validateRequest(OrganizationValidation.createOrganizationValidationSchema),
  OrganizationController.createOrganization,
);

router.get(
  '/',
  auth(UserRole.SUPER_ADMIN),
  OrganizationController.getAllOrganizations,
);

router.get('/:slug', OrganizationController.getOrganizationBySlug);

router.post(
  '/:id/admins',
  auth(UserRole.SUPER_ADMIN),
  validateRequest(OrganizationValidation.assignAdminValidationSchema),
  OrganizationController.assignAdminToOrganization,
);

router.patch(
  '/:id',
  auth(UserRole.SUPER_ADMIN),
  validateRequest(OrganizationValidation.updateOrganizationValidationSchema),
  OrganizationController.updateOrganization,
);

router.patch(
  '/:id/status',
  auth(UserRole.SUPER_ADMIN),
  OrganizationController.toggleOrganizationStatus,
);

export const OrganizationRoutes = router;
