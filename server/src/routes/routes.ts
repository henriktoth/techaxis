import { Router } from 'express';
import { prisma } from '../db';

const router = Router();

// Test route
router.get('/articles', async (req, res, next) => {
    try {
        const articles = await prisma.article.findMany();
        res.json(articles);
    } catch (error) {
        next(error);
    }
});

router.get('/articles/:id', async (req, res, next) => {
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