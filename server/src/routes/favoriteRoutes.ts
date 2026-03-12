import { Router } from 'express';
import { getFavorites, addFavorite, removeFavorite, checkFavorite, getFavoriteIds } from '../controllers/favoriteController';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.get('/', authenticate, getFavorites);
router.get('/ids', authenticate, getFavoriteIds);
router.get('/:articleId/check', authenticate, checkFavorite);
router.post('/:articleId', authenticate, addFavorite);
router.delete('/:articleId', authenticate, removeFavorite);

export default router;
