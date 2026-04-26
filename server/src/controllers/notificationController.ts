import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.config';

/**
 * Get all notifications for the authenticated user.
 * @returns 200 with array of notifications, 401 if unauthorized, 500 if error fetching notifications
 */
export const getNotifications = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        res.status(200).json(notifications);
    } catch (error) {
        next(error);
    }
};

/**
 * Get the count of unread notifications for the authenticated user.
 * @returns 200 with count, 401 if unauthorized, 500 if error fetching count
 */
export const getUnreadCount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const count = await prisma.notification.count({
            where: { userId, isRead: false },
        });

        res.status(200).json({ count });
    } catch (error) {
        next(error);
    }
};

/**
 * Mark a single notification as read.
 * @returns 200 with updated notification, 400 if invalid id, 401 if unauthorized, 403 if forbidden, 404 if notification not found, 500 if error updating notification
 */
export const markAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ message: 'Invalid notification id' });
        }

        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const notification = await prisma.notification.findUnique({ where: { id } });

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        if (notification.userId !== userId) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const updated = await prisma.notification.update({
            where: { id },
            data: { isRead: true },
        });

        res.status(200).json(updated);
    } catch (error) {
        next(error);
    }
};

/**
 * Mark all notifications as read for the authenticated user.
 * @returns 200 with success message, 401 if unauthorized, 500 if error updating notifications
 */
export const markAllAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        await prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });

        res.status(200).json({ message: 'All notifications marked as read' });
    } catch (error) {
        next(error);
    }
};
