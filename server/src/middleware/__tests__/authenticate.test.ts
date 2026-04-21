import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextFunction, Request, Response } from 'express';

const { mockVerifyToken, mockEnv } = vi.hoisted(() => ({
  mockVerifyToken: vi.fn(),
  mockEnv: { jwt: { secret: 'test-secret' } },
}));

vi.mock('../../utils/auth', () => ({
  verifyToken: mockVerifyToken,
}));

vi.mock('../../config/env.config', () => ({
  default: mockEnv,
}));

import { authenticate } from '../authenticate';

type TestRequest = Partial<Request> & {
  headers: Record<string, string | undefined>;
  user?: object;
};

type TestResponse = Response & {
  status: ReturnType<typeof vi.fn>;
  json: ReturnType<typeof vi.fn>;
};

const createReq = (overrides: Partial<TestRequest> = {}): Request => {
  return {
    headers: {},
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
  mockEnv.jwt.secret = 'test-secret';
});

describe('authenticate middleware', () => {
  it('returns 401 when authorization header is missing', () => {
    const req = createReq();
    const res = createRes();
    const next = createNext();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Authentication failed' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when authorization header is not Bearer', () => {
    const req = createReq({ headers: { authorization: 'Token abc' } });
    const res = createRes();
    const next = createNext();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Authentication failed' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when token is missing', () => {
    const req = createReq({ headers: { authorization: 'Bearer ' } });
    const res = createRes();
    const next = createNext();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Authentication failed' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when JWT secret is missing', () => {
    mockEnv.jwt.secret = '';
    const req = createReq({ headers: { authorization: 'Bearer valid' } });
    const res = createRes();
    const next = createNext();

    authenticate(req, res, next);

    expect(mockVerifyToken).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Authentication failed' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when token verification fails', () => {
    mockVerifyToken.mockImplementation(() => {
      throw new Error('invalid token');
    });
    const req = createReq({ headers: { authorization: 'Bearer invalid' } });
    const res = createRes();
    const next = createNext();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Authentication failed' });
    expect(next).not.toHaveBeenCalled();
  });

  it('attaches user and calls next for valid token', () => {
    const req = createReq({ headers: { authorization: 'Bearer valid' } });
    const res = createRes();
    const next = createNext();
    const userPayload = { userId: 1, role: 'ADMIN' };

    mockVerifyToken.mockReturnValue(userPayload);

    authenticate(req, res, next);

    expect(mockVerifyToken).toHaveBeenCalledWith('valid');
    expect((req as Request & { user?: object }).user).toEqual(userPayload);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
