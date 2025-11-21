import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.config';

export const getPublishedArticles = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const articles = await prisma.article.findMany({
            where: { status: 'PUBLISHED' },
        });
        res.json(articles);
    } catch (error) {
        next(error);
    }
};

export const getPublishedArticleById = async (req: Request, res: Response, next: NextFunction) => {
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
};
