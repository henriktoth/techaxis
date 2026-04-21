import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockJwtSign, mockJwtVerify, mockEnv } = vi.hoisted(() => ({
  mockJwtSign: vi.fn(),
  mockJwtVerify: vi.fn(),
  mockEnv: { jwt: { secret: 'test-secret', expiresIn: '7d' } },
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: mockJwtSign,
    verify: mockJwtVerify,
  },
}));

vi.mock('../../config/env.config', () => ({
  default: mockEnv,
}));

import { signToken, verifyToken } from '../auth';

describe('auth utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEnv.jwt.secret = 'test-secret';
    mockEnv.jwt.expiresIn = '7d';
  });

  describe('signToken', () => {
    it('throws when JWT secret is missing', () => {
      mockEnv.jwt.secret = '';

      expect(() => signToken({ userId: 1 })).toThrow('JWT_SECRET is not set');
    });

    it('signs token with payload and options', () => {
      mockJwtSign.mockReturnValue('signed-token');

      const token = signToken({ userId: 2 });

      expect(mockJwtSign).toHaveBeenCalledWith({ userId: 2 }, 'test-secret', { expiresIn: '7d' });
      expect(token).toBe('signed-token');
    });
  });

  describe('verifyToken', () => {
    it('throws when JWT secret is missing', () => {
      mockEnv.jwt.secret = '';

      expect(() => verifyToken('token')).toThrow('JWT_SECRET is not set');
    });

    it('throws when decoded payload is a string', () => {
      mockJwtVerify.mockReturnValue('payload');

      expect(() => verifyToken('token')).toThrow('Token payload must be an object');
    });

    it('returns decoded payload object', () => {
      const payload = { userId: 3 };
      mockJwtVerify.mockReturnValue(payload);

      const result = verifyToken('token');

      expect(mockJwtVerify).toHaveBeenCalledWith('token', 'test-secret');
      expect(result).toEqual(payload);
    });
  });
});
