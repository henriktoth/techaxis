import { NextFunction, Request, Response } from 'express';
import { prisma } from '../config/db.config';
import bcrypt from 'bcrypt';
import { signToken } from '../utils/auth';
import { isAdminRole, isHigherThan } from '../utils/roles';

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

        const caller = (req as Request & { user?: { userId: number; role: string } }).user;

        if (isAdminRole(existingUser.role) && !isHigherThan(caller!.role, existingUser.role) && caller!.userId !== userId) {
            return res.status(403).json({ message: 'Only a superadmin can edit admin users' });
        }

        if (role && caller!.userId === userId) {
            return res.status(403).json({ message: 'You cannot change your own role' });
        }

        if (role === 'SUPERADMIN') {
            return res.status(403).json({ message: 'Cannot assign the superadmin role' });
        }

        if (role && isAdminRole(role) && caller!.role !== 'SUPERADMIN') {
            return res.status(403).json({ message: 'Only a superadmin can assign admin roles' });
        }

        if (role && role !== existingUser.role) {
            if (existingUser.role === 'READER') {
                return res.status(403).json({ message: 'Cannot change a reader\'s role' });
            }
            if (role === 'READER') {
                return res.status(403).json({ message: 'Cannot demote a user to reader' });
            }
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
 * Create a new user.
 * - Public (no auth): creates a READER and returns a JWT token.
 * - Admin (authenticated): creates user with the given role.
 * @returns 201 with created user (+ token for readers) or 400/409 on error
 * @param req.body.name Name
 * @param req.body.email Email
 * @param req.body.password Password
 * @param req.body.role Role (optional for public, required for admin)
 */
export const createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const caller = (req as Request & { user?: { userId: number; role: string } }).user;
        const isAdmin = caller?.role === 'ADMIN' || caller?.role === 'SUPERADMIN';

        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email and password are required' });
        }

        if (isAdmin && !role) {
            return res.status(400).json({ message: 'Role is required' });
        }

        const assignedRole = isAdmin ? role : 'READER';

        if (assignedRole === 'SUPERADMIN') {
            return res.status(403).json({ message: 'Cannot create a superadmin account' });
        }

        if (isAdmin && isAdminRole(assignedRole) && caller!.role !== 'SUPERADMIN') {
            return res.status(403).json({ message: 'Only a superadmin can create admin users' });
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
                role: assignedRole,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isDisabled: true,
            },
        });

        if (!isAdmin) {
            const token = signToken({ userId: newUser.id, role: newUser.role });
            return res.status(201).json({ ...newUser, token });
        }

        res.status(201).json(newUser);
    } catch (error) {
        next(error);
    }
};

/**
 * Delete user by id. (Admin only)
 * Transfers all articles from the deleted user to the admin performing the deletion.
 * Cannot delete admin accounts or yourself.
 * @returns 200 with deleted user or 404 if not found
 * @param req.params.id User id
 */
export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = Number(id);
        const admin = (req as Request & { user?: { userId: number; role: string } }).user;
        const adminId = admin?.userId;

        if (isNaN(userId)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }

        if (userId === adminId) {
            return res.status(403).json({ message: 'You cannot delete your own account' });
        }

        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!existingUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!isHigherThan(admin!.role, existingUser.role)) {
            return res.status(403).json({ message: `Cannot delete a ${existingUser.role.toLowerCase()} account` });
        }

        // Transfer all articles to the admin performing the deletion, then delete the user
        await prisma.$transaction(async (tx) => {
            await tx.article.updateMany({
                where: { authorId: userId },
                data: { authorId: adminId! },
            });

            await tx.task.updateMany({
                where: { assignedToId: userId },
                data: { assignedToId: null },
            });

            await tx.notification.deleteMany({
                where: { userId },
            });

            await tx.user.delete({
                where: { id: userId },
            });
        });

        res.status(200).json({ message: 'User deleted and articles transferred successfully' });
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

        const caller = (req as Request & { user?: { userId: number; role: string } }).user;

        if (!isHigherThan(caller!.role, existingUser.role)) {
            return res.status(403).json({ message: `Cannot disable a ${existingUser.role.toLowerCase()} account` });
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
