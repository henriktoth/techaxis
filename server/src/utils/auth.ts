import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRES = process.env.JWT_EXPIRES ?? '1h'

export function signToken(payload: object) {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not set');
  }
  const options: jwt.SignOptions = { expiresIn: JWT_EXPIRES as jwt.SignOptions['expiresIn'] };
  return jwt.sign(payload, JWT_SECRET, options)
}

export function verifyToken(token: string) : jwt.JwtPayload {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not set');
  }
  const decoded = jwt.verify(token, JWT_SECRET);
  if (typeof decoded === 'string') {
    throw new Error('Token payload must be an object');
  }
  return decoded;
}

