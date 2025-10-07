import express from 'express';
import { AuthRoutes } from '../modules/auth/auth.routes';
import { CourseRoutes } from '../modules/course/course.routes';
import { CourseModuleRoutes } from '../modules/courseModule/courseModule.routes';
import { EnrollmentRoutes } from '../modules/enrollment/enrollment.routes';
import { MockTestRoutes } from '../modules/mockTest/mockTest.routes';
import { OrganizationRoutes } from '../modules/organization/organization.routes';
import { OtpRoutes } from '../modules/otp/otp.route';
import { PracticeRoutes } from '../modules/practice/practice.routes';
import { UserRoutes } from '../modules/user/user.routes';

const router = express.Router();

const moduleRoutes = [
  {
    path: '/auth',
    route: AuthRoutes,
  },
  {
    path: '/otp',
    route: OtpRoutes,
  },
  {
    path: '/user',
    route: UserRoutes,
  },
  {
    path: '/organization',
    route: OrganizationRoutes,
  },
  {
    path: '/course',
    route: CourseRoutes,
  },
  {
    path: '/course-module',
    route: CourseModuleRoutes,
  },
  {
    path: '/enrollment',
    route: EnrollmentRoutes,
  },
  {
    path: '/practice',
    route: PracticeRoutes,
  },
  {
    path: '/mock-test',
    route: MockTestRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
