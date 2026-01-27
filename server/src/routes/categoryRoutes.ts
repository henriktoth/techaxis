import { Router } from 'express';
import { createCategory, deleteCategory, getCategories, getCategoryById, updateCategory } from '../controllers/categoryController';

const router = Router();

router.get('/', getCategories);
router.get('/:id', getCategoryById);
router.post('/', createCategory);
router.delete('/:id', deleteCategory);
router.put('/:id', updateCategory);

export default router;