import { NextFunction, Request, Response } from 'express';
import { prisma } from '../config/db.config';

/**
 * Get all categories.
 * @returns 200 with categories or 500 if server error
 */
export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.category.findMany();
    res.status(200).json(categories);
  } catch (error) {
    next(error);
  }
};


