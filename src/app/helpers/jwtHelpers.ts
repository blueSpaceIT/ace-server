import jwt, { JwtPayload, Secret, SignOptions } from 'jsonwebtoken';
import config from '../config';

export const generateToken = (
  jwtPayload: JwtPayload,
  secret: Secret,
  expiresIn: string,
) => {
  return jwt.sign(jwtPayload, secret, {
    algorithm: 'HS256',
    expiresIn,
  } as SignOptions);
};

export const verifyToken = (token: string, secret: Secret) => {
  return jwt.verify(token, secret) as JwtPayload;
};

export const jwtHelpers = {
  generateToken,
  verifyToken,
};

export const generateAuthTokens = (user: {
  id: string;
  email: string;
  role: string;
}): { accessToken: string; refreshToken: string } => {
  const accessToken = jwtHelpers.generateToken(
    { id: user.id, email: user.email, role: user.role },
    config.JWT_ACCESS_SECRET as Secret,
    config.JWT_ACCESS_EXPIRES,
  );

  const refreshToken = jwtHelpers.generateToken(
    { id: user.id, email: user.email, role: user.role },
    config.JWT_REFRESH_SECRET as Secret,
    config.JWT_REFRESH_EXPIRES,
  );

  return { accessToken, refreshToken };
};
