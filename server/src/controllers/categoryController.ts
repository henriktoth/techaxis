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

export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.body) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const { name } = req.body;
    
    const categoryExists = await prisma.category.findUnique({
      where: { name },
    });

    if (categoryExists) {
      return res.status(409).json({ message: 'Category already exists' });
    }
    
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

/**
 * Delete a category.
 * If the category has articles, their categoryId is reassigned to 5 (Other).
 * @param req.params.id Category id
 */
export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid category id' });
    }

    if (id === 5) {
         return res.status(400).json({ message: 'Cannot delete the default "Other" category' });
    }

    try {
        const category = await prisma.category.findUnique({
            where: { id }
        });

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        await prisma.article.updateMany({
            where: { categoryId: id },
            data: { categoryId: 5 }
        });

        const deletedCategory = await prisma.category.delete({
            where: { id }
        });

        res.status(200).json(deletedCategory);
    } catch (error) {
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
