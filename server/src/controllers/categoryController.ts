import { NextFunction, Request, Response } from 'express';
import { prisma } from '../config/db.config';

export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.category.findMany();
    res.status(200).json(categories);
  } catch (error) {
    next(error);
  }
};


