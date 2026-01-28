import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '../generated/prisma'; // Or your centralized prisma import

const prisma = new PrismaClient();

/**
 * Get all tasks.
 * - ADMIN: can see all tasks
 * - WRITER: can see only tasks assigned to them
 * @returns 200 with tasks or 401 if not authenticated, 403 if access denied
 */
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

/**
 * Get task by id.
 * - ADMIN: can see any task
 * - WRITER: can see only tasks assigned to them
 * @returns 200 with task or 401 if not authenticated, 403 if access denied, 404 if task not found
 * @param req.params.id Task id
 */
export const getTaskById = async (req: Request, res: Response, next: NextFunction) => {
    const id = Number(req.params.id);
    if (isNaN(Number(id))) {
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

        if (user.role === 'ADMIN') {
            return res.status(200).json(task);
        } 
        
        if (user.role === 'WRITER') {
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

/**
 * Create a new task.
 * @param req.body.title string (required)
 * @param req.body.description string (required)
 * @param req.body.isCompleted boolean (optional, default false)
 * @param req.body.priority number (optional, default 0)
 * @param req.body.dueDate string/Date (optional)
 * @param req.body.assignedToId number (optional) - defaults to null if not provided
 */
export const createTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.body) {
            return res.status(400).json({ message: 'Request body is required' });
        }

        const { title, description, priority, dueDate, assignedToId } = req.body;

        if (!title || !description) {
            return res.status(400).json({ message: 'Title and description are required' });
        }

        if (priority !== undefined) {
            const priorityNum = Number(priority);
            if (isNaN(priorityNum) || priorityNum < 0 || priorityNum > 2) {
                return res.status(400).json({ message: 'Priority must be between 0 (Low) and 2 (High)' });
            }
        }

        if (assignedToId) {
            const assigneeExists = await prisma.user.findUnique({
                where: { id: Number(assignedToId) }
            });
            if (!assigneeExists) {
                return res.status(400).json({ message: `User with ID ${assignedToId} does not exist` });
            }
        }

        const newTask = await prisma.task.create({
            data: {
                title,
                description,
                priority: priority !== undefined ? Number(priority) : undefined,
                dueDate: dueDate ? new Date(dueDate) : null,
                assignedToId: assignedToId ? Number(assignedToId) : null,
            },
        });

        res.status(201).json(newTask);
    } catch (error) {
        next(error);
    }
};

/**
 * Update an existing task.
 * - ADMIN: Can update any field on any task.
 * - WRITER: Can only update tasks assigned to them. Cannot change 'assignedToId'.
 * @param req.params.id Task id
 */
export const updateTask = async (req: Request, res: Response, next: NextFunction) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid task id' });
    }

    try {
        const existingTask = await prisma.task.findUnique({
            where: { id }
        });

        if (!existingTask) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const { title, description, isCompleted, priority, dueDate, assignedToId } = req.body;

        if (priority !== undefined) {
            const priorityNum = Number(priority);
            if (isNaN(priorityNum) || priorityNum < 0 || priorityNum > 2) {
                return res.status(400).json({ message: 'Priority must be between 0 (Low) and 2 (High)' });
            }
        }

        let newAssigneeId = undefined;
        if (assignedToId !== undefined) {
            if (assignedToId) {
                const idToCheck = Number(assignedToId);
                const assigneeExists = await prisma.user.findUnique({
                    where: { id: idToCheck }
                });
                
                if (!assigneeExists) {
                    return res.status(400).json({ message: `User with ID ${idToCheck} does not exist` });
                }
                newAssigneeId = idToCheck;
            } else {
                newAssigneeId = null;
            }
        }

        const updatedTask = await prisma.task.update({
            where: { id },
            data: {
                title: title || undefined,
                description: description || undefined,
                isCompleted: isCompleted !== undefined ? Boolean(isCompleted) : undefined,
                priority: priority !== undefined ? Number(priority) : undefined,
                dueDate: dueDate ? new Date(dueDate) : undefined,
                assignedToId: newAssigneeId
            },
        });

        res.status(200).json(updatedTask);
    } catch (error) {
        next(error);
    }
};

/**
 * Delete a task.
 * - ADMIN: can delete any task
 * @param req.params.id Task id
 */
export const deleteTask = async (req: Request, res: Response, next: NextFunction) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid task id' });
    }

    try {
        const existingTask = await prisma.task.findUnique({
            where: { id }
        });

        if (!existingTask) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const deletedTask = await prisma.task.delete({
            where: { id }
        });

        res.status(200).json(deletedTask);
    } catch (error) {
        next(error);
    }
};

/**
 * Toggle task completion status (Done / In Progress).
 * - ADMIN: Can toggle any task.
 * - WRITER: Can only toggle tasks assigned to them.
 * @param req.params.id Task id
 */
export const toggleTaskStatus = async (req: Request, res: Response, next: NextFunction) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid task id' });
    }

    try {
        const user = (req as Request & { user?: { userId: number; role: string } }).user;

        if (!user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const existingTask = await prisma.task.findUnique({
            where: { id }
        });

        if (!existingTask) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const isAssignee = existingTask.assignedToId === user.userId;
        
        if (user.role !== 'ADMIN' && !isAssignee) {
            return res.status(403).json({ message: 'Access denied. You can only update the status of tasks assigned to you.' });
        }

        const updatedTask = await prisma.task.update({
            where: { id },
            data: {
                isCompleted: !existingTask.isCompleted
            }
        });

        res.status(200).json(updatedTask);
    } catch (error) {
        next(error);
    }
};


