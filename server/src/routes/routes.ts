import { Router } from 'express';
import { prisma } from '../db';
import articleRoutes from './articleRoutes';
import authRoutes from './authRoutes';

const router = Router();

router.use('/articles', articleRoutes);
router.use('/auth', authRoutes);
export default router;