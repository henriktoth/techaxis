import { Request, Response, NextFunction} from 'express';
import { verifyToken } from '../utils/auth';
import dotenv from 'dotenv';

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET

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
