import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextFunction, Request, Response } from 'express';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    category: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    },
    article: {
      updateMany: vi.fn(),
    },
  },
}));

vi.mock('../../config/db.config', () => ({
  prisma: mockPrisma,
}));

import {
  createCategory,
  deleteCategory,
  getCategories,
  getCategoryById,
  updateCategory,
} from '../categoryController';

type TestRequest = Partial<Request> & {
  params: Record<string, string>;
  body: Record<string, unknown> | undefined;
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

describe('categoryController unit tests', () => {
  describe('getCategories', () => {
    it('returns categories list', async () => {
      const req = createReq();
      const res = createRes();
      const next = createNext();

      mockPrisma.category.findMany.mockResolvedValue([{ id: 1, name: 'Tech' }]);

      await getCategories(req, res, next);

      expect(mockPrisma.category.findMany).toHaveBeenCalledWith();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([{ id: 1, name: 'Tech' }]);
      expect(next).not.toHaveBeenCalled();
    });

    it('forwards errors to next', async () => {
      const req = createReq();
      const res = createRes();
      const next = createNext();
      const error = new Error('load failed');

      mockPrisma.category.findMany.mockRejectedValue(error);

      await getCategories(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getCategoryById', () => {
    it('returns 400 for invalid id', async () => {
      const req = createReq({ params: { id: 'abc' } });
      const res = createRes();
      const next = createNext();

      await getCategoryById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid category ID' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 404 when category is missing', async () => {
      const req = createReq({ params: { id: '2' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.category.findUnique.mockResolvedValue(null);

      await getCategoryById(req, res, next);

      expect(mockPrisma.category.findUnique).toHaveBeenCalledWith({ where: { id: 2 } });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Category not found' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns category when found', async () => {
      const req = createReq({ params: { id: '2' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.category.findUnique.mockResolvedValue({ id: 2, name: 'News' });

      await getCategoryById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ id: 2, name: 'News' });
      expect(next).not.toHaveBeenCalled();
    });

    it('forwards lookup errors to next', async () => {
      const req = createReq({ params: { id: '2' } });
      const res = createRes();
      const next = createNext();
      const error = new Error('lookup failed');

      mockPrisma.category.findUnique.mockRejectedValue(error);

      await getCategoryById(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('createCategory', () => {
    it('returns 400 when body is missing', async () => {
      const req = createReq({ body: undefined });
      const res = createRes();
      const next = createNext();

      await createCategory(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Name is required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 409 when category already exists', async () => {
      const req = createReq({ body: { name: 'Tech' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.category.findUnique.mockResolvedValue({ id: 1, name: 'Tech' });

      await createCategory(req, res, next);

      expect(mockPrisma.category.findUnique).toHaveBeenCalledWith({ where: { name: 'Tech' } });
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ message: 'Category already exists' });
    });

    it('creates category when data are valid', async () => {
      const req = createReq({ body: { name: 'Science' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.category.findUnique.mockResolvedValue(null);
      mockPrisma.category.create.mockResolvedValue({ id: 3, name: 'Science' });

      await createCategory(req, res, next);

      expect(mockPrisma.category.create).toHaveBeenCalledWith({ data: { name: 'Science' } });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ id: 3, name: 'Science' });
    });

    it('forwards create errors to next', async () => {
      const req = createReq({ body: { name: 'Science' } });
      const res = createRes();
      const next = createNext();
      const error = new Error('create failed');

      mockPrisma.category.findUnique.mockResolvedValue(null);
      mockPrisma.category.create.mockRejectedValue(error);

      await createCategory(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('deleteCategory', () => {
    it('returns 400 for invalid id', async () => {
      const req = createReq({ params: { id: 'bad' } });
      const res = createRes();
      const next = createNext();

      await deleteCategory(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid category id' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 400 when deleting default category', async () => {
      const req = createReq({ params: { id: '5' } });
      const res = createRes();
      const next = createNext();

      await deleteCategory(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Cannot delete the default "Other" category',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 404 when category is missing', async () => {
      const req = createReq({ params: { id: '3' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.category.findUnique.mockResolvedValue(null);

      await deleteCategory(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Category not found' });
      expect(next).not.toHaveBeenCalled();
    });

    it('deletes category and reassigns articles', async () => {
      const req = createReq({ params: { id: '3' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.category.findUnique.mockResolvedValue({ id: 3, name: 'News' });
      mockPrisma.article.updateMany.mockResolvedValue({ count: 2 });
      mockPrisma.category.delete.mockResolvedValue({ id: 3, name: 'News' });

      await deleteCategory(req, res, next);

      expect(mockPrisma.article.updateMany).toHaveBeenCalledWith({
        where: { categoryId: 3 },
        data: { categoryId: 5 },
      });
      expect(mockPrisma.category.delete).toHaveBeenCalledWith({ where: { id: 3 } });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ id: 3, name: 'News' });
      expect(next).not.toHaveBeenCalled();
    });

    it('forwards deletion errors to next', async () => {
      const req = createReq({ params: { id: '3' } });
      const res = createRes();
      const next = createNext();
      const error = new Error('delete failed');

      mockPrisma.category.findUnique.mockResolvedValue({ id: 3, name: 'News' });
      mockPrisma.article.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.category.delete.mockRejectedValue(error);

      await deleteCategory(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('updateCategory', () => {
    it('returns 400 for invalid id', async () => {
      const req = createReq({ params: { id: 'invalid' } });
      const res = createRes();
      const next = createNext();

      await updateCategory(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid category ID' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 400 when body is missing', async () => {
      const req = createReq({ params: { id: '2' }, body: undefined });
      const res = createRes();
      const next = createNext();

      await updateCategory(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Name is required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 404 when category is missing', async () => {
      const req = createReq({ params: { id: '2' }, body: { name: 'New' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.category.findUnique.mockResolvedValue(null);

      await updateCategory(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Category not found' });
      expect(next).not.toHaveBeenCalled();
    });

    it('updates category when data are valid', async () => {
      const req = createReq({ params: { id: '2' }, body: { name: 'Updated' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.category.findUnique.mockResolvedValue({ id: 2, name: 'Old' });
      mockPrisma.category.update.mockResolvedValue({ id: 2, name: 'Updated' });

      await updateCategory(req, res, next);

      expect(mockPrisma.category.update).toHaveBeenCalledWith({
        where: { id: 2 },
        data: { name: 'Updated' },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ id: 2, name: 'Updated' });
      expect(next).not.toHaveBeenCalled();
    });

    it('forwards update errors to next', async () => {
      const req = createReq({ params: { id: '2' }, body: { name: 'Updated' } });
      const res = createRes();
      const next = createNext();
      const error = new Error('update failed');

      mockPrisma.category.findUnique.mockResolvedValue({ id: 2, name: 'Old' });
      mockPrisma.category.update.mockRejectedValue(error);

      await updateCategory(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
