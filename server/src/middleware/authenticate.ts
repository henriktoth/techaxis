import { Request, Response, NextFunction} from 'express';
import { verifyToken } from '../utils/auth'
import ENV from '../config/env.config';

/**
 * Middleware to authenticate requests using JWT.
 * @returns 401 if authentication fails otherwise calls next()
 * @param req.headers.authorization Bearer token
 */
export function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const bearerToken = req.headers.authorization;
    if (!bearerToken?.startsWith('Bearer ')) {
      throw new Error();
    }
    const token = bearerToken.split(' ')[1];
    if (!token || !ENV.jwt.secret) {
      throw new Error();
    }

    (req as Request & { user?: object }).user = verifyToken(token);
    next();
  } catch {
    return res.status(401).json({ message: 'Authentication failed' });
  }
}
