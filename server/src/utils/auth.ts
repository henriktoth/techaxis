import jwt from 'jsonwebtoken';
import ENV from '../config/env.config';

/**
  * Sign a JWT token with given payload.
  * @returns JWT token string
  * @param payload object to include in token
*/
export function signToken(payload: object) {
  if (!ENV.jwt.secret) {
    throw new Error('JWT_SECRET is not set');
  }
  const options: jwt.SignOptions = { expiresIn: ENV.jwt.expiresIn as jwt.SignOptions['expiresIn'] };
  return jwt.sign(payload, ENV.jwt.secret, options)
}

/**
 * Verify a JWT token and return its payload.
 * @returns decoded token payload as object
 * @param token JWT token string
 */
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

