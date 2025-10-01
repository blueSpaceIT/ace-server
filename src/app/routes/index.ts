import express from 'express';
import { AuthRoutes } from '../modules/auth/auth.routes';
import { CourseRoutes } from '../modules/course/course.routes';
import { CourseModuleRoutes } from '../modules/courseModule/courseModule.routes';
import { OtpRoutes } from '../modules/otp/otp.route';
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
    path: '/course',
    route: CourseRoutes,
  },
  {
    path: '/course-module',
    route: CourseModuleRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
