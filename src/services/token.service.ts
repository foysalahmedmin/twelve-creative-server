import jwt from 'jsonwebtoken';
import { TJwtPayload } from '../types/jsonwebtoken.type';
import { ExpiresIn } from '../config/env';

export const createToken = (
  payload: TJwtPayload,
  secret: string,
  expiresIn: ExpiresIn,
): string => {
  return jwt.sign(payload, secret, { expiresIn });
};

export const verifyToken = (token: string, secret: string): TJwtPayload => {
  return jwt.verify(token, secret) as TJwtPayload;
};
