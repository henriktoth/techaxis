import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.config';
import bcrypt from 'bcrypt';
import { signToken } from '../utils/auth';

/**
 * Login user and return JWT token.
 * @param {Request} req - Express request object containing email and password in the body
 * @returns 200 with { token: string }, 400 if missing fields, 401 if invalid credentials, or 403 if account disabled
 */
export const login = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password required' });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' })
        }

        if (user.isDisabled) {
            return res.status(403).json({ message: 'Your account has been disabled. Please contact an administrator.' });
        }

        const isCorrectPassword = await bcrypt.compare(password, user.password_hash);

        if (!isCorrectPassword) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = signToken({ userId: user.id, role: user.role });

        res.json({ token });
    } catch (error) {
        next(error);
    }
};

/**
 * Get info about the authenticated user.
 * @param {Request} req - Express request object containing authenticated user info
 * @returns 200 with { id: number, name: string, email: string, role: string }, 401 if not authenticated, or 404 if user not found
 */
export const getUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true, role: true },
        });

        if (!existingUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(existingUser);
    } catch (error) {
        next(error);
    }
};