import { NextFunction, Request, Response } from 'express';
import { prisma } from '../config/db.config';

export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
            },
        });
        
        res.status(200).json(users);
    } catch (error) {
        next(error);
    }
};