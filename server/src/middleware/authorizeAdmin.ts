import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to authorize admin users.
 * @returns 403 if user is not admin otherwise calls next()
 * @param req.headers.authorization Bearer token
 */
export const authorizeAdmin = (req: Request, res: Response, next: NextFunction) => {
    
    const user = (req as Request & { user?: { role: string } }).user;

    if (!user || user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    next();
};