import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.config';

/**
 * List all published articles (public).
 * @returns 200 with Article[]
 */
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

/**
 * Get a single published article by id (public).
 * @param req.params.id Article id (number)
 * @returns 200 with Article or 404 if not published/not found
 */
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

/**
 * List articles for the authenticated user.
 * ADMIN: all articles; WRITER: own articles.
 * @returns 200 with Article[]
 */
export const getArticlesForUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = (req as Request & { user?: { userId: number; role: string } }).user;
        if (!user || typeof user.userId !== 'number' || !user.role) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        if (user.role === 'ADMIN') {
            const articles = await prisma.article.findMany();
            return res.json(articles);
        }

        if (user.role === 'WRITER') {
            const articles = await prisma.article.findMany({
                where: { authorId: user.userId },
            });
            return res.json(articles);
        }

        res.status(403).json({ message: 'Access denied' });
    } catch (error) {
        next(error);
    }
};

/**
 * Get one article for the authenticated user.
 * ADMIN: any article; WRITER: only own articles; 404 if missing; 403 if forbidden.
 * @param req.params.id Article id (number)
 */
export const getArticleForUserById = async (req: Request, res: Response, next: NextFunction) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
        return res.status(400).json({ message: 'Invalid article id' });
    }

    try {
        const user = (req as Request & { user?: { userId: number; role: string } }).user;
        if (!user || typeof user.userId !== 'number' || !user.role) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const article = await prisma.article.findUnique({
            where: { id },
        });

        if (!article) {
            return res.status(404).json({ message: 'Article not found' });
        }

        if (user.role === 'ADMIN') {
            return res.json(article);
        }

        if (user.role === 'WRITER') {
            if (article.authorId === user.userId) {
                return res.json(article);
            }
            return res.status(403).json({ message: 'Access denied' });
        }

        res.status(403).json({ message: 'Access denied' });
    } catch (error) {
        next(error);
    }
};
