import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
} from '../controllers/notificationController';

const router = Router();

router.get('/', authenticate, getNotifications);
router.get('/unread-count', authenticate, getUnreadCount);
router.patch('/:id/read', authenticate, markAsRead);
router.patch('/read-all', authenticate, markAllAsRead);

export default router;
