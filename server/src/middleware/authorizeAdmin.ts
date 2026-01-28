import { Request, Response, NextFunction } from 'express';

export const authorizeAdmin = (req: Request, res: Response, next: NextFunction) => {
    
    const user = (req as Request & { user?: { role: string } }).user;

    if (!user || user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    next();
};