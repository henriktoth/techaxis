import { Request, Response, NextFunction } from 'express';
import { Router } from 'express';
import { prisma } from '../config/db.config';

const router = Router();

// Test route
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const articles = await prisma.article.findMany({
            where: { status: 'PUBLISHED' },
        });
        res.json(articles);
    } catch (error) {
        next(error);
    }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
        return res.status(400).json({ message: 'Invalid article id' });
    }

    try {
        const article = await prisma.article.findUnique({
            where: { id },
        });
        
        if (!article || article.status !== 'PUBLISHED') {
            return res.status(404).json({ message: 'Article not found' });
        }

        res.json(article);
    } catch (error) {
        next(error);
    }
});

export default router;