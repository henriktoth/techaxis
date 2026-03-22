import { Request } from 'express';

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Utility function to extract pagination parameters from the request query.
 * @param req Express request object
 * @returns An object containing page, limit, and skip values for pagination
 */
export const getPaginationParams = (req: Request): { page: number; limit: number; skip: number } => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.max(1, Number(req.query.limit) || 10);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

/**
 * Utility function to create a paginated response object.
 * @param data The array of items for the current page
 * @param total The total number of items across all pages
 * @param page The current page number
 * @param limit The number of items per page
 * @returns An object containing the paginated data and metadata
 */
export const createPaginatedResponse = <T>(data: T[], total: number, page: number, limit: number): PaginatedResult<T> => {
  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};
