import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextFunction, Request, Response } from 'express';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    favorite: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    article: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('../../config/db.config', () => ({
  prisma: mockPrisma,
}));

import {
  addFavorite,
  checkFavorite,
  getFavoriteIds,
  getFavorites,
  removeFavorite,
} from '../favoriteController';

type AuthUser = { userId: number };

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

const createNext = (): NextFunction => vi.fn() as unknown as NextFunction;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('favoriteController unit tests', () => {
  describe('getFavorites', () => {
    it('returns 401 when user is missing', async () => {
      const req = createReq();
      const res = createRes();
      const next = createNext();

      await getFavorites(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Authentication required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns favorite articles', async () => {
      const req = createReq({ user: { userId: 2 } });
      const res = createRes();
      const next = createNext();

      mockPrisma.favorite.findMany.mockResolvedValue([
        { article: { id: 1, title: 'First' } },
        { article: { id: 2, title: 'Second' } },
      ]);

      await getFavorites(req, res, next);

      expect(mockPrisma.favorite.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 2 },
          include: expect.any(Object),
          orderBy: { createdAt: 'desc' },
        }),
      );
      expect(res.json).toHaveBeenCalledWith([
        { id: 1, title: 'First' },
        { id: 2, title: 'Second' },
      ]);
      expect(next).not.toHaveBeenCalled();
    });

    it('forwards errors to next', async () => {
      const req = createReq({ user: { userId: 2 } });
      const res = createRes();
      const next = createNext();
      const error = new Error('load failed');

      mockPrisma.favorite.findMany.mockRejectedValue(error);

      await getFavorites(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('addFavorite', () => {
    it('returns 401 when user is missing', async () => {
      const req = createReq({ params: { articleId: '1' } });
      const res = createRes();
      const next = createNext();

      await addFavorite(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Authentication required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 400 for invalid article id', async () => {
      const req = createReq({ params: { articleId: 'bad' }, user: { userId: 1 } });
      const res = createRes();
      const next = createNext();

      await addFavorite(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid article ID' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 404 when article is missing', async () => {
      const req = createReq({ params: { articleId: '3' }, user: { userId: 1 } });
      const res = createRes();
      const next = createNext();

      mockPrisma.article.findUnique.mockResolvedValue(null);

      await addFavorite(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Article not found' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 409 when favorite already exists', async () => {
      const req = createReq({ params: { articleId: '3' }, user: { userId: 1 } });
      const res = createRes();
      const next = createNext();

      mockPrisma.article.findUnique.mockResolvedValue({ id: 3 });
      mockPrisma.favorite.findUnique.mockResolvedValue({ id: 7 });

      await addFavorite(req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ message: 'Article already in favorites' });
      expect(next).not.toHaveBeenCalled();
    });

    it('creates favorite when data are valid', async () => {
      const req = createReq({ params: { articleId: '3' }, user: { userId: 1 } });
      const res = createRes();
      const next = createNext();

      mockPrisma.article.findUnique.mockResolvedValue({ id: 3 });
      mockPrisma.favorite.findUnique.mockResolvedValue(null);
      mockPrisma.favorite.create.mockResolvedValue({ id: 9 });

      await addFavorite(req, res, next);

      expect(mockPrisma.favorite.create).toHaveBeenCalledWith({
        data: { userId: 1, articleId: 3 },
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ message: 'Article added to favorites' });
      expect(next).not.toHaveBeenCalled();
    });

    it('forwards errors to next', async () => {
      const req = createReq({ params: { articleId: '3' }, user: { userId: 1 } });
      const res = createRes();
      const next = createNext();
      const error = new Error('create failed');

      mockPrisma.article.findUnique.mockResolvedValue({ id: 3 });
      mockPrisma.favorite.findUnique.mockResolvedValue(null);
      mockPrisma.favorite.create.mockRejectedValue(error);

      await addFavorite(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('removeFavorite', () => {
    it('returns 401 when user is missing', async () => {
      const req = createReq({ params: { articleId: '1' } });
      const res = createRes();
      const next = createNext();

      await removeFavorite(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Authentication required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 400 for invalid article id', async () => {
      const req = createReq({ params: { articleId: 'bad' }, user: { userId: 1 } });
      const res = createRes();
      const next = createNext();

      await removeFavorite(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid article ID' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 404 when favorite is missing', async () => {
      const req = createReq({ params: { articleId: '3' }, user: { userId: 1 } });
      const res = createRes();
      const next = createNext();

      mockPrisma.favorite.findUnique.mockResolvedValue(null);

      await removeFavorite(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Favorite not found' });
      expect(next).not.toHaveBeenCalled();
    });

    it('removes favorite when found', async () => {
      const req = createReq({ params: { articleId: '3' }, user: { userId: 1 } });
      const res = createRes();
      const next = createNext();

      mockPrisma.favorite.findUnique.mockResolvedValue({ id: 6 });
      mockPrisma.favorite.delete.mockResolvedValue({ id: 6 });

      await removeFavorite(req, res, next);

      expect(mockPrisma.favorite.delete).toHaveBeenCalledWith({
        where: { userId_articleId: { userId: 1, articleId: 3 } },
      });
      expect(res.json).toHaveBeenCalledWith({ message: 'Article removed from favorites' });
      expect(next).not.toHaveBeenCalled();
    });

    it('forwards errors to next', async () => {
      const req = createReq({ params: { articleId: '3' }, user: { userId: 1 } });
      const res = createRes();
      const next = createNext();
      const error = new Error('delete failed');

      mockPrisma.favorite.findUnique.mockResolvedValue({ id: 6 });
      mockPrisma.favorite.delete.mockRejectedValue(error);

      await removeFavorite(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('checkFavorite', () => {
    it('returns 401 when user is missing', async () => {
      const req = createReq({ params: { articleId: '1' } });
      const res = createRes();
      const next = createNext();

      await checkFavorite(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Authentication required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 400 for invalid article id', async () => {
      const req = createReq({ params: { articleId: 'bad' }, user: { userId: 1 } });
      const res = createRes();
      const next = createNext();

      await checkFavorite(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid article ID' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns isFavorited true when favorite exists', async () => {
      const req = createReq({ params: { articleId: '3' }, user: { userId: 1 } });
      const res = createRes();
      const next = createNext();

      mockPrisma.favorite.findUnique.mockResolvedValue({ id: 4 });

      await checkFavorite(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ isFavorited: true });
      expect(next).not.toHaveBeenCalled();
    });

    it('forwards errors to next', async () => {
      const req = createReq({ params: { articleId: '3' }, user: { userId: 1 } });
      const res = createRes();
      const next = createNext();
      const error = new Error('lookup failed');

      mockPrisma.favorite.findUnique.mockRejectedValue(error);

      await checkFavorite(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getFavoriteIds', () => {
    it('returns 401 when user is missing', async () => {
      const req = createReq();
      const res = createRes();
      const next = createNext();

      await getFavoriteIds(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Authentication required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns favorite article ids', async () => {
      const req = createReq({ user: { userId: 9 } });
      const res = createRes();
      const next = createNext();

      mockPrisma.favorite.findMany.mockResolvedValue([{ articleId: 1 }, { articleId: 4 }]);

      await getFavoriteIds(req, res, next);

      expect(mockPrisma.favorite.findMany).toHaveBeenCalledWith({
        where: { userId: 9 },
        select: { articleId: true },
      });
      expect(res.json).toHaveBeenCalledWith([1, 4]);
      expect(next).not.toHaveBeenCalled();
    });

    it('forwards errors to next', async () => {
      const req = createReq({ user: { userId: 9 } });
      const res = createRes();
      const next = createNext();
      const error = new Error('load failed');

      mockPrisma.favorite.findMany.mockRejectedValue(error);

      await getFavoriteIds(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
