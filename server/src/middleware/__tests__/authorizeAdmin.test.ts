import { describe, expect, it, vi } from 'vitest';
import type { NextFunction, Request, Response } from 'express';

import { authorizeAdmin } from '../authorizeAdmin';

type TestRequest = Partial<Request> & {
  user?: { role: string };
};

type TestResponse = Response & {
  status: ReturnType<typeof vi.fn>;
  json: ReturnType<typeof vi.fn>;
};

const createReq = (overrides: Partial<TestRequest> = {}): Request => {
  return {
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

describe('authorizeAdmin middleware', () => {
  it('returns 403 when user is missing', () => {
    const req = createReq();
    const res = createRes();
    const next = createNext();

    authorizeAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Access denied. Admin privileges required.' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 when user is not admin', () => {
    const req = createReq({ user: { role: 'READER' } });
    const res = createRes();
    const next = createNext();

    authorizeAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Access denied. Admin privileges required.' });
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next when user is admin', () => {
    const req = createReq({ user: { role: 'ADMIN' } });
    const res = createRes();
    const next = createNext();

    authorizeAdmin(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it('calls next when user is superadmin', () => {
    const req = createReq({ user: { role: 'SUPERADMIN' } });
    const res = createRes();
    const next = createNext();

    authorizeAdmin(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
