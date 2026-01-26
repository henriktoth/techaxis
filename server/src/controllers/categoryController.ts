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

export const getCategoryById = async (req: Request, res: Response, next: NextFunction) => {
  try{
    const { id } = req.params;
    if (isNaN(Number(id))) {
      return res.status(400).json({ message: 'Invalid category ID' });
    }
    const category = await prisma.category.findUnique({
      where: { id: Number(id) },
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.status(200).json(category);
  }
  catch (error) {
    next(error);
  }
};
