import { Router } from 'express';
import { getPublishedArticles, getPublishedArticleById, getArticlesForUser, getArticleForUserById } from '../controllers/articleController';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.get('/', getPublishedArticles);

router.get('/me', authenticate, getArticlesForUser);
router.get('/me/:id', authenticate, getArticleForUserById);

router.get('/:id', getPublishedArticleById);


export default router;