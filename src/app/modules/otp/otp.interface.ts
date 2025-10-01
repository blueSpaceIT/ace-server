export interface OTP {
  email: string;
  otp: string;
}

export const OTP_EXPIRATION = 10 * 60;