import { Router } from 'express';
import { getPublishedArticles, getPublishedArticleById, getArticlesForUser, getArticleForUserById, addArticle, deleteArticle, updateArticle, reviewArticle, getArticleStats } from '../controllers/articleController';
import { authenticate } from '../middleware/authenticate';
import { uploadThumbnail } from '../config/upload.config';

const router = Router();

router.post('/', authenticate, uploadThumbnail.single('thumbnail'), addArticle);
router.put('/:id', authenticate, uploadThumbnail.single('thumbnail'), updateArticle);
router.delete('/:id', authenticate, deleteArticle);
router.patch('/:id/review', authenticate, reviewArticle);

router.get('/', getPublishedArticles);

router.get('/stats', authenticate, getArticleStats);
router.get('/me', authenticate, getArticlesForUser);
router.get('/me/:id', authenticate, getArticleForUserById);

router.get('/:id', getPublishedArticleById);


export default router;