import { Router } from 'express';
import { login, register, logout, getUser } from '../controllers/authController';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/logout', logout);
router.get('/me', authenticate, getUser);

export default router;