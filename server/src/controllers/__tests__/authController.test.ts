import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextFunction, Request, Response } from 'express';

const { mockPrisma, mockCompare, mockSignToken } = vi.hoisted(() => ({
  mockPrisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
  mockCompare: vi.fn(),
  mockSignToken: vi.fn(),
}));

vi.mock('../../config/db.config', () => ({
  prisma: mockPrisma,
}));

vi.mock('bcrypt', () => ({
  default: {
    compare: mockCompare,
  },
}));

vi.mock('../../utils/auth', () => ({
  signToken: mockSignToken,
}));

import { getUser, login } from '../authController';

type AuthUser = { userId: number; role: string };

type TestRequest = Partial<Request> & {
  user?: AuthUser;
  body: Record<string, unknown>;
};

type TestResponse = Response & {
  status: ReturnType<typeof vi.fn>;
  json: ReturnType<typeof vi.fn>;
};

const createReq = (overrides: Partial<TestRequest> = {}): Request => {
  return {
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

describe('authController unit tests', () => {
  describe('login', () => {
    it('returns 400 when email is missing', async () => {
      const req = createReq({ body: { password: 'secret' } });
      const res = createRes();
      const next = createNext();

      await login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Email and password required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when user is not found', async () => {
      const req = createReq({ body: { email: 'user@example.com', password: 'secret' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.user.findUnique.mockResolvedValue(null);

      await login(req, res, next);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'user@example.com' } });
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid email or password' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 403 when user is disabled', async () => {
      const req = createReq({ body: { email: 'user@example.com', password: 'secret' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'user@example.com',
        password_hash: 'hashed',
        role: 'WRITER',
        isDisabled: true,
      });

      await login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Your account has been disabled. Please contact an administrator.',
      });
      expect(mockCompare).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when password is invalid', async () => {
      const req = createReq({ body: { email: 'user@example.com', password: 'secret' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 2,
        email: 'user@example.com',
        password_hash: 'hashed',
        role: 'WRITER',
        isDisabled: false,
      });
      mockCompare.mockResolvedValue(false);

      await login(req, res, next);

      expect(mockCompare).toHaveBeenCalledWith('secret', 'hashed');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid email or password' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns token when credentials are valid', async () => {
      const req = createReq({ body: { email: 'user@example.com', password: 'secret' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 3,
        email: 'user@example.com',
        password_hash: 'hashed',
        role: 'ADMIN',
        isDisabled: false,
      });
      mockCompare.mockResolvedValue(true);
      mockSignToken.mockReturnValue('jwt-token');

      await login(req, res, next);

      expect(mockSignToken).toHaveBeenCalledWith({ userId: 3, role: 'ADMIN' });
      expect(res.json).toHaveBeenCalledWith({ token: 'jwt-token' });
      expect(next).not.toHaveBeenCalled();
    });

    it('forwards errors to next', async () => {
      const req = createReq({ body: { email: 'user@example.com', password: 'secret' } });
      const res = createRes();
      const next = createNext();
      const error = new Error('lookup failed');

      mockPrisma.user.findUnique.mockRejectedValue(error);

      await login(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getUser', () => {
    it('returns 401 when user is missing', async () => {
      const req = createReq();
      const res = createRes();
      const next = createNext();

      await getUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Authentication required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 404 when user does not exist', async () => {
      const req = createReq({ user: { userId: 9, role: 'WRITER' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.user.findUnique.mockResolvedValue(null);

      await getUser(req, res, next);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 9 },
        select: { id: true, name: true, email: true, role: true },
      });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns user info when found', async () => {
      const req = createReq({ user: { userId: 7, role: 'READER' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 7,
        name: 'Jane Doe',
        email: 'jane@example.com',
        role: 'READER',
      });

      await getUser(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        id: 7,
        name: 'Jane Doe',
        email: 'jane@example.com',
        role: 'READER',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('forwards errors to next', async () => {
      const req = createReq({ user: { userId: 7, role: 'READER' } });
      const res = createRes();
      const next = createNext();
      const error = new Error('fetch failed');

      mockPrisma.user.findUnique.mockRejectedValue(error);

      await getUser(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
