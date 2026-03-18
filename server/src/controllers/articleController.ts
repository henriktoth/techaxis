import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.config';
import { Prisma } from '../generated/prisma/client';
import slugify from 'slugify';
import { deleteThumbnailFile } from '../config/upload.config';
import { isAdminRole } from '../utils/roles';
import { getPaginationParams, createPaginatedResponse } from '../utils/pagination';

const parseContentDelta = (input: unknown) => {
    if (input === undefined || input === null || input === '') return undefined;
    if (typeof input === 'string') {
        try {
            return JSON.parse(input);
        } catch {
            return undefined;
        }
    }
    return input;
};

/**
    * List all published articles (public).
    * @returns 200 with Article[]
 */
export const getPublishedArticles = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { search, categoryId } = req.query;
        const { page, limit, skip } = getPaginationParams(req);

        const whereClause: Prisma.ArticleWhereInput = { status: 'PUBLISHED' };

        if (search) {
            whereClause.title = {
                contains: String(search),
                mode: 'insensitive',
            };
        }
        
        if (categoryId) {
            const catId = Number(categoryId);
            if (!isNaN(catId)) {
                whereClause.categoryId = catId;
            }
        }

        const [articles, total] = await Promise.all([
            prisma.article.findMany({
                where: whereClause,
                include: {
                    author: { select: { id: true, name: true } },
                },
                orderBy: [
                    { isFeatured: 'desc' },
                    { publishedAt: 'desc' },
                ],
                skip,
                take: limit,
            }),
            prisma.article.count({ where: whereClause }),
        ]);
        
        res.status(200).json(createPaginatedResponse(articles, total, page, limit));
    } catch (error) {
        next(error);
    }
};

/**
    * Get a single published article by id or slug (public).
    * @param req.params.id Article id (number) or slug (string)
    * @returns 200 with Article or 404 if not published/not found
 */
export const getPublishedArticleById = async (req: Request, res: Response, next: NextFunction) => {
    const param = req.params.id;
    const id = Number(param);
    
    try {
        let article;

        if (!isNaN(id)) {
            article = await prisma.article.findUnique({
                where: { id },
                include: { author: { select: { id: true, name: true } } },
            });
        } else {
            article = await prisma.article.findUnique({
                where: { slug: param },
                include: { author: { select: { id: true, name: true } } },
            });
        }

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
        if (!user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const { page, limit, skip } = getPaginationParams(req);
        const { search, status, authorId } = req.query;

        let whereClause: Prisma.ArticleWhereInput = {};

        if (isAdminRole(user.role)) {
            // Admin sees all
            if (authorId) {
                whereClause.authorId = Number(authorId);
            }
        } else if (user.role === 'WRITER') {
            whereClause.authorId = user.userId;
        } else {
            return res.status(403).json({ message: 'Access denied' });
        }

        if (search) {
            whereClause.OR = [
                { title: { contains: String(search), mode: 'insensitive' } },
                { slug: { contains: String(search), mode: 'insensitive' } }
            ];
        }

        if (status) {
            whereClause.status = String(status).toUpperCase() as any;
        }

        const [articles, total] = await Promise.all([
            prisma.article.findMany({
                where: whereClause,
                include: {
                    task: {
                        select: {
                            id: true,
                            title: true,
                            description: true,
                            priority: true,
                            dueDate: true,
                            isCompleted: true,
                        }
                    },
                    author: { select: { id: true, name: true } },
                },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' }
            }),
            prisma.article.count({ where: whereClause })
        ]);

        return res.status(200).json(createPaginatedResponse(articles, total, page, limit));
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
        if (!user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const article = await prisma.article.findUnique({
            where: { id },
             include: {
                task: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            }
        });

        if (!article) {
            return res.status(404).json({ message: 'Article not found' });
        }

        if (isAdminRole(user.role)) {
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

export const getArticleStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = (req as Request & { user?: { userId: number; role: string } }).user;
        if (!user) return res.status(401).json({ message: 'Authentication required' });

        let whereClause: Prisma.ArticleWhereInput = {};
        if (user.role === 'WRITER') {
            whereClause = { authorId: user.userId };
        } else if (!isAdminRole(user.role)) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        const [total, published, draft, review, scheduled] = await Promise.all([
            prisma.article.count({ where: whereClause }),
            prisma.article.count({ where: { ...whereClause, status: 'PUBLISHED' } }),
            prisma.article.count({ where: { ...whereClause, status: 'DRAFT' } }),
            prisma.article.count({ where: { ...whereClause, status: 'REVIEW' } }),
            prisma.article.count({ where: { ...whereClause, status: 'SCHEDULED' } })
        ]);

        res.json({ total, published, draft, review, scheduled });
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

        const { title, summary, content, categoryId, status, isFeatured, taskId } = req.body;
        const contentDelta = parseContentDelta(req.body.contentDelta);
        const thumbnail = req.file ? `/uploads/thumbnails/${req.file.filename}` : null;

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
        } else if (isAdminRole(user.role)) {
            if (articleStatus === 'REVIEW') {
                return res.status(400).json({ message: 'Admins cannot set their own articles to review status' });
            }
        } else {
            return res.status(403).json({ message: 'Access denied' });
        }

        const slugBase = slugify(title, { lower: true, strict: true });
        let uniqueSlug = slugBase;
        let counter = 1;

        while (await prisma.article.findUnique({ where: { slug: uniqueSlug } })) {
            uniqueSlug = `${slugBase}-${counter}`;
            counter++;
        }

        let publishedAt: Date | undefined;
        let scheduledAt: Date | null = null;
        if (articleStatus === 'PUBLISHED') {
            if (req.body.scheduledAt) {
                const scheduledDate = new Date(req.body.scheduledAt);
                if (scheduledDate > new Date()) {
                    articleStatus = 'SCHEDULED';
                    scheduledAt = scheduledDate;
                } else {
                    publishedAt = new Date();
                }
            } else {
                publishedAt = new Date();
            }
        }

        let resolvedCategoryId: number | undefined;
        if (categoryId) {
            const category = await prisma.category.findUnique({ where: { id: Number(categoryId) } });
            if (!category) {
                return res.status(400).json({ message: 'Invalid category ID' });
            }
            resolvedCategoryId = category.id;
        } else {

            const otherCategory = await prisma.category.findUnique({ where: { name: 'Other' } });
             if (otherCategory) {
                 resolvedCategoryId = otherCategory.id;
             }
        }

        const newArticle = await prisma.article.create({
            data: {
                title,
                summary,
                content,
                contentDelta,
                thumbnail,
                status: articleStatus,
                isFeatured: isFeatured === true || isFeatured === 'true',
                publishedAt,
                scheduledAt,
                slug: uniqueSlug,
                authorId: user.userId,
                categoryId: resolvedCategoryId,
                taskId: taskId ? Number(taskId) : null,
            },
        });

        if (taskId && newArticle.status === 'PUBLISHED') {
            await prisma.task.update({
                where: { id: Number(taskId) },
                data: { isCompleted: true }
            });
        }

        // Notify all admins when an article is submitted for review
        if (newArticle.status === 'REVIEW') {
            const author = await prisma.user.findUnique({ where: { id: user.userId }, select: { name: true } });
            const admins = await prisma.user.findMany({ where: { role: { in: ['ADMIN', 'SUPERADMIN'] } } });
            await prisma.notification.createMany({
                data: admins.map((admin) => ({
                    type: 'ARTICLE_REVIEW' as const,
                    message: `${author?.name ?? 'A writer'} submitted "${newArticle.title}" for review`,
                    relatedId: newArticle.id,
                    userId: admin.id,
                })),
            });
        }

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
             select: { id: true, authorId: true, status: true, thumbnail: true }
        });

        if (!article) {
             return res.status(404).json({ message: 'Article not found' });
        }

        if (user.role === 'WRITER') {
             if (article.authorId !== user.userId) {
                  return res.status(403).json({ message: 'Access denied' });
             }
             if (article.status === 'PUBLISHED' || article.status === 'SCHEDULED') {
                  return res.status(403).json({ message: 'Writers can only delete non published articles' });
             }
        } else if (!isAdminRole(user.role)) {
             return res.status(403).json({ message: 'Access denied' });
        }

        if (article.thumbnail) {
            deleteThumbnailFile(article.thumbnail);
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

        if (user.role === 'WRITER') {
            if (article.authorId !== user.userId) {
                return res.status(403).json({ message: 'Access denied' });
            }

            if (!['DRAFT', 'REVIEW', 'REJECTED'].includes(article.status)) {
                return res.status(403).json({ message: 'Writers can only edit articles in DRAFT, REVIEW or REJECTED status' });
            }
        } else if (isAdminRole(user.role)) {
            if (article.authorId !== user.userId && article.status === 'DRAFT') {
                return res.status(403).json({ message: 'Admins cannot edit other users\' draft articles' });
            }
        } else {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { title, summary, content, categoryId, status, isFeatured, taskId, removeThumbnail, scheduledAt } = req.body;
        const contentDelta = parseContentDelta(req.body.contentDelta);
        const data: Prisma.ArticleUpdateInput = {};

        if (req.file) {
            if (article.thumbnail) {
                deleteThumbnailFile(article.thumbnail);
            }
            data.thumbnail = `/uploads/thumbnails/${req.file.filename}`;
        } else if (removeThumbnail === 'true') {
            if (article.thumbnail) {
                deleteThumbnailFile(article.thumbnail);
            }
            data.thumbnail = null;
        }

        if (title) {
            data.title = title;
            const slugBase = slugify(title, { lower: true, strict: true });
            let uniqueSlug = slugBase;
            let counter = 1;

            while (await prisma.article.findFirst({ where: { slug: uniqueSlug, NOT: { id } } })) {
                uniqueSlug = `${slugBase}-${counter}`;
                counter++;
            }
            data.slug = uniqueSlug;
        }
        if (summary) data.summary = summary;
        if (content) data.content = content;
        if (Object.prototype.hasOwnProperty.call(req.body, 'contentDelta')) {
            data.contentDelta = contentDelta ?? null;
        }
        if (categoryId) {
            data.category = {
                connect: { id: Number(categoryId) }
            };
        }
        if (isFeatured !== undefined) data.isFeatured = isFeatured === true || isFeatured === 'true';
        
        if (taskId !== undefined) { 
             data.task = taskId ? { connect: { id: Number(taskId) } } : { disconnect: true };
        }

        if (status) {
            if (user.role === 'WRITER' && !['DRAFT', 'REVIEW'].includes(status)) {
                return res.status(400).json({ message: 'Writers can only set status to DRAFT or REVIEW' });
            }

            if (isAdminRole(user.role) && status === 'REVIEW' && article.authorId === user.userId) {
                return res.status(400).json({ message: 'Admins cannot set their own articles to review status' });
            }
            
            if (status === 'PUBLISHED' && scheduledAt) {
                const scheduledDate = new Date(scheduledAt);
                if (scheduledDate > new Date()) {
                    data.status = 'SCHEDULED';
                    data.scheduledAt = scheduledDate;
                } else {
                    data.status = 'PUBLISHED';
                    data.scheduledAt = null;
                    if (article.publishedAt === null) {
                        data.publishedAt = new Date();
                    }
                }
            } else {
                data.status = status;
                if (status === 'PUBLISHED') {
                    data.scheduledAt = null;
                    if (article.publishedAt === null) {
                        data.publishedAt = new Date();
                    }
                }
            }
        }

        const updatedArticle = await prisma.article.update({
            where: { id },
            data,
        });

        if (updatedArticle.status === 'PUBLISHED' && article.taskId) {
            await prisma.task.update({
                where: { id: article.taskId },
                data: { isCompleted: true }
            });
        }

        // Notify all admins when an article is submitted for review
        if (updatedArticle.status === 'REVIEW' && article.status !== 'REVIEW') {
            const author = await prisma.user.findUnique({ where: { id: updatedArticle.authorId }, select: { name: true } });
            const admins = await prisma.user.findMany({ where: { role: { in: ['ADMIN', 'SUPERADMIN'] } } });
            await prisma.notification.createMany({
                data: admins.map((admin) => ({
                    type: 'ARTICLE_REVIEW' as const,
                    message: `${author?.name ?? 'A writer'} submitted "${updatedArticle.title}" for review`,
                    relatedId: updatedArticle.id,
                    userId: admin.id,
                })),
            });
        }

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

    const { status, rejectionReason, scheduledAt } = req.body;
    
    if (!status || (status !== 'PUBLISHED' && status !== 'REJECTED')) {
        return res.status(400).json({ message: 'Status must be either PUBLISHED or REJECTED' });
    }

    try {
        const user = (req as Request & { user?: { userId: number; role: string } }).user;
        
        if (!user || !isAdminRole(user.role)) {
            return res.status(403).json({ message: 'Access denied. Only Admins can review articles.' });
        }

        const article = await prisma.article.findUnique({
            where: { id },
        });

        if (!article) {
            return res.status(404).json({ message: 'Article not found' });
        }

        if (article.status === 'DRAFT') {
            return res.status(403).json({ message: 'Cannot review articles that are still in draft' });
        }

        if (article.authorId === user.userId) {
            return res.status(403).json({ message: 'Admins cannot review their own articles' });
        }

        const data: Prisma.ArticleUpdateInput = { status };
        
        if (status === 'PUBLISHED') {
            if (scheduledAt) {
                const scheduledDate = new Date(scheduledAt);
                if (scheduledDate > new Date()) {
                    data.status = 'SCHEDULED';
                    data.scheduledAt = scheduledDate;
                } else {
                    data.publishedAt = new Date();
                    data.scheduledAt = null;
                }
            } else {
                data.publishedAt = new Date();
                data.scheduledAt = null;
            }
        } else if (status === 'REJECTED' && rejectionReason) {
             data.rejectionReason = rejectionReason;
             data.scheduledAt = null;
        }

        const updatedArticle = await prisma.article.update({
            where: { id },
            data,
        });

        if (updatedArticle.status === 'PUBLISHED' && article.taskId) {
            await prisma.task.update({
                where: { id: article.taskId },
                data: { isCompleted: true }
            });
        }

        res.status(200).json(updatedArticle);
    } catch (error) {
        next(error);
    }
};