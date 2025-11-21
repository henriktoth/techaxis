import { Router } from 'express';
import { getPublishedArticles, getPublishedArticleById } from '../controllers/articleController';

const router = Router();

// Test route
router.get('/', getPublishedArticles);

router.get('/:id', getPublishedArticleById);

export default router;