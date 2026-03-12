import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.config';

/**
 * Get all favorites for the authenticated user.
 * @returns 200 with array of favorites (with article data)
 */
export const getFavorites = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = (req as Request & { user?: { userId: number } }).user;
        if (!user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const favorites = await prisma.favorite.findMany({
            where: { userId: user.userId },
            include: {
                article: {
                    include: {
                        author: { select: { id: true, name: true } },
                        category: { select: { id: true, name: true } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        const articles = favorites.map((f) => f.article);
        res.json(articles);
    } catch (error) {
        next(error);
    }
};

/**
 * Add an article to favorites.
 * @returns 201 with { message: string }
 */
export const addFavorite = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = (req as Request & { user?: { userId: number } }).user;
        if (!user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const articleId = parseInt(req.params.articleId);
        if (isNaN(articleId)) {
            return res.status(400).json({ message: 'Invalid article ID' });
        }

        const article = await prisma.article.findUnique({ where: { id: articleId } });
        if (!article) {
            return res.status(404).json({ message: 'Article not found' });
        }

        const existing = await prisma.favorite.findUnique({
            where: { userId_articleId: { userId: user.userId, articleId } },
        });

        if (existing) {
            return res.status(409).json({ message: 'Article already in favorites' });
        }

        await prisma.favorite.create({
            data: { userId: user.userId, articleId },
        });

        res.status(201).json({ message: 'Article added to favorites' });
    } catch (error) {
        next(error);
    }
};

/**
 * Remove an article from favorites.
 * @returns 200 with { message: string }
 */
export const removeFavorite = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = (req as Request & { user?: { userId: number } }).user;
        if (!user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const articleId = parseInt(req.params.articleId);
        if (isNaN(articleId)) {
            return res.status(400).json({ message: 'Invalid article ID' });
        }

        const existing = await prisma.favorite.findUnique({
            where: { userId_articleId: { userId: user.userId, articleId } },
        });

        if (!existing) {
            return res.status(404).json({ message: 'Favorite not found' });
        }

        await prisma.favorite.delete({
            where: { userId_articleId: { userId: user.userId, articleId } },
        });

        res.json({ message: 'Article removed from favorites' });
    } catch (error) {
        next(error);
    }
};

/**
 * Check if an article is in the user's favorites.
 * @returns 200 with { isFavorited: boolean }
 */
export const checkFavorite = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = (req as Request & { user?: { userId: number } }).user;
        if (!user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const articleId = parseInt(req.params.articleId);
        if (isNaN(articleId)) {
            return res.status(400).json({ message: 'Invalid article ID' });
        }

        const existing = await prisma.favorite.findUnique({
            where: { userId_articleId: { userId: user.userId, articleId } },
        });

        res.json({ isFavorited: !!existing });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all favorite article IDs for the authenticated user.
 * @returns 200 with array of article IDs
 */
export const getFavoriteIds = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = (req as Request & { user?: { userId: number } }).user;
        if (!user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const favorites = await prisma.favorite.findMany({
            where: { userId: user.userId },
            select: { articleId: true },
        });

        res.json(favorites.map((f) => f.articleId));
    } catch (error) {
        next(error);
    }
};
