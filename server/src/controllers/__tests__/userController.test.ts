import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextFunction, Request, Response } from 'express';

const {
  mockPrisma,
  mockGetPaginationParams,
  mockCreatePaginatedResponse,
  mockHash,
  mockSignToken,
  mockIsAdminRole,
  mockIsHigherThan,
} = vi.hoisted(() => ({
  mockPrisma: {
    user: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    article: {
      updateMany: vi.fn(),
    },
    task: {
      updateMany: vi.fn(),
    },
    notification: {
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
  mockGetPaginationParams: vi.fn(),
  mockCreatePaginatedResponse: vi.fn(),
  mockHash: vi.fn(),
  mockSignToken: vi.fn(),
  mockIsAdminRole: vi.fn(),
  mockIsHigherThan: vi.fn(),
}));

vi.mock('../../config/db.config', () => ({
  prisma: mockPrisma,
}));

vi.mock('../../utils/pagination', () => ({
  getPaginationParams: mockGetPaginationParams,
  createPaginatedResponse: mockCreatePaginatedResponse,
}));

vi.mock('bcrypt', () => ({
  default: {
    hash: mockHash,
  },
}));

vi.mock('../../utils/auth', () => ({
  signToken: mockSignToken,
}));

vi.mock('../../utils/roles', () => ({
  isAdminRole: mockIsAdminRole,
  isHigherThan: mockIsHigherThan,
}));

import {
  createUser,
  deleteUser,
  getAllUsers,
  getReaders,
  getUserById,
  toggleUserDisabled,
  updateUser,
} from '../userController';

type AuthUser = { userId: number; role: string };

type TestRequest = Partial<Request> & {
  user?: AuthUser;
  params: Record<string, string>;
  query: Record<string, string>;
  body: Record<string, unknown>;
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
  mockIsHigherThan.mockReturnValue(true);
  mockPrisma.$transaction.mockImplementation(async (handler) =>
    handler({
      article: mockPrisma.article,
      task: mockPrisma.task,
      notification: mockPrisma.notification,
      user: mockPrisma.user,
    }),
  );
});

describe('userController unit tests', () => {
  describe('getAllUsers', () => {
    it('returns paginated users', async () => {
      const req = createReq({ query: { role: 'admin', search: 'alex', isDisabled: 'false' } });
      const res = createRes();
      const next = createNext();

      mockGetPaginationParams.mockReturnValue({ page: 1, limit: 10, skip: 0 });
      mockPrisma.user.findMany.mockResolvedValue([{ id: 1 }]);
      mockPrisma.user.count.mockResolvedValue(1);
      mockCreatePaginatedResponse.mockReturnValue({ data: [{ id: 1 }], meta: { total: 1 } });

      await getAllUsers(req, res, next);

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            role: 'ADMIN',
            isDisabled: false,
            OR: expect.any(Array),
          }),
          skip: 0,
          take: 10,
        }),
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ data: [{ id: 1 }], meta: { total: 1 } });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('getUserById', () => {
    it('returns 400 for invalid id', async () => {
      const req = createReq({ params: { id: 'bad' } });
      const res = createRes();
      const next = createNext();

      await getUserById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid user ID' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 404 when user is missing', async () => {
      const req = createReq({ params: { id: '2' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.user.findUnique.mockResolvedValue(null);

      await getUserById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('updateUser', () => {
    it('returns 400 for invalid id', async () => {
      const req = createReq({ params: { id: 'bad' }, user: { userId: 1, role: 'ADMIN' } });
      const res = createRes();
      const next = createNext();

      await updateUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid user ID' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 404 when user is missing', async () => {
      const req = createReq({ params: { id: '2' }, user: { userId: 1, role: 'ADMIN' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.user.findUnique.mockResolvedValue(null);

      await updateUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 403 when trying to update own role', async () => {
      const req = createReq({
        params: { id: '2' },
        user: { userId: 2, role: 'ADMIN' },
        body: { role: 'WRITER' },
      });
      const res = createRes();
      const next = createNext();

      mockPrisma.user.findUnique.mockResolvedValue({ id: 2, role: 'ADMIN', email: 'a@b.com' });

      await updateUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'You cannot change your own role' });
      expect(next).not.toHaveBeenCalled();
    });

    it('updates user with hashed password', async () => {
      const req = createReq({
        params: { id: '2' },
        user: { userId: 1, role: 'SUPERADMIN' },
        body: { name: 'New', password: 'secret' },
      });
      const res = createRes();
      const next = createNext();

      mockPrisma.user.findUnique.mockResolvedValue({ id: 2, role: 'WRITER', email: 'a@b.com' });
      mockHash.mockResolvedValue('hashed');
      mockPrisma.user.update.mockResolvedValue({
        id: 2,
        name: 'New',
        email: 'a@b.com',
        role: 'WRITER',
        isDisabled: false,
      });

      await updateUser(req, res, next);

      expect(mockHash).toHaveBeenCalledWith('secret', 10);
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 2 },
          data: expect.objectContaining({ name: 'New', password_hash: 'hashed' }),
        }),
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        id: 2,
        name: 'New',
        email: 'a@b.com',
        role: 'WRITER',
        isDisabled: false,
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('createUser', () => {
    it('returns 400 when required fields are missing', async () => {
      const req = createReq({ body: { name: 'Name' } });
      const res = createRes();
      const next = createNext();

      await createUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Name, email and password are required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 409 when email is already used', async () => {
      const req = createReq({ body: { name: 'Name', email: 'a@b.com', password: 'pass' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });

      await createUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ message: 'Email already in use' });
      expect(next).not.toHaveBeenCalled();
    });

    it('creates reader and returns token for public signup', async () => {
      const req = createReq({ body: { name: 'Name', email: 'a@b.com', password: 'pass' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockHash.mockResolvedValue('hashed');
      mockPrisma.user.create.mockResolvedValue({
        id: 9,
        name: 'Name',
        email: 'a@b.com',
        role: 'READER',
        isDisabled: false,
      });
      mockSignToken.mockReturnValue('token');

      await createUser(req, res, next);

      expect(mockSignToken).toHaveBeenCalledWith({ userId: 9, role: 'READER' });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        id: 9,
        name: 'Name',
        email: 'a@b.com',
        role: 'READER',
        isDisabled: false,
        token: 'token',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('deleteUser', () => {
    it('returns 400 for invalid id', async () => {
      const req = createReq({ params: { id: 'bad' }, user: { userId: 1, role: 'ADMIN' } });
      const res = createRes();
      const next = createNext();

      await deleteUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid user ID' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 403 when deleting self', async () => {
      const req = createReq({ params: { id: '1' }, user: { userId: 1, role: 'ADMIN' } });
      const res = createRes();
      const next = createNext();

      await deleteUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'You cannot delete your own account' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 404 when user is missing', async () => {
      const req = createReq({ params: { id: '2' }, user: { userId: 1, role: 'SUPERADMIN' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.user.findUnique.mockResolvedValue(null);

      await deleteUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 403 when admin cannot delete role', async () => {
      const req = createReq({ params: { id: '2' }, user: { userId: 1, role: 'ADMIN' } });
      const res = createRes();
      const next = createNext();

      mockIsHigherThan.mockReturnValue(false);
      mockPrisma.user.findUnique.mockResolvedValue({ id: 2, role: 'ADMIN' });

      await deleteUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Cannot delete a admin account' });
      expect(next).not.toHaveBeenCalled();
    });

    it('deletes user with transaction', async () => {
      const req = createReq({ params: { id: '2' }, user: { userId: 1, role: 'SUPERADMIN' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.user.findUnique.mockResolvedValue({ id: 2, role: 'WRITER' });

      await deleteUser(req, res, next);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockPrisma.article.updateMany).toHaveBeenCalled();
      expect(mockPrisma.task.updateMany).toHaveBeenCalled();
      expect(mockPrisma.notification.deleteMany).toHaveBeenCalled();
      expect(mockPrisma.user.delete).toHaveBeenCalledWith({ where: { id: 2 } });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User deleted and articles transferred successfully',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('getReaders', () => {
    it('returns readers with pagination', async () => {
      const req = createReq({ query: { search: 'ann' } });
      const res = createRes();
      const next = createNext();

      mockGetPaginationParams.mockReturnValue({ page: 1, limit: 5, skip: 0 });
      mockPrisma.user.findMany.mockResolvedValue([{ id: 1 }]);
      mockPrisma.user.count.mockResolvedValue(1);
      mockCreatePaginatedResponse.mockReturnValue({ data: [{ id: 1 }], meta: { total: 1 } });

      await getReaders(req, res, next);

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ role: 'READER' }),
          skip: 0,
          take: 5,
        }),
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ data: [{ id: 1 }], meta: { total: 1 } });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('toggleUserDisabled', () => {
    it('returns 400 for invalid id', async () => {
      const req = createReq({ params: { id: 'bad' }, user: { userId: 1, role: 'ADMIN' } });
      const res = createRes();
      const next = createNext();

      await toggleUserDisabled(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid user ID' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 404 when user is missing', async () => {
      const req = createReq({ params: { id: '2' }, user: { userId: 1, role: 'ADMIN' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.user.findUnique.mockResolvedValue(null);

      await toggleUserDisabled(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 403 when caller cannot disable role', async () => {
      const req = createReq({ params: { id: '2' }, user: { userId: 1, role: 'ADMIN' } });
      const res = createRes();
      const next = createNext();

      mockIsHigherThan.mockReturnValue(false);
      mockPrisma.user.findUnique.mockResolvedValue({ id: 2, role: 'ADMIN', isDisabled: false });

      await toggleUserDisabled(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Cannot disable a admin account' });
      expect(next).not.toHaveBeenCalled();
    });

    it('toggles disabled flag when allowed', async () => {
      const req = createReq({ params: { id: '2' }, user: { userId: 1, role: 'SUPERADMIN' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.user.findUnique.mockResolvedValue({ id: 2, role: 'WRITER', isDisabled: false });
      mockPrisma.user.update.mockResolvedValue({
        id: 2,
        name: 'Name',
        email: 'a@b.com',
        role: 'WRITER',
        isDisabled: true,
      });

      await toggleUserDisabled(req, res, next);

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 2 },
          data: { isDisabled: true },
        }),
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        id: 2,
        name: 'Name',
        email: 'a@b.com',
        role: 'WRITER',
        isDisabled: true,
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
