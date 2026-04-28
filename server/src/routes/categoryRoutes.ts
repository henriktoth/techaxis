import { Router } from 'express';
import { createCategory, deleteCategory, getCategories, getCategoryById, updateCategory } from '../controllers/categoryController';
import { authenticate } from '../middleware/authenticate';
import { authorizeAdmin } from '../middleware/authorizeAdmin';

const router = Router();

router.get('/', getCategories);
router.get('/:id', getCategoryById);
router.post('/', authenticate, authorizeAdmin, createCategory);
router.put('/:id', authenticate, authorizeAdmin, updateCategory);
router.delete('/:id', authenticate, authorizeAdmin, deleteCategory);


export default router;