import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextFunction, Request, Response } from 'express';

const {
  mockPrisma,
  mockGetPaginationParams,
  mockCreatePaginatedResponse,
  mockDeleteThumbnailFile,
  mockIsAdminRole,
  mockParseContentDelta,
  mockSlugify,
} = vi.hoisted(() => ({
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
  mockGetPaginationParams: vi.fn(),
  mockCreatePaginatedResponse: vi.fn(),
  mockDeleteThumbnailFile: vi.fn(),
  mockIsAdminRole: vi.fn(),
  mockParseContentDelta: vi.fn(),
  mockSlugify: vi.fn(),
}));

vi.mock('../../config/db.config', () => ({
  prisma: mockPrisma,
}));

vi.mock('../../utils/pagination', () => ({
  getPaginationParams: mockGetPaginationParams,
  createPaginatedResponse: mockCreatePaginatedResponse,
}));

vi.mock('../../config/upload.config', () => ({
  deleteThumbnailFile: mockDeleteThumbnailFile,
}));

vi.mock('../../utils/roles', () => ({
  isAdminRole: mockIsAdminRole,
}));

vi.mock('../../utils/contentDelta', () => ({
  parseContentDelta: mockParseContentDelta,
}));

vi.mock('slugify', () => ({
  default: mockSlugify,
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
  params: Record<string, string>;
  query: Record<string, string>;
  body: Record<string, unknown>;
  file?: { filename: string } | null;
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
  mockIsAdminRole.mockReturnValue(false);
  mockParseContentDelta.mockReturnValue('delta');
  mockSlugify.mockReturnValue('test-title');
});

describe('articleController unit tests', () => {
  describe('getPublishedArticles', () => {
    it('returns paginated published articles', async () => {
      const req = createReq({ query: { search: 'react', categoryId: '3' } });
      const res = createRes();
      const next = createNext();

      mockGetPaginationParams.mockReturnValue({ page: 1, limit: 10, skip: 0 });
      mockPrisma.article.findMany.mockResolvedValue([{ id: 1, title: 'React' }]);
      mockPrisma.article.count.mockResolvedValue(1);
      mockCreatePaginatedResponse.mockReturnValue({ data: [{ id: 1 }], meta: { total: 1 } });

      await getPublishedArticles(req, res, next);

      expect(mockPrisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: 'PUBLISHED',
            title: { contains: 'react', mode: 'insensitive' },
            categoryId: 3,
          },
          skip: 0,
          take: 10,
        }),
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ data: [{ id: 1 }], meta: { total: 1 } });
      expect(next).not.toHaveBeenCalled();
    });

    it('forwards errors to next', async () => {
      const req = createReq();
      const res = createRes();
      const next = createNext();
      const error = new Error('fetch failed');

      mockGetPaginationParams.mockReturnValue({ page: 1, limit: 10, skip: 0 });
      mockPrisma.article.findMany.mockRejectedValue(error);

      await getPublishedArticles(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getPublishedArticleById', () => {
    it('returns 404 when article is not published', async () => {
      const req = createReq({ params: { id: '10' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.article.findUnique.mockResolvedValue({ id: 10, status: 'DRAFT' });

      await getPublishedArticleById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Article not found' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns article by slug when published', async () => {
      const req = createReq({ params: { id: 'my-slug' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.article.findUnique.mockResolvedValue({ id: 11, status: 'PUBLISHED' });

      await getPublishedArticleById(req, res, next);

      expect(mockPrisma.article.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { slug: 'my-slug' } }),
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ id: 11, status: 'PUBLISHED' });
      expect(next).not.toHaveBeenCalled();
    });

    it('forwards errors to next', async () => {
      const req = createReq({ params: { id: '1' } });
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

    it('returns 403 for non-admin and non-writer roles', async () => {
      const req = createReq({ user: { userId: 2, role: 'READER' } });
      const res = createRes();
      const next = createNext();

      await getArticlesForUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Access denied' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns paginated articles for admin', async () => {
      const req = createReq({
        user: { userId: 1, role: 'ADMIN' },
        query: { search: 'node', status: 'published', authorId: '7' },
      });
      const res = createRes();
      const next = createNext();

      mockIsAdminRole.mockReturnValue(true);
      mockGetPaginationParams.mockReturnValue({ page: 2, limit: 5, skip: 5 });
      mockPrisma.article.findMany.mockResolvedValue([{ id: 5 }]);
      mockPrisma.article.count.mockResolvedValue(1);
      mockCreatePaginatedResponse.mockReturnValue({ data: [{ id: 5 }], meta: { total: 1 } });

      await getArticlesForUser(req, res, next);

      expect(mockPrisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            authorId: 7,
            status: 'PUBLISHED',
            OR: expect.any(Array),
          }),
          skip: 5,
          take: 5,
        }),
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ data: [{ id: 5 }], meta: { total: 1 } });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('getArticleForUserById', () => {
    it('returns 400 for invalid id', async () => {
      const req = createReq({ params: { id: 'bad' } });
      const res = createRes();
      const next = createNext();

      await getArticleForUserById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid article id' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when user is missing', async () => {
      const req = createReq({ params: { id: '3' } });
      const res = createRes();
      const next = createNext();

      await getArticleForUserById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Authentication required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 404 when article is missing', async () => {
      const req = createReq({ params: { id: '3' }, user: { userId: 1, role: 'ADMIN' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.article.findUnique.mockResolvedValue(null);

      await getArticleForUserById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Article not found' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 403 when writer is not owner', async () => {
      const req = createReq({ params: { id: '3' }, user: { userId: 2, role: 'WRITER' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.article.findUnique.mockResolvedValue({ id: 3, authorId: 5 });

      await getArticleForUserById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Access denied' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns article for admin', async () => {
      const req = createReq({ params: { id: '3' }, user: { userId: 1, role: 'ADMIN' } });
      const res = createRes();
      const next = createNext();

      mockIsAdminRole.mockReturnValue(true);
      mockPrisma.article.findUnique.mockResolvedValue({ id: 3, authorId: 5 });

      await getArticleForUserById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ id: 3, authorId: 5 });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('getArticleStats', () => {
    it('returns 401 when user is missing', async () => {
      const req = createReq();
      const res = createRes();
      const next = createNext();

      await getArticleStats(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Authentication required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 403 for unsupported roles', async () => {
      const req = createReq({ user: { userId: 3, role: 'READER' } });
      const res = createRes();
      const next = createNext();

      await getArticleStats(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Access denied' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns stats for writer', async () => {
      const req = createReq({ user: { userId: 3, role: 'WRITER' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.article.count.mockResolvedValueOnce(10);
      mockPrisma.article.count.mockResolvedValueOnce(3);
      mockPrisma.article.count.mockResolvedValueOnce(4);
      mockPrisma.article.count.mockResolvedValueOnce(2);
      mockPrisma.article.count.mockResolvedValueOnce(1);

      await getArticleStats(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        total: 10,
        published: 3,
        draft: 4,
        review: 2,
        scheduled: 1,
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('addArticle', () => {
    it('returns 401 when user is missing', async () => {
      const req = createReq();
      const res = createRes();
      const next = createNext();

      await addArticle(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Authentication required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 400 when required fields are missing', async () => {
      const req = createReq({ user: { userId: 5, role: 'WRITER' }, body: { title: 'Title' } });
      const res = createRes();
      const next = createNext();

      await addArticle(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Title, summary, and content are required',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 400 when writer sets invalid status', async () => {
      const req = createReq({
        user: { userId: 5, role: 'WRITER' },
        body: { title: 'Title', summary: 'Summary', content: 'Content', status: 'PUBLISHED' },
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

    it('creates article for writer with default category', async () => {
      const req = createReq({
        user: { userId: 5, role: 'WRITER' },
        body: { title: 'Title', summary: 'Summary', content: 'Content' },
      });
      const res = createRes();
      const next = createNext();

      mockPrisma.article.findUnique.mockResolvedValue(null);
      mockPrisma.category.findUnique.mockResolvedValue({ id: 5, name: 'Other' });
      mockPrisma.article.create.mockResolvedValue({ id: 9, title: 'Title', status: 'DRAFT' });

      await addArticle(req, res, next);

      expect(mockPrisma.article.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Title',
            summary: 'Summary',
            content: 'Content',
            slug: 'test-title',
            authorId: 5,
            categoryId: 5,
          }),
        }),
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ id: 9, title: 'Title', status: 'DRAFT' });
      expect(next).not.toHaveBeenCalled();
    });

    it('forwards errors to next', async () => {
      const req = createReq({
        user: { userId: 5, role: 'WRITER' },
        body: { title: 'Title', summary: 'Summary', content: 'Content' },
      });
      const res = createRes();
      const next = createNext();
      const error = new Error('create failed');

      mockPrisma.article.findUnique.mockResolvedValue(null);
      mockPrisma.category.findUnique.mockResolvedValue({ id: 5, name: 'Other' });
      mockPrisma.article.create.mockRejectedValue(error);

      await addArticle(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('deleteArticle', () => {
    it('returns 400 for invalid id', async () => {
      const req = createReq({ params: { id: 'bad' } });
      const res = createRes();
      const next = createNext();

      await deleteArticle(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid article id' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when user is missing', async () => {
      const req = createReq({ params: { id: '2' } });
      const res = createRes();
      const next = createNext();

      await deleteArticle(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Authentication required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 404 when article is missing', async () => {
      const req = createReq({ params: { id: '2' }, user: { userId: 3, role: 'ADMIN' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.article.findUnique.mockResolvedValue(null);

      await deleteArticle(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Article not found' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 403 when writer is not owner', async () => {
      const req = createReq({ params: { id: '2' }, user: { userId: 3, role: 'WRITER' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.article.findUnique.mockResolvedValue({ id: 2, authorId: 9, status: 'DRAFT' });

      await deleteArticle(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Access denied' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 403 when writer tries to delete published article', async () => {
      const req = createReq({ params: { id: '2' }, user: { userId: 3, role: 'WRITER' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.article.findUnique.mockResolvedValue({ id: 2, authorId: 3, status: 'PUBLISHED' });

      await deleteArticle(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Writers can only delete non published articles',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('deletes article and thumbnail when allowed', async () => {
      const req = createReq({ params: { id: '2' }, user: { userId: 3, role: 'ADMIN' } });
      const res = createRes();
      const next = createNext();

      mockIsAdminRole.mockReturnValue(true);
      mockPrisma.article.findUnique.mockResolvedValue({
        id: 2,
        authorId: 3,
        status: 'DRAFT',
        thumbnail: '/uploads/thumbnails/a.png',
      });
      mockPrisma.article.delete.mockResolvedValue({ id: 2 });

      await deleteArticle(req, res, next);

      expect(mockDeleteThumbnailFile).toHaveBeenCalledWith('/uploads/thumbnails/a.png');
      expect(mockPrisma.article.delete).toHaveBeenCalledWith({ where: { id: 2 } });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ id: 2 });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('updateArticle', () => {
    it('returns 400 for invalid id', async () => {
      const req = createReq({ params: { id: 'bad' } });
      const res = createRes();
      const next = createNext();

      await updateArticle(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid article id' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when user is missing', async () => {
      const req = createReq({ params: { id: '2' } });
      const res = createRes();
      const next = createNext();

      await updateArticle(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Authentication required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 404 when article is missing', async () => {
      const req = createReq({ params: { id: '2' }, user: { userId: 2, role: 'WRITER' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.article.findUnique.mockResolvedValue(null);

      await updateArticle(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Article not found' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 403 when writer is not owner', async () => {
      const req = createReq({ params: { id: '2' }, user: { userId: 2, role: 'WRITER' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.article.findUnique.mockResolvedValue({ id: 2, authorId: 5, status: 'DRAFT' });

      await updateArticle(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Access denied' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 403 when writer edits published article', async () => {
      const req = createReq({ params: { id: '2' }, user: { userId: 2, role: 'WRITER' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.article.findUnique.mockResolvedValue({ id: 2, authorId: 2, status: 'PUBLISHED' });

      await updateArticle(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Writers can only edit articles in DRAFT, REVIEW or REJECTED status',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('updates article with new title and slug', async () => {
      const req = createReq({
        params: { id: '2' },
        user: { userId: 2, role: 'WRITER' },
        body: { title: 'New Title', summary: 'Summary', content: 'Content' },
      });
      const res = createRes();
      const next = createNext();

      mockPrisma.article.findUnique.mockResolvedValue({
        id: 2,
        authorId: 2,
        status: 'DRAFT',
        publishedAt: null,
      });
      mockPrisma.article.findFirst.mockResolvedValue(null);
      mockPrisma.article.update.mockResolvedValue({ id: 2, title: 'New Title' });

      await updateArticle(req, res, next);

      expect(mockSlugify).toHaveBeenCalledWith('New Title', { lower: true, strict: true });
      expect(mockPrisma.article.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 2 },
          data: expect.objectContaining({
            title: 'New Title',
            slug: 'test-title',
            summary: 'Summary',
            content: 'Content',
          }),
        }),
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ id: 2, title: 'New Title' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('reviewArticle', () => {
    it('returns 400 for invalid id', async () => {
      const req = createReq({ params: { id: 'bad' } });
      const res = createRes();
      const next = createNext();

      await reviewArticle(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid article id' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 400 for invalid status', async () => {
      const req = createReq({ params: { id: '2' }, body: { status: 'DRAFT' } });
      const res = createRes();
      const next = createNext();

      await reviewArticle(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Status must be either PUBLISHED or REJECTED',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 403 when user is not admin', async () => {
      const req = createReq({
        params: { id: '2' },
        body: { status: 'PUBLISHED' },
        user: { userId: 2, role: 'WRITER' },
      });
      const res = createRes();
      const next = createNext();

      await reviewArticle(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Access denied. Only Admins can review articles.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 404 when article is missing', async () => {
      const req = createReq({
        params: { id: '2' },
        body: { status: 'PUBLISHED' },
        user: { userId: 1, role: 'ADMIN' },
      });
      const res = createRes();
      const next = createNext();

      mockIsAdminRole.mockReturnValue(true);
      mockPrisma.article.findUnique.mockResolvedValue(null);

      await reviewArticle(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Article not found' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 403 when article is draft', async () => {
      const req = createReq({
        params: { id: '2' },
        body: { status: 'PUBLISHED' },
        user: { userId: 1, role: 'ADMIN' },
      });
      const res = createRes();
      const next = createNext();

      mockIsAdminRole.mockReturnValue(true);
      mockPrisma.article.findUnique.mockResolvedValue({ id: 2, status: 'DRAFT', authorId: 9 });

      await reviewArticle(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Cannot review articles that are still in draft',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 403 when admin reviews own article', async () => {
      const req = createReq({
        params: { id: '2' },
        body: { status: 'PUBLISHED' },
        user: { userId: 1, role: 'ADMIN' },
      });
      const res = createRes();
      const next = createNext();

      mockIsAdminRole.mockReturnValue(true);
      mockPrisma.article.findUnique.mockResolvedValue({ id: 2, status: 'REVIEW', authorId: 1 });

      await reviewArticle(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Admins cannot review their own articles' });
      expect(next).not.toHaveBeenCalled();
    });

    it('publishes article with scheduling', async () => {
      const futureDate = new Date(Date.now() + 3600_000).toISOString();
      const req = createReq({
        params: { id: '2' },
        body: { status: 'PUBLISHED', scheduledAt: futureDate },
        user: { userId: 1, role: 'ADMIN' },
      });
      const res = createRes();
      const next = createNext();

      mockIsAdminRole.mockReturnValue(true);
      mockPrisma.article.findUnique.mockResolvedValue({ id: 2, status: 'REVIEW', authorId: 9, taskId: null });
      mockPrisma.article.update.mockResolvedValue({ id: 2, status: 'SCHEDULED' });

      await reviewArticle(req, res, next);

      expect(mockPrisma.article.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 2 },
          data: expect.objectContaining({ status: 'SCHEDULED' }),
        }),
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ id: 2, status: 'SCHEDULED' });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
