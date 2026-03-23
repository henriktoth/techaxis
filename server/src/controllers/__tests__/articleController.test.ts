import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextFunction, Request, Response } from 'express';

const { mockPrisma, mockDeleteThumbnailFile } = vi.hoisted(() => ({
  mockPrisma: {
    article: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    },
    category: {
      findUnique: vi.fn(),
    },
    task: {
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    notification: {
      createMany: vi.fn(),
    },
  },
  mockDeleteThumbnailFile: vi.fn(),
}));

vi.mock('../../config/db.config', () => ({
  prisma: mockPrisma,
}));

vi.mock('../../config/upload.config', () => ({
  deleteThumbnailFile: mockDeleteThumbnailFile,
}));

import {
  addArticle,
  deleteArticle,
  getArticleForUserById,
  getArticleStats,
  getArticlesForUser,
  getPublishedArticleById,
  getPublishedArticles,
  reviewArticle,
  updateArticle,
} from '../articleController';

type AuthUser = { userId: number; role: string };
type TestRequest = Partial<Request> & {
  user?: AuthUser;
  file?: { filename: string };
  body: Record<string, unknown>;
  params: Record<string, string>;
  query: Record<string, string>;
};

type TestResponse = Response & {
  status: ReturnType<typeof vi.fn>;
  json: ReturnType<typeof vi.fn>;
};

const createReq = (overrides: Partial<TestRequest> = {}): Request => {
  return {
    params: {},
    query: {},
    body: {},
    ...overrides,
  } as unknown as Request;
};

const createRes = (): TestResponse => {
  const res = {} as TestResponse;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const createNext = (): NextFunction => vi.fn() as unknown as NextFunction;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('articleController unit tests', () => {
  describe('getPublishedArticles', () => {
    it('returns paginated published articles with filters', async () => {
      const req = createReq({
        query: { search: 'react', categoryId: '2', page: '2', limit: '5' },
      });
      const res = createRes();
      const next = createNext();

      mockPrisma.article.findMany.mockResolvedValue([{ id: 1, title: 'React tips' }]);
      mockPrisma.article.count.mockResolvedValue(11);

      await getPublishedArticles(req, res, next);

      expect(mockPrisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'PUBLISHED',
            categoryId: 2,
            title: expect.objectContaining({ contains: 'react', mode: 'insensitive' }),
          }),
          skip: 5,
          take: 5,
        }),
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: [{ id: 1, title: 'React tips' }],
          meta: expect.objectContaining({ total: 11, page: 2, limit: 5, totalPages: 3 }),
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('forwards database errors to next', async () => {
      const req = createReq();
      const res = createRes();
      const next = createNext();
      const dbError = new Error('db failed');

      mockPrisma.article.findMany.mockRejectedValue(dbError);

      await getPublishedArticles(req, res, next);

      expect(next).toHaveBeenCalledWith(dbError);
    });

    it('ignores invalid categoryId query values', async () => {
      const req = createReq({ query: { categoryId: 'not-a-number' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.article.findMany.mockResolvedValue([]);
      mockPrisma.article.count.mockResolvedValue(0);

      await getPublishedArticles(req, res, next);

      expect(mockPrisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'PUBLISHED' },
        }),
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getPublishedArticleById', () => {
    it('returns a published article by numeric id', async () => {
      const req = createReq({ params: { id: '7' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.article.findUnique.mockResolvedValue({ id: 7, status: 'PUBLISHED' });

      await getPublishedArticleById(req, res, next);

      expect(mockPrisma.article.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 7 } }),
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ id: 7, status: 'PUBLISHED' });
    });

    it('returns 404 when article is missing or not published', async () => {
      const req = createReq({ params: { id: 'my-slug' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.article.findUnique.mockResolvedValue({ id: 7, status: 'DRAFT' });

      await getPublishedArticleById(req, res, next);

      expect(mockPrisma.article.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { slug: 'my-slug' } }),
      );
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Article not found' });
      expect(next).not.toHaveBeenCalled();
    });

    it('forwards errors from article lookup', async () => {
      const req = createReq({ params: { id: '5' } });
      const res = createRes();
      const next = createNext();
      const error = new Error('lookup failed');

      mockPrisma.article.findUnique.mockRejectedValue(error);

      await getPublishedArticleById(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getArticlesForUser', () => {
    it('returns 401 when user is missing', async () => {
      const req = createReq();
      const res = createRes();
      const next = createNext();

      await getArticlesForUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Authentication required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns writer articles using role constraints and filters', async () => {
      const req = createReq({
        user: { userId: 10, role: 'WRITER' },
        query: { search: 'news', status: 'review', page: '1', limit: '10' },
      });
      const res = createRes();
      const next = createNext();

      mockPrisma.article.findMany.mockResolvedValue([{ id: 2, title: 'News' }]);
      mockPrisma.article.count.mockResolvedValue(1);

      await getArticlesForUser(req, res, next);

      expect(mockPrisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            authorId: 10,
            status: 'REVIEW',
            OR: expect.any(Array),
          }),
        }),
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ meta: expect.objectContaining({ total: 1 }) }),
      );
    });

    it('returns 403 for unsupported roles', async () => {
      const req = createReq({ user: { userId: 3, role: 'READER' } });
      const res = createRes();
      const next = createNext();

      await getArticlesForUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Access denied' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns admin articles and applies authorId filter', async () => {
      const req = createReq({
        user: { userId: 1, role: 'SUPERADMIN' },
        query: { authorId: '42' },
      });
      const res = createRes();
      const next = createNext();

      mockPrisma.article.findMany.mockResolvedValue([{ id: 100 }]);
      mockPrisma.article.count.mockResolvedValue(1);

      await getArticlesForUser(req, res, next);

      expect(mockPrisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ authorId: 42 }),
        }),
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('forwards errors to next', async () => {
      const req = createReq({ user: { userId: 10, role: 'WRITER' } });
      const res = createRes();
      const next = createNext();
      const error = new Error('list failed');

      mockPrisma.article.findMany.mockRejectedValue(error);

      await getArticlesForUser(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getArticleForUserById', () => {
    it('returns 400 for invalid article id', async () => {
      const req = createReq({ params: { id: 'abc' } });
      const res = createRes();
      const next = createNext();

      await getArticleForUserById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid article id' });
      expect(next).not.toHaveBeenCalled();
    });

    it('lets a writer access only their own article', async () => {
      const req = createReq({ params: { id: '4' }, user: { userId: 22, role: 'WRITER' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.article.findUnique.mockResolvedValue({ id: 4, authorId: 11 });

      await getArticleForUserById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Access denied' });
    });

    it('returns 401 when user is missing', async () => {
      const req = createReq({ params: { id: '4' } });
      const res = createRes();
      const next = createNext();

      await getArticleForUserById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Authentication required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 404 when article is not found', async () => {
      const req = createReq({ params: { id: '4' }, user: { userId: 1, role: 'ADMIN' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.article.findUnique.mockResolvedValue(null);

      await getArticleForUserById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Article not found' });
    });

    it('returns article for admins', async () => {
      const req = createReq({ params: { id: '9' }, user: { userId: 1, role: 'ADMIN' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.article.findUnique.mockResolvedValue({ id: 9, authorId: 5 });

      await getArticleForUserById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ id: 9, authorId: 5 });
    });

    it('forwards lookup errors to next', async () => {
      const req = createReq({ params: { id: '4' }, user: { userId: 1, role: 'ADMIN' } });
      const res = createRes();
      const next = createNext();
      const error = new Error('failed');

      mockPrisma.article.findUnique.mockRejectedValue(error);

      await getArticleForUserById(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getArticleStats', () => {
    it('returns writer-scoped counts', async () => {
      const req = createReq({ user: { userId: 8, role: 'WRITER' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.article.count
        .mockResolvedValueOnce(9)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(4)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(1);

      await getArticleStats(req, res, next);

      expect(mockPrisma.article.count).toHaveBeenNthCalledWith(1, { where: { authorId: 8 } });
      expect(res.json).toHaveBeenCalledWith({ total: 9, published: 3, draft: 4, review: 1, scheduled: 1 });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when unauthenticated', async () => {
      const req = createReq();
      const res = createRes();
      const next = createNext();

      await getArticleStats(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Authentication required' });
    });

    it('returns 403 for unsupported roles', async () => {
      const req = createReq({ user: { userId: 8, role: 'READER' } });
      const res = createRes();
      const next = createNext();

      await getArticleStats(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Access denied' });
    });

    it('forwards count errors to next', async () => {
      const req = createReq({ user: { userId: 1, role: 'ADMIN' } });
      const res = createRes();
      const next = createNext();
      const error = new Error('stats failed');

      mockPrisma.article.count.mockRejectedValue(error);

      await getArticleStats(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('addArticle', () => {
    it('returns 400 for missing required fields', async () => {
      const req = createReq({ user: { userId: 2, role: 'WRITER' }, body: { title: 'Only title' } });
      const res = createRes();
      const next = createNext();

      await addArticle(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Title, summary, and content are required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when user is missing', async () => {
      const req = createReq({
        body: {
          title: 'My title',
          summary: 'My summary',
          content: 'My content',
        },
      });
      const res = createRes();
      const next = createNext();

      await addArticle(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Authentication required' });
    });

    it('rejects invalid writer status', async () => {
      const req = createReq({
        user: { userId: 2, role: 'WRITER' },
        body: {
          title: 'My title',
          summary: 'My summary',
          content: 'My content',
          status: 'PUBLISHED',
        },
      });
      const res = createRes();
      const next = createNext();

      await addArticle(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Writers can only create articles with DRAFT or REVIEW status',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('creates article with unique slug, parsed delta, default category and task completion', async () => {
      const req = createReq({
        user: { userId: 9, role: 'ADMIN' },
        body: {
          title: 'Hello World',
          summary: 'Summary',
          content: 'Body',
          status: 'PUBLISHED',
          contentDelta: '{"ops":[{"insert":"hello"}]}',
          isFeatured: 'true',
          taskId: '44',
        },
        file: { filename: 'cover.jpg' },
      });
      const res = createRes();
      const next = createNext();

      mockPrisma.article.findUnique
        .mockResolvedValueOnce({ id: 1 })
        .mockResolvedValueOnce(null);
      mockPrisma.category.findUnique.mockResolvedValue({ id: 99, name: 'Other' });
      mockPrisma.article.create.mockResolvedValue({ id: 50, status: 'PUBLISHED', title: 'Hello World' });

      await addArticle(req, res, next);

      expect(mockPrisma.article.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            slug: 'hello-world-1',
            categoryId: 99,
            isFeatured: true,
            taskId: 44,
            thumbnail: '/uploads/thumbnails/cover.jpg',
            contentDelta: { ops: [{ insert: 'hello' }] },
          }),
        }),
      );
      expect(mockPrisma.task.update).toHaveBeenCalledWith({
        where: { id: 44 },
        data: { isCompleted: true },
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ id: 50, status: 'PUBLISHED', title: 'Hello World' });
      expect(next).not.toHaveBeenCalled();
    });

    it('creates review notifications when article enters review', async () => {
      const req = createReq({
        user: { userId: 9, role: 'WRITER' },
        body: {
          title: 'Needs Review',
          summary: 'Summary',
          content: 'Body',
          status: 'REVIEW',
        },
      });
      const res = createRes();
      const next = createNext();

      mockPrisma.article.findUnique.mockResolvedValue(null);
      mockPrisma.category.findUnique.mockResolvedValue({ id: 99, name: 'Other' });
      mockPrisma.article.create.mockResolvedValue({ id: 60, status: 'REVIEW', title: 'Needs Review' });
      mockPrisma.user.findUnique.mockResolvedValue({ name: 'Jane Writer' });
      mockPrisma.user.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }]);

      await addArticle(req, res, next);

      expect(mockPrisma.notification.createMany).toHaveBeenCalledWith({
        data: [
          {
            type: 'ARTICLE_REVIEW',
            message: 'Jane Writer submitted "Needs Review" for review',
            relatedId: 60,
            userId: 1,
          },
          {
            type: 'ARTICLE_REVIEW',
            message: 'Jane Writer submitted "Needs Review" for review',
            relatedId: 60,
            userId: 2,
          },
        ],
      });
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('rejects admin creating review articles', async () => {
      const req = createReq({
        user: { userId: 9, role: 'ADMIN' },
        body: {
          title: 'Needs Review',
          summary: 'Summary',
          content: 'Body',
          status: 'REVIEW',
        },
      });
      const res = createRes();
      const next = createNext();

      await addArticle(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Admins cannot set their own articles to review status' });
    });

    it('returns 400 when categoryId is invalid', async () => {
      const req = createReq({
        user: { userId: 9, role: 'WRITER' },
        body: {
          title: 'New article',
          summary: 'Summary',
          content: 'Body',
          categoryId: '999',
        },
      });
      const res = createRes();
      const next = createNext();

      mockPrisma.article.findUnique.mockResolvedValue(null);
      mockPrisma.category.findUnique.mockResolvedValue(null);

      await addArticle(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid category ID' });
      expect(mockPrisma.article.create).not.toHaveBeenCalled();
    });

    it('creates scheduled articles when future scheduledAt is provided', async () => {
      const future = new Date(Date.now() + 60_000).toISOString();
      const req = createReq({
        user: { userId: 9, role: 'ADMIN' },
        body: {
          title: 'Scheduled story',
          summary: 'Summary',
          content: 'Body',
          status: 'PUBLISHED',
          scheduledAt: future,
        },
      });
      const res = createRes();
      const next = createNext();

      mockPrisma.article.findUnique.mockResolvedValue(null);
      mockPrisma.category.findUnique.mockResolvedValue({ id: 99, name: 'Other' });
      mockPrisma.article.create.mockResolvedValue({ id: 77, status: 'SCHEDULED' });

      await addArticle(req, res, next);

      expect(mockPrisma.article.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'SCHEDULED',
            scheduledAt: expect.any(Date),
          }),
        }),
      );
      expect(mockPrisma.task.update).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('forwards creation errors to next', async () => {
      const req = createReq({
        user: { userId: 9, role: 'WRITER' },
        body: {
          title: 'Any title',
          summary: 'Summary',
          content: 'Body',
        },
      });
      const res = createRes();
      const next = createNext();
      const error = new Error('create failed');

      mockPrisma.article.findUnique.mockResolvedValue(null);
      mockPrisma.category.findUnique.mockResolvedValue({ id: 99, name: 'Other' });
      mockPrisma.article.create.mockRejectedValue(error);

      await addArticle(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('deleteArticle', () => {
    it('allows writer to delete own draft and removes thumbnail', async () => {
      const req = createReq({ params: { id: '15' }, user: { userId: 4, role: 'WRITER' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.article.findUnique.mockResolvedValue({
        id: 15,
        authorId: 4,
        status: 'DRAFT',
        thumbnail: '/uploads/thumbnails/img.jpg',
      });
      mockPrisma.article.delete.mockResolvedValue({ id: 15 });

      await deleteArticle(req, res, next);

      expect(mockDeleteThumbnailFile).toHaveBeenCalledWith('/uploads/thumbnails/img.jpg');
      expect(mockPrisma.article.delete).toHaveBeenCalledWith({ where: { id: 15 } });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ id: 15 });
      expect(next).not.toHaveBeenCalled();
    });

    it('blocks writer from deleting published articles', async () => {
      const req = createReq({ params: { id: '16' }, user: { userId: 4, role: 'WRITER' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.article.findUnique.mockResolvedValue({
        id: 16,
        authorId: 4,
        status: 'PUBLISHED',
        thumbnail: null,
      });

      await deleteArticle(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Writers can only delete non published articles' });
      expect(mockPrisma.article.delete).not.toHaveBeenCalled();
    });

    it('returns 400 when id is invalid', async () => {
      const req = createReq({ params: { id: 'abc' }, user: { userId: 4, role: 'WRITER' } });
      const res = createRes();
      const next = createNext();

      await deleteArticle(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid article id' });
      expect(mockPrisma.article.findUnique).not.toHaveBeenCalled();
    });

    it('returns 401 when user is missing', async () => {
      const req = createReq({ params: { id: '16' } });
      const res = createRes();
      const next = createNext();

      await deleteArticle(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Authentication required' });
    });

    it('returns 404 when article does not exist', async () => {
      const req = createReq({ params: { id: '16' }, user: { userId: 4, role: 'ADMIN' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.article.findUnique.mockResolvedValue(null);

      await deleteArticle(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Article not found' });
    });

    it('returns 403 when writer attempts to delete another user article', async () => {
      const req = createReq({ params: { id: '16' }, user: { userId: 4, role: 'WRITER' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.article.findUnique.mockResolvedValue({
        id: 16,
        authorId: 99,
        status: 'DRAFT',
        thumbnail: null,
      });

      await deleteArticle(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Access denied' });
    });

    it('allows admin deletion', async () => {
      const req = createReq({ params: { id: '17' }, user: { userId: 1, role: 'SUPERADMIN' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.article.findUnique.mockResolvedValue({
        id: 17,
        authorId: 55,
        status: 'PUBLISHED',
        thumbnail: null,
      });
      mockPrisma.article.delete.mockResolvedValue({ id: 17 });

      await deleteArticle(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ id: 17 });
    });

    it('forwards deletion errors to next', async () => {
      const req = createReq({ params: { id: '16' }, user: { userId: 4, role: 'ADMIN' } });
      const res = createRes();
      const next = createNext();
      const error = new Error('delete failed');

      mockPrisma.article.findUnique.mockResolvedValue({ id: 16, authorId: 4, status: 'DRAFT', thumbnail: null });
      mockPrisma.article.delete.mockRejectedValue(error);

      await deleteArticle(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('updateArticle', () => {
    it('prevents writers from setting invalid status transitions', async () => {
      const req = createReq({
        params: { id: '30' },
        user: { userId: 3, role: 'WRITER' },
        body: { status: 'PUBLISHED' },
      });
      const res = createRes();
      const next = createNext();

      mockPrisma.article.findUnique.mockResolvedValue({
        id: 30,
        authorId: 3,
        status: 'DRAFT',
        publishedAt: null,
        taskId: null,
        thumbnail: null,
      });

      await updateArticle(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Writers can only set status to DRAFT or REVIEW' });
      expect(mockPrisma.article.update).not.toHaveBeenCalled();
    });

    it('updates article and marks existing task complete when published', async () => {
      const req = createReq({
        params: { id: '31' },
        user: { userId: 3, role: 'ADMIN' },
        body: { status: 'PUBLISHED', title: 'New Title', removeThumbnail: 'true' },
      });
      const res = createRes();
      const next = createNext();

      mockPrisma.article.findUnique.mockResolvedValue({
        id: 31,
        authorId: 3,
        status: 'REVIEW',
        publishedAt: null,
        taskId: 8,
        thumbnail: '/uploads/thumbnails/old.jpg',
      });
      mockPrisma.article.findFirst.mockResolvedValue(null);
      mockPrisma.article.update.mockResolvedValue({
        id: 31,
        title: 'New Title',
        authorId: 3,
        status: 'PUBLISHED',
      });

      await updateArticle(req, res, next);

      expect(mockDeleteThumbnailFile).toHaveBeenCalledWith('/uploads/thumbnails/old.jpg');
      expect(mockPrisma.article.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 31 },
          data: expect.objectContaining({
            title: 'New Title',
            slug: 'new-title',
            thumbnail: null,
            status: 'PUBLISHED',
          }),
        }),
      );
      expect(mockPrisma.task.update).toHaveBeenCalledWith({
        where: { id: 8 },
        data: { isCompleted: true },
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('returns 400 when id is invalid', async () => {
      const req = createReq({ params: { id: 'nope' }, user: { userId: 3, role: 'WRITER' } });
      const res = createRes();
      const next = createNext();

      await updateArticle(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid article id' });
    });

    it('returns 401 when unauthenticated', async () => {
      const req = createReq({ params: { id: '31' } });
      const res = createRes();
      const next = createNext();

      await updateArticle(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Authentication required' });
    });

    it('returns 404 when target article is missing', async () => {
      const req = createReq({ params: { id: '31' }, user: { userId: 3, role: 'ADMIN' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.article.findUnique.mockResolvedValue(null);

      await updateArticle(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Article not found' });
    });

    it('blocks writer editing someone else article', async () => {
      const req = createReq({ params: { id: '31' }, user: { userId: 3, role: 'WRITER' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.article.findUnique.mockResolvedValue({ id: 31, authorId: 30, status: 'DRAFT' });

      await updateArticle(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Access denied' });
    });

    it('blocks writer editing published articles', async () => {
      const req = createReq({ params: { id: '31' }, user: { userId: 3, role: 'WRITER' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.article.findUnique.mockResolvedValue({ id: 31, authorId: 3, status: 'PUBLISHED' });

      await updateArticle(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Writers can only edit articles in DRAFT, REVIEW or REJECTED status',
      });
    });

    it('blocks admin editing other user draft article', async () => {
      const req = createReq({ params: { id: '31' }, user: { userId: 3, role: 'ADMIN' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.article.findUnique.mockResolvedValue({ id: 31, authorId: 7, status: 'DRAFT' });

      await updateArticle(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Admins cannot edit other users\' draft articles' });
    });

    it('returns 403 for unsupported roles', async () => {
      const req = createReq({ params: { id: '31' }, user: { userId: 3, role: 'READER' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.article.findUnique.mockResolvedValue({ id: 31, authorId: 3, status: 'REVIEW' });

      await updateArticle(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Access denied' });
    });

    it('notifies admins when an article moves into review', async () => {
      const req = createReq({
        params: { id: '32' },
        user: { userId: 3, role: 'WRITER' },
        body: { status: 'REVIEW' },
      });
      const res = createRes();
      const next = createNext();

      mockPrisma.article.findUnique.mockResolvedValue({
        id: 32,
        authorId: 3,
        title: 'Draft title',
        status: 'DRAFT',
        publishedAt: null,
        taskId: null,
        thumbnail: null,
      });
      mockPrisma.article.update.mockResolvedValue({
        id: 32,
        title: 'Draft title',
        authorId: 3,
        status: 'REVIEW',
      });
      mockPrisma.user.findUnique.mockResolvedValue({ name: 'Writer Name' });
      mockPrisma.user.findMany.mockResolvedValue([{ id: 90 }, { id: 91 }]);

      await updateArticle(req, res, next);

      expect(mockPrisma.notification.createMany).toHaveBeenCalledWith({
        data: [
          {
            type: 'ARTICLE_REVIEW',
            message: 'Writer Name submitted "Draft title" for review',
            relatedId: 32,
            userId: 90,
          },
          {
            type: 'ARTICLE_REVIEW',
            message: 'Writer Name submitted "Draft title" for review',
            relatedId: 32,
            userId: 91,
          },
        ],
      });
    });

    it('forwards update errors to next', async () => {
      const req = createReq({ params: { id: '31' }, user: { userId: 3, role: 'ADMIN' } });
      const res = createRes();
      const next = createNext();
      const error = new Error('update failed');

      mockPrisma.article.findUnique.mockResolvedValue({
        id: 31,
        authorId: 3,
        status: 'REVIEW',
        publishedAt: null,
        taskId: null,
        thumbnail: null,
      });
      mockPrisma.article.update.mockRejectedValue(error);

      await updateArticle(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('reviewArticle', () => {
    it('rejects invalid status values', async () => {
      const req = createReq({ params: { id: '4' }, body: { status: 'DRAFT' } });
      const res = createRes();
      const next = createNext();

      await reviewArticle(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Status must be either PUBLISHED or REJECTED' });
      expect(next).not.toHaveBeenCalled();
    });

    it('prevents admins from reviewing their own article', async () => {
      const req = createReq({
        params: { id: '5' },
        body: { status: 'PUBLISHED' },
        user: { userId: 1, role: 'ADMIN' },
      });
      const res = createRes();
      const next = createNext();

      mockPrisma.article.findUnique.mockResolvedValue({ id: 5, authorId: 1, status: 'REVIEW', taskId: null });

      await reviewArticle(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Admins cannot review their own articles' });
      expect(mockPrisma.article.update).not.toHaveBeenCalled();
    });

    it('schedules publication when a future date is provided', async () => {
      const future = new Date(Date.now() + 60_000).toISOString();
      const req = createReq({
        params: { id: '6' },
        body: { status: 'PUBLISHED', scheduledAt: future },
        user: { userId: 2, role: 'SUPERADMIN' },
      });
      const res = createRes();
      const next = createNext();

      mockPrisma.article.findUnique.mockResolvedValue({ id: 6, authorId: 20, status: 'REVIEW', taskId: null });
      mockPrisma.article.update.mockResolvedValue({ id: 6, status: 'SCHEDULED' });

      await reviewArticle(req, res, next);

      expect(mockPrisma.article.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 6 },
          data: expect.objectContaining({ status: 'SCHEDULED', scheduledAt: expect.any(Date) }),
        }),
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ id: 6, status: 'SCHEDULED' });
    });

    it('returns 400 when id is invalid', async () => {
      const req = createReq({ params: { id: 'abc' }, body: { status: 'PUBLISHED' } });
      const res = createRes();
      const next = createNext();

      await reviewArticle(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid article id' });
    });

    it('returns 403 when user is not admin', async () => {
      const req = createReq({
        params: { id: '10' },
        body: { status: 'PUBLISHED' },
        user: { userId: 1, role: 'WRITER' },
      });
      const res = createRes();
      const next = createNext();

      await reviewArticle(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Access denied. Only Admins can review articles.' });
    });

    it('returns 404 when article is missing', async () => {
      const req = createReq({
        params: { id: '10' },
        body: { status: 'PUBLISHED' },
        user: { userId: 2, role: 'ADMIN' },
      });
      const res = createRes();
      const next = createNext();

      mockPrisma.article.findUnique.mockResolvedValue(null);

      await reviewArticle(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Article not found' });
    });

    it('blocks reviewing draft articles', async () => {
      const req = createReq({
        params: { id: '10' },
        body: { status: 'PUBLISHED' },
        user: { userId: 2, role: 'ADMIN' },
      });
      const res = createRes();
      const next = createNext();

      mockPrisma.article.findUnique.mockResolvedValue({ id: 10, authorId: 22, status: 'DRAFT' });

      await reviewArticle(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Cannot review articles that are still in draft' });
    });

    it('publishes immediately and marks linked task as completed', async () => {
      const req = createReq({
        params: { id: '11' },
        body: { status: 'PUBLISHED' },
        user: { userId: 2, role: 'ADMIN' },
      });
      const res = createRes();
      const next = createNext();

      mockPrisma.article.findUnique.mockResolvedValue({ id: 11, authorId: 22, status: 'REVIEW', taskId: 66 });
      mockPrisma.article.update.mockResolvedValue({ id: 11, status: 'PUBLISHED' });

      await reviewArticle(req, res, next);

      expect(mockPrisma.article.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'PUBLISHED', publishedAt: expect.any(Date), scheduledAt: null }),
        }),
      );
      expect(mockPrisma.task.update).toHaveBeenCalledWith({
        where: { id: 66 },
        data: { isCompleted: true },
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('stores rejection reason when rejecting article', async () => {
      const req = createReq({
        params: { id: '12' },
        body: { status: 'REJECTED', rejectionReason: 'Not aligned' },
        user: { userId: 2, role: 'SUPERADMIN' },
      });
      const res = createRes();
      const next = createNext();

      mockPrisma.article.findUnique.mockResolvedValue({ id: 12, authorId: 3, status: 'REVIEW', taskId: null });
      mockPrisma.article.update.mockResolvedValue({ id: 12, status: 'REJECTED' });

      await reviewArticle(req, res, next);

      expect(mockPrisma.article.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 12 },
          data: expect.objectContaining({ status: 'REJECTED', rejectionReason: 'Not aligned', scheduledAt: null }),
        }),
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('forwards review errors to next', async () => {
      const req = createReq({
        params: { id: '12' },
        body: { status: 'REJECTED' },
        user: { userId: 2, role: 'SUPERADMIN' },
      });
      const res = createRes();
      const next = createNext();
      const error = new Error('review failed');

      mockPrisma.article.findUnique.mockResolvedValue({ id: 12, authorId: 3, status: 'REVIEW', taskId: null });
      mockPrisma.article.update.mockRejectedValue(error);

      await reviewArticle(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
