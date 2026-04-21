import { describe, expect, it } from 'vitest';
import type { Request } from 'express';

import { createPaginatedResponse, getPaginationParams } from '../pagination';

const createReq = (query: Record<string, string | undefined>): Request => {
  return { query } as unknown as Request;
};

describe('pagination utils', () => {
  describe('getPaginationParams', () => {
    it('uses defaults when query is empty', () => {
      const req = createReq({});

      expect(getPaginationParams(req)).toEqual({ page: 1, limit: 10, skip: 0 });
    });

    it('parses page and limit from query', () => {
      const req = createReq({ page: '2', limit: '25' });

      expect(getPaginationParams(req)).toEqual({ page: 2, limit: 25, skip: 25 });
    });

    it('clamps page and limit to minimum 1', () => {
      const req = createReq({ page: '0', limit: '-5' });

      expect(getPaginationParams(req)).toEqual({ page: 1, limit: 1, skip: 0 });
    });
  });

  describe('createPaginatedResponse', () => {
    it('returns data and metadata', () => {
      const result = createPaginatedResponse([{ id: 1 }], 42, 2, 10);

      expect(result).toEqual({
        data: [{ id: 1 }],
        meta: {
          total: 42,
          page: 2,
          limit: 10,
          totalPages: 5,
        },
      });
    });
  });
});
