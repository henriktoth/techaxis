import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.config';

export const getAllTasks = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = (req as Request & { user?: { userId: number; role: string } }).user;

        if (!user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        let tasks;

        if (user.role === 'ADMIN') {
            tasks = await prisma.task.findMany({
                include: {
                    assignedTo: {
                        select: { name: true, email: true }
                    }
                }
            });
        } else if (user.role === 'WRITER') {
            tasks = await prisma.task.findMany({
                where: {
                    assignedToId: user.userId
                }
            });
        } else {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.status(200).json(tasks);
    } catch (error) {
        next(error);
    }
};

export const getTaskById = async (req: Request, res: Response, next: NextFunction) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
        return res.status(400).json({ message: 'Invalid task id' });
    }

    try {
        const user = (req as Request & { user?: { userId: number; role: string } }).user;

        if (!user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const task = await prisma.task.findUnique({
            where: { id },
            include: {
                assignedTo: {
                    select: { name: true, email: true }
                }
            }
        });

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Authorization Logic
        if (user.role === 'ADMIN') {
            // Admin can view any task
            return res.status(200).json(task);
        } 
        
        if (user.role === 'WRITER') {
            // Writer can only view tasks assigned to them
            if (task.assignedToId === user.userId) {
                return res.status(200).json(task);
            } else {
                return res.status(403).json({ message: 'Access denied. You can only view tasks assigned to you.' });
            }
        }

        return res.status(403).json({ message: 'Access denied' });

    } catch (error) {
        next(error);
    }
};

