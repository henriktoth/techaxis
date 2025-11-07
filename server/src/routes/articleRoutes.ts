import { Request, Response, NextFunction } from 'express';
import { Router } from 'express';
import { prisma } from '../config/db.config';

const router = Router();

// Test route
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const articles = await prisma.article.findMany();
        res.json(articles);
    } catch (error) {
        next(error);
    }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    try {
        const article = await prisma.article.findUnique({
            where: { id: Number(id) },

        });
        if (article) {
            res.json(article);
        } else {
            res.status(404).json({ message: 'Article not found' });
        }
    } catch (error) {
        next(error);
    }
});

export default router;