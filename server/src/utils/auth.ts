import jwt from 'jsonwebtoken';
import ENV from '../config/env.config';

export function signToken(payload: object) {
  if (!ENV.jwt.secret) {
    throw new Error('JWT_SECRET is not set');
  }
  const options: jwt.SignOptions = { expiresIn: ENV.jwt.expiresIn as jwt.SignOptions['expiresIn'] };
  return jwt.sign(payload, ENV.jwt.secret, options)
}

export function verifyToken(token: string) : jwt.JwtPayload {
  if (!ENV.jwt.secret) {
    throw new Error('JWT_SECRET is not set');
  }
  const decoded = jwt.verify(token, ENV.jwt.secret);
  if (typeof decoded === 'string') {
    throw new Error('Token payload must be an object');
  }
  return decoded;
}

