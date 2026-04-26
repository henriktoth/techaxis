import { NextFunction, Request, Response } from 'express';
import { prisma } from '../config/db.config';

/**
 * Get all categories.
 * @returns 200 with array of categories
 */
export const getCategories = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.category.findMany();
    
    res.status(200).json(categories);
  } catch (error) {
    next(error);
  }
};

/**
 * Get a category by id.
 * @returns 200 with category, 400 if invalid id, 404 if not found
 */
export const getCategoryById = async (req: Request, res: Response, next: NextFunction) => {
  try{
    const categoryId = parseInt(req.params.id, 10);
    if (isNaN(categoryId)) {
      return res.status(400).json({ message: 'Invalid category ID' });
    }
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
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

/**
 * Create a new category.
 * @returns 201 with created category, 400 if name missing, 409 if category with same name exists
 */
export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = req.body || {};
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }
    
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
 * If the category has articles, their categoryId is reassigned to the one corresponding to "Other".
 * @returns 200 with deleted category, 400 if invalid id or trying to delete "Other", 404 if not found, 500 if "Other" category missing
 */
export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
    const categoryId = parseInt(req.params.id, 10);
    if (isNaN(categoryId)) {
        return res.status(400).json({ message: 'Invalid category id' });
    }

    try {
    const otherCategory = await prisma.category.findFirst({
      where: { name: 'Other' }
    });

    if (!otherCategory) {
      return res.status(500).json({ message: 'Default "Other" category not found' });
    }

    if (categoryId === otherCategory.id) {
       return res.status(400).json({ message: 'Cannot delete the default "Other" category' });
    }

        const category = await prisma.category.findUnique({
            where: { id: categoryId }
        });

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        await prisma.article.updateMany({
            where: { categoryId },
            data: { categoryId: otherCategory.id }
        });

        const deletedCategory = await prisma.category.delete({
            where: { id: categoryId }
        });

        res.status(200).json(deletedCategory);
    } catch (error) {
        next(error);
    }
};

/**
 * Update a category.
 * @returns 200 with updated category, 400 if invalid id or name missing, 404 if not found
 */
export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categoryId = parseInt(req.params.id, 10);
    if (isNaN(categoryId)) {
      return res.status(400).json({ message: 'Invalid category ID' });
    }

    const { name } = req.body || {};
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }
    
    const categoryExists = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!categoryExists) {
      return res.status(404).json({ message: 'Category not found' });
    }
    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: { name },
    });

    res.status(200).json(updatedCategory);
  } catch (error) {
    next(error);
  }
};
