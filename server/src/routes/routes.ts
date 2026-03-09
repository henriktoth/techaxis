import { Router } from 'express';
import articleRoutes from './articleRoutes';
import taskRoutes from './taskRoutes';
import authRoutes from './authRoutes';
import categoryRoutes from './categoryRoutes';
import userRoutes from './userRoutes';
import notificationRoutes from './notificationRoutes';

const router = Router();

router.use('/articles', articleRoutes);
router.use('/tasks', taskRoutes);
router.use('/categories', categoryRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/notifications', notificationRoutes);

export default router;