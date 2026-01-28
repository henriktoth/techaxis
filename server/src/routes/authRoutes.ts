import { Router } from 'express';
import { login, register, getUser } from '../controllers/authController';
import { authenticate } from '../middleware/authenticate';
import { authorizeAdmin } from '../middleware/authorizeAdmin';

const router = Router();

router.post('/login', login);
router.post('/register', authenticate, authorizeAdmin, register);
router.get('/me', authenticate, getUser);

export default router;