import { Router } from 'express';
import { createCategory, deleteCategory, getCategories, getCategoryById, updateCategory } from '../controllers/categoryController';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.get('/', getCategories);
router.get('/:id', getCategoryById);
router.post('/',  authenticate, createCategory);
router.put('/:id', authenticate, updateCategory);
router.delete('/:id', authenticate, deleteCategory);


export default router;