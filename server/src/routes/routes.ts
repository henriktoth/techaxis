import { Router } from 'express';
import articleRoutes from './articleRoutes';
import taskRoutes from './taskRoutes';
import authRoutes from './authRoutes';
import categoryRoutes from './categoryRoutes';
import userRoutes from './userRoutes';
import notificationRoutes from './notificationRoutes';
import favoriteRoutes from './favoriteRoutes';

const router = Router();

router.use('/articles', articleRoutes);
router.use('/tasks', taskRoutes);
router.use('/categories', categoryRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/notifications', notificationRoutes);
router.use('/favorites', favoriteRoutes);

export default router;