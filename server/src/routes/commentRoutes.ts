import express from 'express';
import { authenticate } from '../middleware/authenticate';
import { createComment, getCommentsByArticle, deleteComment } from '../controllers/commentController';

const router = express.Router();

router.post('/', authenticate, createComment);
router.get('/article/:articleId', getCommentsByArticle);
router.delete('/:id', authenticate, deleteComment);

export default router;
