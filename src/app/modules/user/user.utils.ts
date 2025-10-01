import config from '../../config';

export const buildVerifyUrl = (email: string) =>
  `${config.FRONTEND_URL}/verify?email=${encodeURIComponent(email)}`;
