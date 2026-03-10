import { NextFunction, Request, Response } from 'express';
import { prisma } from '../config/db.config';
import bcrypt from 'bcrypt';

/**
 * Get all users. (Admin only)
 * @returns 200 with users list
 */
export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isDisabled: true,
            },
        });

        res.status(200).json(users);
    } catch (error) {
        next(error);
    }
};

/**
 * Get user by id. (Admin only)
 * @returns 200 with user or 404 if not found
 * @param req.params.id User id
 */
export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        if (isNaN(Number(id))) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }

        const user = await prisma.user.findUnique({
            where: { id: Number(id) },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isDisabled: true,
            },
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user);
    } catch (error) {
        next(error);
    }
};

/**
 * Update user by id. (Admin only)
 * @returns 200 with updated user or 404 if not found
 * @param req.params.id User id
 * @param req.body User data to update
 */
export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = Number(id);

        if (isNaN(userId)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }

        const { name, email, password, role } = req.body;

        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!existingUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (email && email !== existingUser.email) {
            const emailTaken = await prisma.user.findUnique({
                where: { email },
            });

            if (emailTaken) {
                return res.status(409).json({ message: 'Email already in use' });
            }
        }

        let newPasswordHash = undefined;
        if (password) {
            newPasswordHash = await bcrypt.hash(password, 10);
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                name: name || undefined,
                email: email || undefined,
                password_hash: newPasswordHash,
                role: role || undefined,
            },
        });

        res.status(200).json({
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            isDisabled: updatedUser.isDisabled,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create a new user. (Admin only)
 * @returns 201 with created user or 400/409 on error
 * @param req.body.name Name
 * @param req.body.email Email
 * @param req.body.password Password
 * @param req.body.role Role (WRITER | ADMIN)
 */
export const createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: 'All fields are required' });
        }

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
                role,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isDisabled: true,
            },
        });

        res.status(201).json(newUser);
    } catch (error) {
        next(error);
    }
};

/**
 * Delete user by id. (Admin only)
 * @returns 200 with deleted user or 404 if not found
 * @param req.params.id User id
 */
export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = Number(id);

        if (isNaN(userId)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }

        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!existingUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        const deletedUser = await prisma.user.delete({
            where: { id: userId },
        });

        res.status(200).json(deletedUser);
    } catch (error) {
        next(error);
    }
};

/**
 * Toggle user disabled status. (Admin only)
 * @returns 200 with updated user or 404 if not found
 * @param req.params.id User id
 */
export const toggleUserDisabled = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = Number(id);

        if (isNaN(userId)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }

        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!existingUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (existingUser.role === 'ADMIN') {
            return res.status(403).json({ message: 'Cannot disable an admin account' });
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                isDisabled: !existingUser.isDisabled,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isDisabled: true,
            },
        });

        res.status(200).json(updatedUser);
    } catch (error) {
        next(error);
    }
};
