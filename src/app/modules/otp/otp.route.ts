import { Router } from 'express';
import { rateLimiter } from '../../middlewares/rateLimiter';
import validateRequest from '../../middlewares/validateRequest';
import { OTPController } from './otp.controller';
import { otpValidation } from './otp.validation';

const router = Router();

router.post(
  '/send',
  rateLimiter,
  validateRequest(otpValidation.sendOtpSchema),
  OTPController.sendOtp,
);

router.post(
  '/resend',
  rateLimiter,
  validateRequest(otpValidation.sendOtpSchema),
  OTPController.resendOtp,
);

router.post(
  '/verify',
  rateLimiter,
  validateRequest(otpValidation.verifyOtpSchema),
  OTPController.verifyOtp,
);

export const OtpRoutes = router;
