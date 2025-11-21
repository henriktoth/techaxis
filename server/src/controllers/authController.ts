import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.config';
import bcrypt from 'bcrypt';
import { signToken } from '../utils/auth';

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

        const token = signToken({ userId: user.id });

        res.json({ token });
    } catch (error) {
        next(error);
    }
};

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
