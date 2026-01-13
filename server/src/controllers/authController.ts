import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.config';
import bcrypt from 'bcrypt';
import { signToken } from '../utils/auth';

/**
    * Login user and return JWT token.
    * @returns 200 with { token: string } or 401 if missing or invalid credentials, 400 if missing fields
    * @param req.body.email User email
    * @param req.body.password User password
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
     * Register a new user as WRITER.
     * @returns 201 with { id: number, name: string, email: string } or 409 if email in use, 400 if missing fields
     * @param req.body.name User name
     * @param req.body.email User email
     * @param req.body.password User password
 */
export const register = async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, password } = req.body;
    if (!email || !password || !name) {
        return res.status(400).json({ message: 'Email, password and name required' });
    }

    try {
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });
        
        if (existingUser) {
            return res.status(409).json({ message: 'Email already in use' });
        }

        const password_hash = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password_hash,
                role: 'WRITER',
            },
        });

        res.status(201).json({ id: newUser.id, name: newUser.name, email: newUser.email });
    } catch (error) {
        next(error);
    }
};

/**
     * Get info about the authenticated user.
     * @returns 200 with { id: number, name: string, email: string, role: string } or 401 if not authenticated, 404 if user not found
     * @param req.user.userId Authenticated user id
     * @param req.user.role Authenticated user role
 */
export const getUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = (req as Request & { user?: { userId: number; role: string } }).user;
        if (!user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const existingUser = await prisma.user.findUnique({
            where: { id: user.userId },
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