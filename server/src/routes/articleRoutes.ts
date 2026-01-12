import { Router } from 'express';
import { getPublishedArticles, getPublishedArticleById, getArticlesForUser, getArticleForUserById, addArticle, deleteArticle, updateArticle, reviewArticle } from '../controllers/articleController';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.post('/', authenticate, addArticle);
router.put('/:id', authenticate, updateArticle);
router.delete('/:id', authenticate, deleteArticle);
router.patch('/:id/review', authenticate, reviewArticle);

router.get('/', getPublishedArticles);

router.get('/me', authenticate, getArticlesForUser);
router.get('/me/:id', authenticate, getArticleForUserById);

router.get('/:id', getPublishedArticleById);


export default router;