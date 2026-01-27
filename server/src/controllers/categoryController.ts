import e, { NextFunction, Request, Response } from 'express';
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

export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.body) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const { name } = req.body;
    
    const newCategory = await prisma.category.create({
      data: {
        name
      }
    });
    
    res.status(201).json(newCategory);
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (isNaN(Number(id))) {
      return res.status(400).json({ message: 'Invalid category ID' });
    }
    
    const categoryExists = await prisma.category.findUnique({
      where: { id: Number(id) },
    });

    if (!categoryExists) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const deletedCategory = await prisma.category.delete({
      where: { id: Number(id) },
    });
    
    res.status(200).json(deletedCategory);
  }
  catch (error) {
    next(error);
  }
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (isNaN(Number(id))) {
      return res.status(400).json({ message: 'Invalid category ID' });
    }

    if (!req.body) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const { name } = req.body;
    
    const categoryExists = await prisma.category.findUnique({
      where: { id: Number(id) },
    });

    if (!categoryExists) {
      return res.status(404).json({ message: 'Category not found' });
    }
    const updatedCategory = await prisma.category.update({
      where: { id: Number(id) },
      data: { name },
    });

    res.status(200).json(updatedCategory);
  } catch (error) {
    next(error);
  }
};
