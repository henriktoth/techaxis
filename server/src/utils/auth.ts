import { Request, Response, NextFunction} from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET
export const JWT_EXPIRES = process.env.JWT_EXPIRES ?? '1h'

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

export function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const bearerToken = req.headers.authorization;
    if (!bearerToken?.startsWith('Bearer ')) {
      throw new Error();
    }
    const token = bearerToken.split(' ')[1];
    if (!token || !JWT_SECRET) {
      throw new Error();
    }

    req.user = verifyToken(token);
    next();
  } catch {
    return res.status(401).json({ message: 'Authentication failed' });
  }
}
