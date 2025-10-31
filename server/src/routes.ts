import { Router } from 'express';
import { prisma } from './db';

const router = Router();

// Test route
router.get('/users', async (req, res, next) => {
    try {
        const users = await prisma.user.findMany();
        res.json(users.map(u => ({ name: u.name, email: u.email })));
    } catch (error) {
        next(error);
    }
});

export default router;