import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.config';
import slugify from 'slugify';

/**
    * List all published articles (public).
    * @returns 200 with Article[]
 */
export const getPublishedArticles = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const articles = await prisma.article.findMany({
            where: { status: 'PUBLISHED' },
        });
        res.status(200).json(articles);
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
    if (isNaN(Number(id))) {
        return res.status(400).json({ message: 'Invalid article id' });
    }

    try {
        const article = await prisma.article.findUnique({
            where: { id },
        });

        if (!article || article.status !== 'PUBLISHED') {
            return res.status(404).json({ message: 'Article not found' });
        }

        res.status(200).json(article);
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
            return res.status(200).json(articles);
        }

        if (user.role === 'WRITER') {
            const articles = await prisma.article.findMany({
                where: { authorId: user.userId },
            });
            return res.status(200).json(articles);
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
    if (isNaN(Number(id))) {
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
            return res.status(200).json(article);
        }

        if (user.role === 'WRITER') {
            if (article.authorId === user.userId) {
                return res.status(200).json(article);
            }
            return res.status(403).json({ message: 'Access denied' });
        }

        res.status(403).json({ message: 'Access denied' });
    } catch (error) {
        next(error);
    }
};

/**
 * Create a new article.
 * Access: WRITER (DRAFT, REVIEW), ADMIN (REVIEW, REJECTED)
 * @param req.body.title string
 * @param req.body.summary string
 * @param req.body.content string
 * @param req.body.thumbnail string (optional)
 * @param req.body.categoryId number (optional)
 * @param req.body.status 'DRAFT' | 'REVIEW' | 'REJECTED' (optional)
 * @returns 201 with created Article
 */
export const addArticle = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = (req as Request & { user?: { userId: number; role: string } }).user;
        if (!user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const { title, summary, content, thumbnail, categoryId, status } = req.body;

        if (!title || !summary || !content) {
            return res.status(400).json({ message: 'Title, summary, and content are required' });
        }

        let articleStatus = status;
        if (!articleStatus) {
            articleStatus = 'DRAFT';
        }

        if (user.role === 'WRITER') {
            if (articleStatus !== 'DRAFT' && articleStatus !== 'REVIEW') {
                return res.status(400).json({ message: 'Writers can only create articles with DRAFT or REVIEW status' });
            }
        } else if(user.role != 'ADMIN') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const slugBase = slugify(title, { lower: true, strict: true });
        const uniqueSlug = `${slugBase}-${Date.now()}`;

        let publishedAt: Date | undefined;
        if (articleStatus === 'PUBLISHED') {
            publishedAt = new Date();
        }

        const newArticle = await prisma.article.create({
            data: {
                title,
                summary,
                content,
                thumbnail,
                status: articleStatus,
                publishedAt,
                slug: uniqueSlug,
                authorId: user.userId,
                categoryId: categoryId ? Number(categoryId) : undefined,
            },
        });

        res.status(201).json(newArticle);
    } catch (error) {
        next(error);
    }
};

/**
 * Delete an article.
 * WRITER: Only own articles in DRAFT or REVIEW.
 * ADMIN: Any article.
 * @param req.params.id Article id (number)
 * @returns 200 on success, 403 if forbidden, 404 if not found
 */
export const deleteArticle = async (req: Request, res: Response, next: NextFunction) => {
    const id = Number(req.params.id);
    if (isNaN(Number(id))) {
        return res.status(400).json({ message: 'Invalid article id' });
    }

    try {
        const user = (req as Request & { user?: { userId: number; role: string } }).user;
        if (!user) {
             return res.status(401).json({ message: 'Authentication required' });
        }

        const article = await prisma.article.findUnique({
             where: { id },
             select: { id: true, authorId: true, status: true }
        });

        if (!article) {
             return res.status(404).json({ message: 'Article not found' });
        }

        if (user.role === 'WRITER') {
             if (article.authorId !== user.userId) {
                  return res.status(403).json({ message: 'Access denied' });
             }
             if (article.status === 'PUBLISHED') {
                  return res.status(403).json({ message: 'Writers can only delete non published articles' });
             }
        } else if (user.role !== 'ADMIN') {
             return res.status(403).json({ message: 'Access denied' });
        }

        const deletedArticle = await prisma.article.delete({
             where: { id },
        });

        res.status(200).json(deletedArticle);
    } catch (error) {
        next(error);
    }
};

/**
 * Update an article.
 * ADMIN: Can update PUBLISHED articles OR own articles.
 * WRITER: Can update own articles if DRAFT, REVIEW, or REJECTED.
 * @param req.params.id Article id (number)
 * @param req.body fields to update: title, summary, content, thumbnail, categoryId, status
 * @returns 200 with updated Article
 */
export const updateArticle = async (req: Request, res: Response, next: NextFunction) => {
    const id = Number(req.params.id);
    if (isNaN(Number(id))) {
        return res.status(400).json({ message: 'Invalid article id' });
    }

    try {
        const user = (req as Request & { user?: { userId: number; role: string } }).user;
        if (!user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const article = await prisma.article.findUnique({
            where: { id },
        });

        if (!article) {
            return res.status(404).json({ message: 'Article not found' });
        }

        if (user.role === 'ADMIN') {
            const isOwner = article.authorId === user.userId;
            const isPublished = article.status === 'PUBLISHED';

            if (!isPublished && !isOwner) {
                return res.status(403).json({ message: 'Admins can only edit their own articles or published articles.' });
            }
        } else if (user.role === 'WRITER') {
            if (article.authorId !== user.userId) {
                return res.status(403).json({ message: 'Access denied' });
            }

            if (!['DRAFT', 'REVIEW', 'REJECTED'].includes(article.status)) {
                return res.status(403).json({ message: 'Writers can only edit articles in DRAFT, REVIEW or REJECTED status' });
            }
        } else {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { title, summary, content, thumbnail, categoryId, status } = req.body;
        const data: any = {};

        if (title) {
            data.title = title;
            data.slug = `${slugify(title, { lower: true, strict: true })}-${Date.now()}`;
        }
        if (summary) data.summary = summary;
        if (content) data.content = content;
        if (thumbnail !== undefined) data.thumbnail = thumbnail;
        if (categoryId) data.categoryId = Number(categoryId);

        if (status) {
            if (user.role === 'WRITER' && !['DRAFT', 'REVIEW'].includes(status)) {
                return res.status(400).json({ message: 'Writers can only set status to DRAFT or REVIEW' });
            }
            
            data.status = status;
            
            if (status === 'PUBLISHED' && article.publishedAt === null) {
                data.publishedAt = new Date();
            }
        }

        const updatedArticle = await prisma.article.update({
            where: { id },
            data,
        });

        res.status(200).json(updatedArticle);
    } catch (error) {
        next(error);
    }
};

/**
 * Review an article (Accept or Deny).
 * Access: ADMIN only.
 * Updates status to PUBLISHED or REJECTED.
 * @param req.params.id Article id
 * @param req.body.status 'PUBLISHED' | 'REJECTED'
 */
export const reviewArticle = async (req: Request, res: Response, next: NextFunction) => {
    const id = Number(req.params.id);
    if (isNaN(Number(id))) {
        return res.status(400).json({ message: 'Invalid article id' });
    }

    const { status } = req.body;
    
    if (!status || (status !== 'PUBLISHED' && status !== 'REJECTED')) {
        return res.status(400).json({ message: 'Status must be either PUBLISHED or REJECTED' });
    }

    try {
        const user = (req as Request & { user?: { userId: number; role: string } }).user;
        
        if (!user || user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Access denied. Only Admins can review articles.' });
        }

        const article = await prisma.article.findUnique({
            where: { id },
        });

        if (!article) {
            return res.status(404).json({ message: 'Article not found' });
        }

        const data: any = { status };
        
        if (status === 'PUBLISHED') {
            data.publishedAt = new Date();
        }

        const updatedArticle = await prisma.article.update({
            where: { id },
            data,
        });

        res.status(200).json(updatedArticle);
    } catch (error) {
        next(error);
    }
};