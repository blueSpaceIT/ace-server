import crypto from 'crypto';
import config from '../../config';
import sendEmail from '../../shared/sendEmail';

export const OTP_LENGTH = 6;

export const generateOtp = (length = OTP_LENGTH): string =>
  crypto
    .randomInt(10 ** (length - 1), 10 ** length)
    .toString()
    .padStart(length, '0');

export const buildOtpKey = (email: string) => `otp:${email}`;

export const renderOtpEmail = async (name: string, otp: string) =>
  sendEmail.renderTemplate('verify-otp.ejs', {
    name,
    otp,
    companyName: config.COMPANY_NAME,
    frontendUrl: config.FRONTEND_URL,
    supportEmail: config.SUPPORT_EMAIL,
  });
