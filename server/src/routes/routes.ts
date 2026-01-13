import { Router } from 'express';
import articleRoutes from './articleRoutes';
import taskRoutes from './taskRoutes';
import authRoutes from './authRoutes';
import categoryRoutes from './categoryRoutes';

const router = Router();

router.use('/articles', articleRoutes);
router.use('/tasks', taskRoutes);
router.use('/categories', categoryRoutes);
router.use('/auth', authRoutes);

export default router;