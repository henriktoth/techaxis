import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';

const {
  mockPrisma,
  mockGetPaginationParams,
  mockCreatePaginatedResponse,
} = vi.hoisted(() => ({
  mockPrisma: {
    comment: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
  mockGetPaginationParams: vi.fn(),
  mockCreatePaginatedResponse: vi.fn(),
}));

vi.mock('../../config/db.config', () => ({
  prisma: mockPrisma,
}));

vi.mock('../../utils/pagination', () => ({
  getPaginationParams: mockGetPaginationParams,
  createPaginatedResponse: mockCreatePaginatedResponse,
}));

import { createComment, deleteComment, getCommentsByArticle } from '../commentController';

type AuthUser = { userId: number; role: string };

type TestRequest = Partial<Request> & {
  user?: AuthUser;
  params: Record<string, string>;
  body: Record<string, unknown>;
};

type TestResponse = Response & {
  status: ReturnType<typeof vi.fn>;
  json: ReturnType<typeof vi.fn>;
};

const createReq = (overrides: Partial<TestRequest> = {}): Request => {
  return {
    params: {},
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

beforeEach(() => {
  vi.clearAllMocks();
});

describe('commentController unit tests', () => {
  describe('createComment', () => {
    it('returns 401 when user is missing', async () => {
      const req = createReq({ body: { articleId: 1, content: 'Hello' } });
      const res = createRes();

      await createComment(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
    });

    it('creates comment when data are valid', async () => {
      const req = createReq({
        user: { userId: 4, role: 'READER' },
        body: { articleId: 1, content: 'Great post!' },
      });
      const res = createRes();

      mockPrisma.comment.create.mockResolvedValue({ id: 10, content: 'Great post!' });

      await createComment(req, res);

      expect(mockPrisma.comment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { content: 'Great post!', articleId: 1, authorId: 4 },
          include: expect.any(Object),
        }),
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ id: 10, content: 'Great post!' });
    });

    it('returns 500 when create fails', async () => {
      const req = createReq({
        user: { userId: 4, role: 'READER' },
        body: { articleId: 1, content: 'Great post!' },
      });
      const res = createRes();
      const error = new Error('create failed');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

      mockPrisma.comment.create.mockRejectedValue(error);

      await createComment(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Error creating comment' });
      consoleSpy.mockRestore();
    });
  });

  describe('getCommentsByArticle', () => {
    it('returns paginated comments', async () => {
      const req = createReq({ params: { articleId: '2' } });
      const res = createRes();

      mockGetPaginationParams.mockReturnValue({ page: 2, limit: 5, skip: 5 });
      mockPrisma.comment.findMany.mockResolvedValue([{ id: 1, content: 'Hi' }]);
      mockPrisma.comment.count.mockResolvedValue(11);
      mockCreatePaginatedResponse.mockReturnValue({
        data: [{ id: 1, content: 'Hi' }],
        meta: { total: 11, page: 2, limit: 5, totalPages: 3 },
      });

      await getCommentsByArticle(req, res);

      expect(mockGetPaginationParams).toHaveBeenCalledWith(req);
      expect(mockPrisma.comment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { articleId: 2 },
          skip: 5,
          take: 5,
        }),
      );
      expect(mockCreatePaginatedResponse).toHaveBeenCalledWith(
        [{ id: 1, content: 'Hi' }],
        11,
        2,
        5,
      );
      expect(res.json).toHaveBeenCalledWith({
        data: [{ id: 1, content: 'Hi' }],
        meta: { total: 11, page: 2, limit: 5, totalPages: 3 },
      });
    });

    it('returns 500 when fetch fails', async () => {
      const req = createReq({ params: { articleId: '2' } });
      const res = createRes();
      const error = new Error('fetch failed');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

      mockGetPaginationParams.mockReturnValue({ page: 1, limit: 10, skip: 0 });
      mockPrisma.comment.findMany.mockRejectedValue(error);

      await getCommentsByArticle(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Error fetching comments' });
      consoleSpy.mockRestore();
    });
  });

  describe('deleteComment', () => {
    it('returns 401 when user is missing', async () => {
      const req = createReq({ params: { id: '3' } });
      const res = createRes();

      await deleteComment(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
    });

    it('returns 404 when comment is missing', async () => {
      const req = createReq({ params: { id: '3' }, user: { userId: 9, role: 'READER' } });
      const res = createRes();

      mockPrisma.comment.findUnique.mockResolvedValue(null);

      await deleteComment(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Comment not found' });
    });

    it('returns 403 when user is not allowed', async () => {
      const req = createReq({ params: { id: '3' }, user: { userId: 9, role: 'READER' } });
      const res = createRes();

      mockPrisma.comment.findUnique.mockResolvedValue({ id: 3, authorId: 4 });

      await deleteComment(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden' });
    });

    it('deletes comment when owner', async () => {
      const req = createReq({ params: { id: '3' }, user: { userId: 4, role: 'READER' } });
      const res = createRes();

      mockPrisma.comment.findUnique.mockResolvedValue({ id: 3, authorId: 4 });
      mockPrisma.comment.delete.mockResolvedValue({ id: 3 });

      await deleteComment(req, res);

      expect(mockPrisma.comment.delete).toHaveBeenCalledWith({ where: { id: 3 } });
      expect(res.json).toHaveBeenCalledWith({ message: 'Comment deleted successfully' });
    });

    it('deletes comment when admin', async () => {
      const req = createReq({ params: { id: '3' }, user: { userId: 9, role: 'ADMIN' } });
      const res = createRes();

      mockPrisma.comment.findUnique.mockResolvedValue({ id: 3, authorId: 4 });
      mockPrisma.comment.delete.mockResolvedValue({ id: 3 });

      await deleteComment(req, res);

      expect(mockPrisma.comment.delete).toHaveBeenCalledWith({ where: { id: 3 } });
      expect(res.json).toHaveBeenCalledWith({ message: 'Comment deleted successfully' });
    });

    it('returns 500 when delete fails', async () => {
      const req = createReq({ params: { id: '3' }, user: { userId: 4, role: 'READER' } });
      const res = createRes();
      const error = new Error('delete failed');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

      mockPrisma.comment.findUnique.mockResolvedValue({ id: 3, authorId: 4 });
      mockPrisma.comment.delete.mockRejectedValue(error);

      await deleteComment(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Error deleting comment' });
      consoleSpy.mockRestore();
    });
  });
});
