import { UserRole } from '@prisma/client';
import { Router } from 'express';
import { multerUpload } from '../../config/multer.config';
import { auth } from '../../middlewares/auth';
import { parseBody } from '../../middlewares/bodyParser';
import validateRequest from '../../middlewares/validateRequest';
import { PracticeController } from './practice.controller';
import { PracticeValidation } from './practice.validation';

const router = Router();

// GET practice modules (with optional questions)
router.get(
  '/modules',
  auth(
    UserRole.STUDENT,
    UserRole.TEACHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  ),
  PracticeController.getPracticeModules,
);

// GET questions (filtered)
router.get(
  '/questions',
  auth(
    UserRole.STUDENT,
    UserRole.TEACHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  ),
  PracticeController.getQuestions,
);

// POST create question
router.post(
  '/questions',
  auth(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  multerUpload.fields([
    { name: 'mediaAudio', maxCount: 1 },
    { name: 'mediaImage', maxCount: 1 },
  ]),
  parseBody,
  validateRequest(PracticeValidation.createQuestionValidationSchema),
  PracticeController.createQuestion,
);

// PUT update question
router.patch(
  '/questions/:id',
  auth(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  multerUpload.fields([
    { name: 'mediaAudio', maxCount: 1 },
    { name: 'mediaImage', maxCount: 1 },
  ]),
  parseBody,
  validateRequest(PracticeValidation.updateQuestionValidationSchema),
  PracticeController.updateQuestion,
);

// DELETE question (soft delete)
router.delete(
  '/questions/:id',
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  PracticeController.deleteQuestion,
);

// POST create practice module (admin/teacher)
router.post(
  '/modules',
  auth(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(PracticeValidation.createPracticeModuleValidationSchema),
  PracticeController.createPracticeModule,
);

// PUT update practice module
router.patch(
  '/modules/:id',
  auth(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(PracticeValidation.updatePracticeModuleValidationSchema),
  PracticeController.updatePracticeModule,
);

// DELETE practice module (soft delete)
router.delete(
  '/modules/:id',
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  PracticeController.deletePracticeModule,
);

export const PracticeRoutes = router;
