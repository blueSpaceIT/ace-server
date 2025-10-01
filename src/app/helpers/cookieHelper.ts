import { Response } from 'express';
import config from '../config';

export const setRefreshTokenCookie = (res: Response, token: string) => {
  const cookieOptions = {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: Number(config.JWT_REFRESH_EXPIRES) || 7 * 24 * 60 * 60 * 1000,
  };

  res.cookie('refreshToken', token, cookieOptions);
};

export const clearRefreshTokenCookie = (res: Response) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'lax' as const,
  });
};
